---
applyTo: "src/controllers/**/*.ts"
description: "Use when: editing or generating Express controllers for the backend API"
---

# Backend Controllers Rules

- Keep controllers thin: parse input, call services/models, shape HTTP response.
- Use early returns and guard clauses for auth, ownership, and validation checks.
- Keep response keys stable unless a migration is explicitly requested.
- Return explicit status codes (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`).
- Do not place heavy business logic in controllers; move it to `src/services` when needed.
- Never log secrets or raw credentials in errors.
