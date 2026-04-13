# Copilot Instructions - app-sci-back

## Project Stack
- Node.js + Express 5 + TypeScript
- Sequelize + PostgreSQL
- Zod v4 for request validation

## Architecture
- Keep route handlers thin in `src/controllers`.
- Put business logic in `src/services` when logic grows.
- Data layer and DB mapping stay in `src/models`.
- Keep route declarations in `src/routes`.
- Shared helpers belong in `src/utils`.

## Coding Guidelines
- Use TypeScript strict-friendly patterns and explicit types where useful.
- Prefer early returns and guard clauses over nested conditionals.
- Reuse existing patterns before introducing new abstractions.
- Do not rename API fields or response shapes without checking existing consumers.
- Avoid editing unrelated files.

## Validation and Errors
- Validate incoming payloads with Zod schemas.
- Return clear HTTP status codes and stable error messages.
- Handle async errors and avoid unhandled promise rejections.

## Security and Data Handling
- Never log secrets, tokens, or raw credentials.
- Treat auth and owner/tenant access rules as critical.
- Sanitize and validate all external inputs.

## Commands
- Dev: npm run dev
- Build: npm run build
- Start: npm run start

## When Copilot Suggests Changes
- Prefer minimal diffs.
- Preserve current coding style and naming conventions.
- Add small, meaningful comments only for non-obvious logic.
