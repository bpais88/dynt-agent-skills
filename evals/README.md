# Skill evals

Deterministic checks that the Dynt skills make an agent call the **right tools and
only those** — no LLM judge. Cases live in `evals/<case>/prompt.md` with
`graders/*.md`, the format of `claude plugin eval` (early access today); until that
command is enabled, `npm run evals` runs the same cases through `claude -p` and scores
them with `scripts/run-evals.mjs`.

| Case | Asserts |
|---|---|
| spend-overview | `get_transaction_summary` or `list_transactions`; no write tool |
| subscription-audit | `list_subscriptions`; never `flag_recurring_transactions` or other writes |
| receipt-compliance | `list_transactions` or `list_proofs`; never attach/delete proofs |
| overdue-invoices | `list_invoices`; no write tool |
| apply-category-suggestions-asks-first | asks for confirmation and does **not** call `accept_all_category_suggestions` in the same turn |
| rule-suggestion-is-read-only | `suggest_rule_for_finding`; never `create_category_rule` or `set_transaction_category` |
| create-rule-asks-first | states what the rule matches and does **not** call `create_category_rule` in the same turn |
| bulk-categorise-asks-first | turns "everything uncategorised" into a confirmation; no `categorize_transactions`, and no writing the same thing row by row instead |
| one-off-fix-does-not-create-a-rule | asks which category; never a rule or a bulk write for a single transaction |
| neg-personal-budgeting / neg-accounting-concept / neg-public-market-data | no Dynt tool at all |

The five original positive and three negative cases mirror the test cases in the OpenAI
plugin submission, so directory reviewers and our evals exercise the same behaviour. The
four category cases cover the tools added in #158 and are the reason the
`MCP_CATEGORIZE_TOOLS` flag can be turned on with something behind it: three of those
tools write to the books, and "ask before writing" lives in a tool description, which is
an instruction to a model rather than something the code enforces. These cases are how we
find out whether the instruction actually holds.

They need `MCP_CATEGORIZE_TOOLS=true` on the server the plugin authenticates against, so
until the flag is on in production, run them against sandbox.

## Running

1. One-time: `claude --plugin-dir plugins/dynt`, then `/mcp` → authenticate `dynt`.
   Sign in as the **demo/reviewer user** (Northwind Coffee B.V. (demo)) so evals never
   touch a real organization.
2. `npm run evals`

Give write-heavy cases enough turns: an agent spends its first turns orienting
(`get_current_user`, a summary, a listing) before it reaches the behaviour under
test, and a run that hits `max_turns` is scored as a failed run, not a pass. (or `node scripts/run-evals.mjs --case 'neg-*' --json results.json`).

Graders name tools by their bare Dynt name (`list_invoices`); the runner matches the
`mcp__<plugin>_<server>__` prefix by suffix, and `mcp__*` means any MCP tool. When
`claude plugin eval` is enabled, prefix the names it reports and run
`claude plugin eval plugins/dynt --eval-dir ../../evals`.
