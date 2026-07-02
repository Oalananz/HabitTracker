# Contributor & agent notes

## This is NOT the Next.js you know

This project uses Next.js 16, which has breaking changes — APIs, conventions, and
file structure may differ from older versions (and from most training data). Read the
relevant guide in `node_modules/next/dist/docs/` before writing code, and heed any
deprecation notices.

## Backend

Supabase (PostgreSQL + Auth) is the backend. The schema and RPCs live in `supabase/`
(including `supabase/legacy/`) — run the migrations in the order described in the README
before starting the app. Concurrent counters (goal progress, journey failures) go
through Postgres RPCs rather than read-then-write, so prefer extending those when adding
similar increment logic.

## Build

`npm run build` should pass cleanly before opening a PR.
