# AGENTS - app-sci-back

## Goal
Maintain a stable and secure backend API using minimal, targeted changes.

## Priorities
1. Correctness and data integrity.
2. Security (auth, ownership, input validation).
3. Backward-compatible API responses.
4. Readability and maintainability.

## Working Rules
- Prefer localized edits over broad refactors.
- Keep controllers thin and move business complexity to services.
- Keep Sequelize models and database mapping consistent.
- Validate request payloads and key external inputs with Zod v4.
- Preserve naming and response shape unless explicitly requested.
- Avoid modifying unrelated files.

## Verification
- Build locally before finalizing significant backend changes.
- Watch for unhandled async errors and unstable status code behavior.
