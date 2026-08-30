---
name: "overdue-invoices"
tags: [read-only, invoices]
plugins: ["../../plugins/dynt"]
runs: 1
max_turns: 8
timeout_seconds: 300
---

Which of our customer invoices are overdue, and how much is outstanding in total?
