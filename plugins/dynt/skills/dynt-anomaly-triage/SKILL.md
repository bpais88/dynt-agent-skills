---
name: dynt-anomaly-triage
description: >-
  Explain and prioritize Dynt's data-quality anomalies (duplicate merchants,
  unusual charges, missing categories) and propose the fix path for each. Use
  when a user asks "what looks wrong", "anomalies", "duplicates", "unusual
  charge", "did we get charged twice", or wants a data-quality check on their
  Dynt organization.
metadata:
  parent: dynt
  source: https://github.com/bpais88/dynt-agent-skills/tree/main/skills/dynt-anomaly-triage
---

**FIRST**: read the parent `dynt` skill for connection, safety rules and tool families.

# Anomaly triage

**Outcome:** each open anomaly has a severity, a one-line explanation and a
next step. Read-only.

1. `get_anomaly_summary` → open / acknowledged / resolved counts.
If the server offers `list_findings`, call it first: price increases, stopped subscriptions, duplicate charges and missing-receipt clusters arrive pre-computed with evidence and money at stake — do not recompute them; use the steps below for what findings do not cover.

2. `list_anomalies` → for each: type, severity, description, affected record.
3. For suspected double charges, pull the two transactions with
   `list_transactions` (merchantName + a tight date window) and compare amount,
   date and account before calling it a duplicate.
4. Group by type; order by severity then amount at stake.

Present a table: severity · type · what happened · evidence · next step. Next
steps map to skills: duplicate merchant → `dynt-transaction-cleanup`; missing
receipt → `dynt-receipt-compliance`; recurring charge change →
`dynt-subscription-audit`. Resolving or acknowledging anomalies happens in the
Dynt app; say so rather than implying you changed their status.
