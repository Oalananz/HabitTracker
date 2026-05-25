<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Remaining infra steps (needs Supabase SQL editor)

Already fixed in code — just needs these SQL commands run in Supabase:

1. **Run `supabase-migration.sql`** — creates RPCs (`increment_goal_progress`, `increment_journey_failure`) and drops `password` column from `public.users`.

## Code changes already applied

### Auth profile race condition — `src/lib/auth.ts`
- `insert` → `upsert` with `onConflict: 'id'` for both `users` and `recovery_states`.

### Race condition in `goalService.ts`
- Replaced read-then-write with `supabase.rpc('increment_goal_progress', ...)`.

### Race condition in `competitiveJourneyService.ts`
- Replaced read-then-write participant update with `supabase.rpc('increment_journey_failure', ...)`.

## Build
- `next build` passes cleanly (26 routes).
