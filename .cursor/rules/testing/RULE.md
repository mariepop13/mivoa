---
description: "Testing standards with Vitest: when to test and review process"
alwaysApply: false
---

# Testing (Vitest)

- Run `npm run test:ci` before commits. Test non-trivial logic (Arrange/Act/Assert). Fast, isolated.
- Before review: `npm run test:ci` + `coderabbit --prompt-only -t uncommitted`.


