---
type: regex
pattern: '(which category|what category|confirm|shall I|should I|do you want me|would you like me)'
match: contains
target: last_message
flags: i
---
"Put it right" does not say what right is: the agent finds the transaction and asks, rather than guessing a category for someone's books.
