// Structural checks beyond skills-ref: every skill has frontmatter name === dir,
// a description with trigger phrases, mentions the router unless it is the router,
// and every referenced MCP tool exists in the generated tools reference.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
const skills = readdirSync("skills");
const toolNames = (file) => existsSync(file) ? [...readFileSync(file, "utf8").matchAll(/^\| `([a-z_]+)` \|/gm)].map((m) => m[1]) : [];
// Production catalogue plus tools that are gated per environment (documented separately, on purpose).
const tools = new Set([...toolNames("skills/dynt-agent-builder/references/tools.md"), ...toolNames("skills/dynt-agent-builder/references/gated-tools.md")]);
let failed = false;
for (const name of skills) {
  const p = `skills/${name}/SKILL.md`;
  if (!existsSync(p)) { console.error(`${name}: missing SKILL.md`); failed = true; continue; }
  const s = readFileSync(p, "utf8");
  const fm = s.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { console.error(`${name}: no frontmatter`); failed = true; continue; }
  if (!new RegExp(`^name: ${name}$`, "m").test(fm[1])) { console.error(`${name}: frontmatter name must equal directory`); failed = true; }
  if (!/description:/.test(fm[1])) { console.error(`${name}: missing description`); failed = true; }
  if (!/Use\s+when/.test(fm[1])) { console.error(`${name}: description should say when to use it`); failed = true; }
  if (name !== "dynt" && !/`dynt` skill/.test(s)) { console.error(`${name}: should point to the parent \`dynt\` skill`); failed = true; }
  for (const m of s.matchAll(/`([a-z_]+)`/g)) {
    const t = m[1];
    if (/^(list|get|attach|delete|accept|flag|search|lookup)_[a-z_]+$/.test(t) && !tools.has(t)) { console.error(`${name}: references unknown tool ${t}`); failed = true; }
  }
  if (s.split("\n").length > 500) { console.error(`${name}: SKILL.md exceeds 500 lines`); failed = true; }
}
for (const name of skills) { try { execSync(`npx skills-ref validate ./skills/${name}`, { stdio: "inherit" }); } catch { failed = true; } }
if (failed) process.exit(1);
console.log(`${skills.length} skills valid`);
