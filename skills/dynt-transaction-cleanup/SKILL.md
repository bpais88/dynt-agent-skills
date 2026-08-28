---
name: dynt-transaction-cleanup
description: >-
  Review transactions that need categorization or merchant matching, preview
  Dynt's pending suggestions, and apply them in bulk only after approval. Use
  when a user asks to categorize transactions, "clean up", "apply suggestions",
  "fix merchants", "needs review", uncategorized spending, or wants their
  bookkeeping queue reduced in Dynt.
metadata:
  parent: dynt
  source: https://github.com/bpais88/dynt-agent-skills/tree/main/skills/dynt-transaction-cleanup
---

**FIRST**: read the parent `dynt` skill for connection, safety rules and tool families.

# Transaction cleanup

**Outcome:** the review queue is smaller, and every change was previewed and
approved.

## 1. Size the queue

- `get_transaction_summary` → "needs review" count.
- `get_account_overview` → merchant coverage percentage.
- `list_transactions` with `status: "needs_review"`, paginated, to sample the
  queue: show 10 examples (date · merchant/raw description · amount).

## 2. Preview what the suggestions would do

Dynt keeps pending **category** and **merchant** suggestions per transaction.
Explain both, and that the bulk tools apply *all* pending suggestions of that
kind — there is no partial accept through MCP. If the user wants to exclude
items, stop: that must be done in the Dynt app.

Show: how many transactions each bulk action would touch (from the sample and
counts), and 5 representative before → after lines.

## 3. Apply (write — confirm each action separately)

- `accept_all_category_suggestions` → returns the number updated.
- `accept_all_merchant_suggestions` → returns the number updated.

Report the counts and re-run `get_transaction_summary` to show the new
"needs review" figure.

## Gotchas

- Requires `write`; a viewer or read-only credential can only report.
- Suggestions are Dynt's; do not invent categories or merchants yourself.
- Never chain the two accepts without a separate yes for each.
