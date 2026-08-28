// skills/ is the source of truth. This vendors it into plugins/dynt/skills and
// keeps the plugin manifests' version in step with package.json.
// `--check` fails when the vendored copy is stale (used in CI).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const check = process.argv.includes("--check");
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const src = "skills", dst = "plugins/dynt/skills";
const tree = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? tree(p) : [p]; }).sort();
const digest = (dir) => existsSync(dir) ? tree(dir).map((p) => p.slice(dir.length) + ":" + readFileSync(p, "utf8")).join("\n") : "";
const manifests = {
  "plugins/dynt/.claude-plugin/plugin.json": { name: "dynt", version, description: "Run a company's finances with your agent: Dynt's MCP server plus skills for receipts, subscriptions, month-end, cleanup and anomaly triage", author: { name: "Dynt", url: "https://dynt.ai" }, homepage: "https://dynt.ai", repository: "https://github.com/bpais88/dynt-agent-skills", license: "MIT", keywords: ["dynt", "finance", "fintech", "accounting", "banking", "mcp"], skills: "./skills/", mcpServers: "./mcp.json" },
  "plugins/dynt/.cursor-plugin/plugin.json": { name: "dynt", displayName: "Dynt", version, description: "Run a company's finances with your agent: Dynt's MCP server plus skills", author: { name: "Dynt", email: "hello@dynt.ai" }, homepage: "https://dynt.ai", repository: "https://github.com/bpais88/dynt-agent-skills", license: "MIT", keywords: ["dynt", "finance", "fintech", "accounting", "banking", "mcp", "cursor"], skills: "./skills/", mcpServers: "./mcp.json" },
  "plugins/dynt/mcp.json": { mcpServers: { dynt: { type: "http", url: "https://api.dynt.ai/mcp" } } },
};
if (check) {
  let stale = digest(src) !== digest(dst);
  for (const [p, body] of Object.entries(manifests)) if (!existsSync(p) || readFileSync(p, "utf8") !== JSON.stringify(body, null, 2) + "\n") stale = true;
  if (stale) { console.error("plugins/dynt is out of date — run `npm run sync:plugins`"); process.exit(1); }
  console.log("plugins/dynt is in sync"); process.exit(0);
}
rmSync(dst, { recursive: true, force: true }); mkdirSync(dst, { recursive: true }); cpSync(src, dst, { recursive: true });
for (const [p, body] of Object.entries(manifests)) { mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, JSON.stringify(body, null, 2) + "\n"); }
console.log("plugins/dynt synced");
