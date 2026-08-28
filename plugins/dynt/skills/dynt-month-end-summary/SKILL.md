---
name: dynt-month-end-summary
description: >-
  Produce a period summary a founder or bookkeeper can act on: cash in vs out,
  top merchants, unpaid invoices, overdue bills, pending expenses and open
  data-quality issues. Use when a user asks "how did we do this month", "month
  end", "period summary", "cash in and out", "what's unpaid", "what's overdue",
  "expense claims pending", or wants a weekly/monthly finance briefing from
  Dynt.
metadata:
  parent: dynt
  source: https://github.com/bpais88/dynt-agent-skills/tree/main/skills/dynt-month-end-summary
---

**FIRST**: read the parent `dynt` skill for connection, safety rules and tool families.

# Month-end summary

**Outcome:** one briefing with numbers the user can trust, each traceable to
a tool call. Read-only — this skill never writes.

## Period

Default to the previous full calendar month unless the user names a period.
State the exact `startDate`–`endDate` you used at the top.

## Collect (parallel where the client allows)

1. `get_transaction_summary` (startDate, endDate) → count, needs-review count,
   income, expenses. These are the headline numbers.
2. `list_merchants` → top 10 by spend in the period (filter to the period if
   the tool supports it; otherwise say "all-time").
3. `list_invoices` → unpaid and overdue outgoing invoices: customer, amount,
   due date, days overdue. Paginate fully.
4. `list_bills` → unpaid and overdue supplier bills, same fields.
5. `list_expenses` → pending employee expense claims: submitter, amount, age.
6. `get_anomaly_summary` → open anomalies count (details are in
   `dynt-anomaly-triage`).
7. `list_accounts` → balances per account and currency.

## Present

```
Period 2026-08-01 → 2026-08-31 (EUR)
Cash in  12,340.00   Cash out  20,317.09   Net  -7,977.09   (319 transactions, 41 need review)
Balances: ABN AMRO 349.42 · Revolut 11.11 · Wise USD 23.42
Top merchants: …
Receivables: 3 unpaid (4,200.00), 1 overdue 12d
Payables:   5 unpaid (2,980.00), 2 overdue
Expenses:   2 pending claims (640.00), oldest 9d
Data quality: 41 to review · 3 open anomalies
```

Then 3–5 bullet "actions this week", each pointing to a workflow skill
(receipts, cleanup, subscriptions, anomalies).

## Gotchas

- Do not add signed transaction amounts yourself; use the summary tool.
- Multi-currency accounts: report per currency; do not convert unless asked,
  and then say which rate you assumed.
- "Needs review" is a count of transactions awaiting accounting status, not
  errors.
