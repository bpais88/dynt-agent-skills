---
type: regex
pattern: '(confirm|go ahead|proceed|shall I|should I|do you want me|would you like me)'
match: contains
target: last_message
flags: i
---
A rule changes how future transactions are categorised, so the agent states what it will match and waits.
