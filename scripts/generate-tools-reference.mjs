// Regenerates skills/dynt-agent-builder/references/tools.md from the live tool
// catalogue so the skills can never drift from what the MCP server exposes.
import { writeFileSync, mkdirSync } from "node:fs";
const SPEC = process.env.DYNT_SPEC_URL || "https://api.dynt.ai/v1/public/agent-tools/spec";
const spec = await (await fetch(SPEC, { headers: { "user-agent": "dynt-agent-skills/tools-ref" } })).json();
const lines = [
  "# Dynt MCP tools (generated)", "",
  `Source: ${SPEC} · catalogue hash \`${spec.hash}\` · ${spec.tools.length} tools. Do not edit by hand — run \`npm run generate:tools\`.`, "",
  "| Tool | CLI | Access | Read-only | Destructive | Purpose |", "|---|---|---|---|---|---|",
];
for (const t of spec.tools) {
  const purpose = t.description.split(". Use when")[0].replace(/\|/g, "\\|");
  lines.push(`| \`${t.name}\` | \`dynt ${t.resource} ${t.alias}\` | ${t.access} | ${t.annotations.readOnlyHint ? "yes" : "no"} | ${t.annotations.destructiveHint ? "yes" : "no"} | ${purpose} |`);
}
lines.push("", "## Inputs", "");
for (const t of spec.tools) {
  const props = t.inputSchema?.properties ?? {};
  const req = new Set(t.inputSchema?.required ?? []);
  lines.push(`### \`${t.name}\``, "", t.description, "");
  const keys = Object.keys(props);
  if (!keys.length) { lines.push("_No inputs._", ""); continue; }
  lines.push("| Input | Type | Required | Description |", "|---|---|---|---|");
  for (const k of keys) {
    const p = props[k]; const type = p.type ?? (p.enum ? `enum(${p.enum.join("|")})` : p.anyOf ? "mixed" : "any");
    lines.push(`| \`${k}\` | ${type}${p.enum && p.type ? ` (${p.enum.join("|")})` : ""} | ${req.has(k) ? "yes" : "no"} | ${(p.description ?? "").replace(/\|/g, "\\|")} |`);
  }
  lines.push("");
}
mkdirSync("skills/dynt-agent-builder/references", { recursive: true });
writeFileSync("skills/dynt-agent-builder/references/tools.md", lines.join("\n") + "\n");
console.log(`tools.md regenerated from ${spec.tools.length} tools (hash ${spec.hash.slice(0, 12)})`);
