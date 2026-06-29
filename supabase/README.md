# Supabase schema & migrations

Run these in the Supabase **SQL Editor** in this exact order on a fresh project.
Every file is idempotent/additive where possible, but order matters because later
migrations depend on earlier tables.

| # | File | Adds |
|---|------|------|
| 1 | `migration.sql` | Core schema: `users`, `habits`, `task_instances`, `recovery_states` |
| 2 | `auth_integration.sql` | Auth → profile triggers (creates a `users` row + `recovery_states` on signup) |
| 3 | `migration_v2_journeys_goals.sql` | `recovery_journeys`, `failure_logs`, `goals` |
| 4 | `migrations/20260423_add_plans_and_prayer_times.sql` | `plans`, `prayer_times` |
| 5 | `migrations/20260424_add_competitive_recovery_mode.sql` | Competitive journeys + participants |
| 6 | `migrations/20260425_optimize_competitive_query_latency.sql` | Indexes for competitive queries |
| 7 | `migrations/20260501_*.sql` (4 files) | Plan day-of-week + time fields + missing columns |
| 8 | `migration_v3_day_records_achievements.sql` | `day_records`, `achievements`, `user_stats`, `user_preferences`, scoring trigger |
| 9 | `../supabase-migration.sql` | RPCs: `increment_goal_progress`, `increment_journey_failure` |
| 10 | `migration_v5_full_score.sql` | Comprehensive daily score (`tasks_done` column + rebalanced trigger) |
| 11 | `migration_v6_life_areas.sql` | Life Areas: `life_area` on goals/tasks/habits/plans, `weekly_reviews`, onboarding state |

> There is no `migration_v4` — it was an abandoned draft and intentionally removed.
> The repo root also holds `supabase-migration.sql` (step 9); it lives there for
> historical reasons and is referenced by `AGENTS.md`.

## Two task-like systems (by design, for now)

The app has **two** separate "thing to do" models — know which you're touching:

- **`task_instances`** — the **Today** page. Generated daily from recurring `habits`
  (plus one-off manual tasks). Drives the daily score's tasks bonus and streaks.
- **`plans`** — the **Planner / Prayer Planner** pages. Calendar-style entries with
  start/end times, recurrence, and prayer-block assignment.

They overlap (title, category, priority, status, `life_area`) but are not unified.
If you add a field to one "task" concept, decide consciously whether the other needs
it too. Unifying them is a known future refactor — see the app's TODO/known-limitations.
