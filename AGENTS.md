# Contributor & agent notes

## This is NOT the Next.js you know

This project uses Next.js 16, which has breaking changes — APIs, conventions, and
file structure may differ from older versions (and from most training data). Read the
relevant guide in `node_modules/next/dist/docs/` before writing code, and heed any
deprecation notices.

## Backend

PostgreSQL runs in Docker (see `docker-compose.yml`, `make up`). The schema and RPCs
live in `db/migrations/`; the `migrate` service applies new files (tracked in
`schema_migrations`) on every `make up` — add changes as a new, higher-numbered file and
never edit one that has shipped. Server code talks to
the database through `src/lib/db` (a small chainable query builder over `pg`); auth is
local email/password with DB-backed sessions (`src/lib/auth.ts`). Concurrent counters
(goal progress, journey failures) go through Postgres RPCs (`db.rpc`) rather than
read-then-write, so prefer extending those when adding similar increment logic.

## Build

`npm run build` should pass cleanly before opening a PR.
