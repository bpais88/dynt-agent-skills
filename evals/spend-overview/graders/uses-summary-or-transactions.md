---
type: regex
pattern: '"name":\s*"[^"]*(get_transaction_summary|list_transactions)"'
match: contains
target: trace
---
Either the summary tool or a transaction listing must back the numbers.
