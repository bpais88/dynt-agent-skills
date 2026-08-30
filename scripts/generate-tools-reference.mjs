// Regenerates skills/dynt-agent-builder/references/tools.md from the live tool
// catalogue so the skills can never drift from what the MCP server exposes.
import { writeFileSync, mkdirSync } from "node:fs";
const SPEC = process.env.DYNT_SPEC_URL || "https://api.dynt.ai/v1/public/agent-tools/spec";
// Tools that exist but are gated off in production (feature flags) are documented
// separately, from the environment where they are on, so tools.md always says
// exactly what api.dynt.ai serves.
const GATED_SPEC = process.env.DYNT_GATED_SPEC_URL || "https://dynt-server-sandbox.onrender.com/v1/public/agent-tools/spec";
const fetchSpec = async (url) => (await fetch(url, { headers: { "user-agent": "dynt-agent-skills/tools-ref" } })).json();
const spec = await fetchSpec(SPEC);
/** One summary row per tool; the same shape in both references. */
const summaryTable = (tools) => {
  const rows = ["| Tool | CLI | Access | Read-only | Destructive | Purpose |", "|---|---|---|---|---|---|"];
  for (const t of tools) {
    const purpose = t.description.split(". Use when")[0].replace(/\|/g, "\\|");
    rows.push(`| \`${t.name}\` | \`dynt ${t.resource} ${t.alias}\` | ${t.access} | ${t.annotations.readOnlyHint ? "yes" : "no"} | ${t.annotations.destructiveHint ? "yes" : "no"} | ${purpose} |`);
  }
  return rows;
};

/**
 * Human-readable type for one JSON Schema property, including the allowed
 * values — for arrays those live under `items`, and an agent that cannot see
 * them will send rejected calls. Pipes are escaped: an unescaped one ends the
 * markdown table cell.
 */
const typeOf = (p) => {
  if (!p) return "any";
  const enums = (e) => e.map(String).join(" \\| ");
  if (p.type === "array") {
    const it = p.items ?? {};
    const inner = it.enum ? `enum(${enums(it.enum)})` : it.type ? typeOf(it) : "any";
    return `array of ${inner}`;
  }
  if (p.enum) return p.type ? `${p.type} (${enums(p.enum)})` : `enum(${enums(p.enum)})`;
  if (p.type) return p.type;
  if (p.anyOf) return "mixed";
  return "any";
};

/** Full description + argument table per tool; builders rely on this for required inputs. */
const inputSections = (tools) => {
  const out = ["", "## Inputs", ""];
  for (const t of tools) {
    const props = t.inputSchema?.properties ?? {};
    const req = new Set(t.inputSchema?.required ?? []);
    out.push(`### \`${t.name}\``, "", t.description, "");
    const keys = Object.keys(props);
    if (!keys.length) { out.push("_No inputs._", ""); continue; }
    out.push("| Input | Type | Required | Description |", "|---|---|---|---|");
    for (const k of keys) {
      out.push(`| \`${k}\` | ${typeOf(props[k])} | ${req.has(k) ? "yes" : "no"} | ${(props[k].description ?? "").replace(/\|/g, "\\|")} |`);
    }
    out.push("");
  }
  return out;
};

const lines = [
  "# Dynt MCP tools (generated)", "",
  `Source: ${SPEC} · catalogue hash \`${spec.hash}\` · ${spec.tools.length} tools. Do not edit by hand — run \`npm run generate:tools\`.`, "",
  ...summaryTable(spec.tools),
  ...inputSections(spec.tools),
];
mkdirSync("skills/dynt-agent-builder/references", { recursive: true });
writeFileSync("skills/dynt-agent-builder/references/tools.md", lines.join("\n") + "\n");
console.log(`tools.md regenerated from ${spec.tools.length} tools (hash ${spec.hash.slice(0, 12)})`);

// ── gated-tools.md: what the flagged environment serves that production does not ──
try {
  const gated = await fetchSpec(GATED_SPEC);
  const prodNames = new Set(spec.tools.map((t) => t.name));
  const extra = gated.tools.filter((t) => !prodNames.has(t.name));
  const g = [
    "# Gated Dynt MCP tools (generated)", "",
    `Not on \`${SPEC.replace(/\/v1.*$/, "")}\` yet — enabled per environment behind a server flag. Source: ${GATED_SPEC} · ${extra.length} tool(s). Do not edit by hand — run \`npm run generate:tools\`.`, "",
    "Skills may mention these with the wording \"when the server offers it\"; check the tool list at runtime before relying on them.", "",
    ...summaryTable(extra),
    ...inputSections(extra),
  ];
  writeFileSync("skills/dynt-agent-builder/references/gated-tools.md", g.join("\n") + "\n");
  console.log(`gated-tools.md regenerated: ${extra.length} tool(s) beyond production`);
} catch (e) {
  console.warn(`gated-tools.md not regenerated: ${e.message}`);
}
