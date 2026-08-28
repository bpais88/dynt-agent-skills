---
name: dynt-subscription-audit
description: >-
  Detect recurring charges, spot price increases and unused services, and
  recommend cancel/downgrade/switch actions with evidence. Use when a user asks
  what they subscribe to, "recurring charges", "what went up in price", "am I
  overpaying", "cancel", "downgrade", "cheaper alternative", SaaS spend, or
  wants subscriptions flagged on their transactions in Dynt.
metadata:
  parent: dynt
  source: https://github.com/bpais88/dynt-agent-skills/tree/main/skills/dynt-subscription-audit
---

**FIRST**: read the parent `dynt` skill for connection, safety rules and tool families.

# Subscription audit

**Outcome:** a ranked list of subscriptions with monthly cost, trend and a
recommendation per item — and, only on request, the recurring flags saved.

## 1. Detect (read-only)

`list_subscriptions` with `monthsBack` (default 6; use 12 for yearly plans)
and `minOccurrences: 2`. This never modifies data.

For each result keep: merchant, cadence, average amount, last amount, charge
history, estimated monthly spend. Compute:

- **Price increase**: last amount > average by more than 5% → flag with the
  two amounts and dates.
- **Possibly unused**: no charge in the last cadence period + 7 days → flag.
- **Duplicates**: two merchants that normalize to the same provider.

## 2. Enrich

For each flagged merchant, `lookup_provider` → free tier, pricing URL, cancel
URL, alternatives. Unknown provider → say so; do not invent pricing.

Optional evidence (admin with `email:read`): `search_user_email` for the
merchant name with `includeBody=false` to find plan/renewal emails; quote
subject and date only.

## 3. Present

Table ordered by estimated monthly spend, then a short recommendation per
row: keep / downgrade (to what) / cancel (link) / switch (alternative). Total
monthly and yearly figures at the bottom, in the organization's currency.

## 4. Persist flags (write — confirm first)

Only if the user asks to mark subscriptions on their transactions:
`flag_recurring_transactions` with the same `monthsBack` / `minOccurrences`.
Only **monthly and yearly** detections are persisted; irregular ones are returned but not flagged — say so in the report. Manual user flags are never overwritten. Requires `write`.

## Gotchas

- Annual plans appear once; do not call them "unused" inside their period.
- Amount changes at cadence boundaries can be FX; check the `currency` field.
- Never claim a cancellation happened — Dynt does not cancel services.
