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
| neg-personal-budgeting / neg-accounting-concept / neg-public-market-data | no Dynt tool at all |

The five positive and three negative cases mirror the test cases in the OpenAI plugin
submission, so directory reviewers and our evals exercise the same behaviour.

## Running

1. One-time: `claude --plugin-dir plugins/dynt`, then `/mcp` → authenticate `dynt`.
   Sign in as the **demo/reviewer user** (Northwind Coffee B.V. (demo)) so evals never
   touch a real organization.
2. `npm run evals` (or `node scripts/run-evals.mjs --case 'neg-*' --json results.json`).

Graders name tools by their bare Dynt name (`list_invoices`); the runner matches the
`mcp__<plugin>_<server>__` prefix by suffix, and `mcp__*` means any MCP tool. When
`claude plugin eval` is enabled, prefix the names it reports and run
`claude plugin eval plugins/dynt --eval-dir ../../evals`.
