#!/usr/bin/env node
/**
 * Skill evals — runs each case in evals/<case>/ (claude plugin eval format:
 * prompt.md + graders/*.md) through `claude -p` and scores the graders
 * deterministically. Stand-in until `claude plugin eval` leaves early access;
 * the case files are already in its format.
 *
 * Supported graders: tool_used (tool matched by exact name or by `__<name>`
 * suffix, `mcp__*` = any MCP tool), regex (target last_message | trace).
 *
 * Usage: node scripts/run-evals.mjs [--case <glob>] [--json out.json] [--model m]
 * Needs the plugin's MCP server authenticated once in an interactive session:
 *   claude --plugin-dir plugins/dynt   →  /mcp  →  authenticate "dynt"
 * Sign in as the demo/reviewer user so evals never touch a real organization.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const evalDir = join(root, "evals");
const pluginDir = join(root, "plugins", "dynt");
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const caseGlob = opt("--case") ?? "*";
const jsonOut = opt("--json");
const model = opt("--model");

const globRe = new RegExp("^" + caseGlob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");

function frontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(md);
  if (!m) return [{}, md];
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^\d+$/.test(v)) v = Number(v);
    else if (/^'.*'$/.test(v) || /^".*"$/.test(v)) v = v.slice(1, -1);
    else if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    fm[kv[1]] = v;
  }
  return [fm, m[2].trim()];
}

function loadCases() {
  return readdirSync(evalDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "results" && d.name !== "mocks" && globRe.test(d.name))
    .map((d) => {
      const dir = join(evalDir, d.name);
      const [fm, prompt] = frontmatter(readFileSync(join(dir, "prompt.md"), "utf8"));
      const gdir = join(dir, "graders");
      const graders = existsSync(gdir)
        ? readdirSync(gdir).filter((f) => f.endsWith(".md")).map((f) => {
            const [g, why] = frontmatter(readFileSync(join(gdir, f), "utf8"));
            return { name: f.replace(/\.md$/, ""), why, ...g };
          })
        : [];
      return { name: d.name, fm, prompt, graders };
    });
}

/** Discover the MCP tool names the plugin exposes (also tells us the prefix). */
function discoverTools() {
  const r = runClaude("say ok", { maxTurns: 1 });
  const dynt = r.tools.filter((t) => t.startsWith("mcp__"));
  const server = r.mcpServers.find((s) => /dynt/i.test(s.name));
  return { tools: dynt, server };
}

function runClaude(prompt, { maxTurns, allowedTools = [] }) {
  const argv = ["-p", prompt, "--plugin-dir", pluginDir, "--output-format", "stream-json", "--verbose", "--max-turns", String(maxTurns)];
  if (model) argv.push("--model", model);
  if (allowedTools.length) argv.push("--allowedTools", ...allowedTools);
  const started = Date.now();
  const res = spawnSync("claude", argv, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const events = res.stdout.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const init = events.find((e) => e.type === "system" && e.subtype === "init") ?? {};
  const toolCalls = [];
  let lastMessage = "";
  for (const e of events) {
    if (e.type === "assistant") {
      for (const b of e.message?.content ?? []) {
        if (b.type === "tool_use") toolCalls.push({ name: b.name, input: b.input });
        if (b.type === "text" && b.text) lastMessage = b.text;
      }
    }
    if (e.type === "result" && typeof e.result === "string" && e.result) lastMessage = e.result;
  }
  const result = events.find((e) => e.type === "result") ?? {};
  return {
    tools: init.tools ?? [], mcpServers: init.mcp_servers ?? [], toolCalls, lastMessage,
    costUsd: result.total_cost_usd ?? null, durationMs: Date.now() - started, stderr: res.stderr,
    trace: toolCalls.map((c) => JSON.stringify(c)).join("\n"),
  };
}

function toolMatches(pattern, name) {
  if (pattern === "mcp__*") return name.startsWith("mcp__");
  if (pattern === name) return true;
  return name.startsWith("mcp__") && name.endsWith("__" + pattern);
}

function grade(g, run) {
  if (g.type === "tool_used") {
    const n = run.toolCalls.filter((c) => toolMatches(g.tool, c.name)).length;
    const min = g.min ?? 1, max = g.max ?? Infinity;
    return { passed: n >= min && n <= max, details: `${g.tool} called ${n}× (min ${min}, max ${max === Infinity ? "∞" : max})` };
  }
  if (g.type === "regex") {
    const hay = g.target === "trace" ? run.trace : run.lastMessage;
    const re = new RegExp(g.pattern, g.flags ?? "");
    const hit = re.test(hay);
    const want = (g.match ?? "contains") === "contains";
    return { passed: hit === want, details: `${want ? "expected" : "forbade"} /${g.pattern}/ in ${g.target ?? "last_message"} → ${hit ? "found" : "not found"}` };
  }
  return { passed: false, details: `unsupported grader type ${g.type}` };
}

const cases = loadCases();
if (!cases.length) { console.error("No eval cases found"); process.exit(1); }
const disc = discoverTools();
if (!disc.tools.length) {
  console.error(`Dynt MCP tools not available inside claude -p (server: ${JSON.stringify(disc.server)}).`);
  console.error(`Authenticate once: claude --plugin-dir plugins/dynt → /mcp → authenticate. Sign in as the demo/reviewer user.`);
  process.exit(2);
}
console.error(`Discovered ${disc.tools.length} Dynt tools (prefix ${disc.tools[0].replace(/__[^_]+$/, "__")})`);

const out = { schemaVersion: "local-v1", generatedAt: new Date().toISOString(), cases: [], aggregates: { passCount: 0, failCount: 0, costUsd: 0 } };
for (const c of cases) {
  const run = runClaude(c.prompt, { maxTurns: c.fm.max_turns ?? 10, allowedTools: [...disc.tools, "Skill"] });
  const graders = c.graders.map((g) => ({ name: g.name, type: g.type, ...grade(g, run) }));
  const passed = graders.every((g) => g.passed);
  out.aggregates[passed ? "passCount" : "failCount"]++;
  out.aggregates.costUsd += run.costUsd ?? 0;
  out.cases.push({ name: c.name, passed, tools: run.toolCalls.map((t) => t.name), costUsd: run.costUsd, durationMs: run.durationMs, graders, lastMessage: run.lastMessage.slice(0, 400) });
  console.log(`${passed ? "PASS" : "FAIL"}  ${c.name}  [${run.toolCalls.map((t) => t.name.replace(/^mcp__.*__/, "")).join(", ") || "no tools"}]  $${(run.costUsd ?? 0).toFixed(3)}`);
  for (const g of graders) if (!g.passed) console.log(`      ✗ ${g.name}: ${g.details}`);
}
console.log(`\n${out.aggregates.passCount}/${cases.length} cases passed · $${out.aggregates.costUsd.toFixed(2)}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(out, null, 2));
process.exit(out.aggregates.failCount ? 1 : 0);
