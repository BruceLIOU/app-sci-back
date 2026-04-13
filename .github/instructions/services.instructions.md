---
applyTo: "src/services/**/*.ts"
description: "Use when: adding or refactoring backend business logic in services"
---

# Backend Services Rules

- Keep service functions focused on business rules, not HTTP concerns.
- Prefer small, composable functions with explicit input/output types.
- Reuse existing models and utility helpers before introducing new patterns.
- Validate critical external data with Zod v4 when appropriate.
- Propagate clear, actionable errors to callers without leaking sensitive details.
- Preserve current naming conventions and avoid unrelated refactors.
