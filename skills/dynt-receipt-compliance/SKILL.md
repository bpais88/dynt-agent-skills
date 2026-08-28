---
name: dynt-receipt-compliance
description: >-
  Find transactions without receipts and attach the right proof from a URL, an
  upload or the connected Gmail inbox, confirming the match before writing. Use
  when a user asks about missing receipts, attaching invoices or proofs to
  transactions, VAT or audit evidence, "which transactions have no receipt",
  "attach this receipt", "find the invoice for this charge", or bookkeeping
  compliance in Dynt.
metadata:
  parent: dynt
  source: https://github.com/bpais88/dynt-agent-skills/tree/main/skills/dynt-receipt-compliance
---

**FIRST**: read the parent `dynt` skill for connection, safety rules and tool families.

# Receipt compliance

**Outcome:** every transaction the user cares about has a proof attached, or a
clear list of what is still missing and why.

## 1. Scope

Ask (or infer from the request) the period and the threshold, e.g. "August,
charges over 25". Then:

1. `get_current_user` → confirm role and whether `write` and `email:read` are
   granted. Without `write` you can only report.
2. `list_transactions` with `startDate`, `endDate`, `minAmount`; follow
   `nextCursor` until `hasMore` is false.
3. For each candidate, `list_proofs` with the transaction id. Keep those with
   no proofs.

Present the gap list first: date · merchant · amount · currency. Stop here if
the user only asked "what's missing".

## 2. Find evidence

Per missing transaction, in this order:

- **User-provided** file or link → go to step 3 with `attach_proof`.
- **Gmail** (admin with `email:read`): `search_user_email` with the merchant
  name and a date window of ±7 days around the charge, `includeBody=false`.
  Rank by subject/sender; then re-query the best 1–2 messages with
  `includeBody=true` only if the amount is not visible in the subject.
- Nothing found → record "no evidence" with what you searched.

A match requires **amount** (same or explained by FX/VAT), **merchant** and a
**date within a few days**. If any of the three is off, say so and do not attach.

## 3. Attach (write — confirm first)

Show one line per intended attachment: transaction → source (URL, file, or
email subject + date). After an explicit yes:

- URL / upload → `attach_proof` (transactionId, url or base64, filename).
- Gmail attachment → `attach_proof_from_email` (transactionId, messageId,
  attachmentId). Never download it with `get_email_attachment` just to attach.

Then `list_proofs` again to confirm, and report attached / skipped / no
evidence counts.

## Gotchas

- Card holds, refunds and FX fees often look like duplicates; match on the
  settled amount.
- `delete_proof` is irreversible — only on an explicit request naming the
  proof.
- Do not paste email bodies into the chat; summarize sender, subject, date,
  amount.
