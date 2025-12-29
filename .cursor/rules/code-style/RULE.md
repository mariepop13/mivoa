---
description: "Code style standards: clean, self-explanatory code without comments"
alwaysApply: true
---

# Code Style

- No comments, no docs. Self-explanatory code only. Functions=verbs, variables=nouns. No abbreviations. Never create README/docs files unless explicitly requested.
- Functions: Single responsibility, 20-40 lines. Max 3-4 params (use objects). Early returns, nesting ≤2.
- Types: Explicit public APIs. Validate at boundaries. Prefer immutability. Never swallow errors.


