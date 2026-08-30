# Gated Dynt MCP tools (generated)

Not on `https://api.dynt.ai` yet — enabled per environment behind a server flag. Source: https://dynt-server-sandbox.onrender.com/v1/public/agent-tools/spec · 2 tool(s). Do not edit by hand — run `npm run generate:tools`.

Skills may mention these with the wording "when the server offers it"; check the tool list at runtime before relying on them.

| Tool | CLI | Access | Read-only | Destructive | Purpose |
|---|---|---|---|---|---|
| `list_findings` | `dynt findings list` | read | yes | no | List what needs the user's attention, ordered by money at stake: duplicate charges, subscription price increases, subscriptions that stopped charging, clusters of missing receipts. |
| `update_finding` | `dynt findings update` | write | no | no | Record the user's decision on one finding: snoozed (deal with it later, until a date), resolved (handled), or not_a_problem (the detection was wrong here — this teaches the detector for this organization). |
