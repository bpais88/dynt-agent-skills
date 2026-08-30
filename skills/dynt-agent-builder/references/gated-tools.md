# Gated Dynt MCP tools (generated)

Not on `https://api.dynt.ai` yet — enabled per environment behind a server flag. Source: https://dynt-server-sandbox.onrender.com/v1/public/agent-tools/spec · 2 tool(s). Do not edit by hand — run `npm run generate:tools`.

Skills may mention these with the wording "when the server offers it"; check the tool list at runtime before relying on them.

| Tool | CLI | Access | Read-only | Destructive | Purpose |
|---|---|---|---|---|---|
| `list_findings` | `dynt findings list` | read | yes | no | List what needs the user's attention, ordered by money at stake: duplicate charges, subscription price increases, subscriptions that stopped charging, clusters of missing receipts. Each finding has a one-sentence evidence title, a confidence (0–1), the amount at stake in EUR and the transaction ids behind it |
| `update_finding` | `dynt findings update` | write | no | no | Record the user's decision on one finding: snoozed (deal with it later, until a date), resolved (handled), or not_a_problem (the detection was wrong here — this teaches the detector for this organization) |

## Inputs

### `list_findings`

List what needs the user's attention, ordered by money at stake: duplicate charges, subscription price increases, subscriptions that stopped charging, clusters of missing receipts. Each finding has a one-sentence evidence title, a confidence (0–1), the amount at stake in EUR and the transaction ids behind it. Use when the user asks what needs attention, where money is leaking, whether anything is wrong, or for a weekly review — call it first and do not recompute these from list_transactions. Do not use for data-quality anomalies like duplicate merchants (use list_anomalies). Returns open findings by default; expired snoozes count as open.

| Input | Type | Required | Description |
|---|---|---|---|
| `status` | array of enum(open \| snoozed \| resolved \| not_a_problem) | no | Default: open (including snoozes that have expired). |
| `type` | array of enum(duplicate_charge \| price_increase \| subscription_stopped \| unused_subscription \| missing_receipt_cluster \| unusual_charge) | no |  |
| `limit` | integer | no |  |

### `update_finding`

Record the user's decision on one finding: snoozed (deal with it later, until a date), resolved (handled), or not_a_problem (the detection was wrong here — this teaches the detector for this organization). Use when the user has said what they want done with a finding from list_findings. Do not mark not_a_problem on your own judgement, and do not use it to change transactions (it only changes the finding's status). Returns the finding's new status.

| Input | Type | Required | Description |
|---|---|---|---|
| `findingId` | string | yes |  |
| `status` | string (snoozed \| resolved \| not_a_problem) | yes | snoozed = deal with it later (needs snoozedUntil); not_a_problem = the detection was wrong for this organization; resolved = handled. |
| `snoozedUntil` | string | no | YYYY-MM-DD (a real calendar date), required when status is snoozed |
| `resolution` | string | no |  |

