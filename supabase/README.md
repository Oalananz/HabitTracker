# Supabase schema & migrations

Run these in the Supabase **SQL Editor** in this exact order on a fresh project.
Every file is idempotent/additive where possible, but order matters because later
migrations depend on earlier tables.

`legacy/` holds the original flat migration files from before this project switched
to timestamped migrations — they are still the authoritative early schema history
(not deprecated), just moved out of `supabase/` root for tidiness. New migrations
go in `migrations/` with a `YYYYMMDD_description.sql` name.

| # | File | Adds |
|---|------|------|
| 1 | `legacy/migration.sql` | Core schema: `users`, `habits`, `task_instances`, `recovery_states` |
| 2 | `auth_integration.sql` | Auth → profile triggers (creates a `users` row + `recovery_states` on signup) |
| 3 | `legacy/migration_v2_journeys_goals.sql` | `recovery_journeys`, `failure_logs`, `goals` |
| 4 | `migrations/20260423_add_plans_and_prayer_times.sql` | `plans`, `prayer_times` |
| 5 | `migrations/20260424_add_competitive_recovery_mode.sql` | Competitive journeys + participants |
| 6 | `migrations/20260425_optimize_competitive_query_latency.sql` | Indexes for competitive queries |
| 7 | `migrations/20260501_*.sql` (4 files) | Plan day-of-week + time fields + missing columns |
| 8 | `legacy/migration_v3_day_records_achievements.sql` | `day_records`, `achievements`, `user_stats`, `user_preferences`, scoring trigger |
| 9 | `legacy/supabase-migration.sql` | RPCs: `increment_goal_progress`, `increment_journey_failure` |
| 10 | `legacy/migration_v5_full_score.sql` | Comprehensive daily score (`tasks_done` column + rebalanced trigger) |
| 11 | `legacy/migration_v6_life_areas.sql` | Life Areas: `life_area` on goals/tasks/habits/plans, `weekly_reviews`, onboarding state |
| 12 | `legacy/migration_v7a_money.sql` | Money: transactions, budgets, savings goals, debts, subscriptions |
| 13 | `legacy/migration_v7b_learning.sql` | Learning: courses, skills, study sessions, certificates, resources |
| 14 | `migrations/20260630_add_today_state.sql` | Today page persisted extras (priorities, evening review, AI plan) |

> There is no `migration_v4` — it was an abandoned draft and intentionally removed.

## Two task-like systems (by design, for now)

The app has **two** separate "thing to do" models — know which you're touching:

- **`task_instances`** — the **Today** page. Generated daily from recurring `habits`
  (plus one-off manual tasks). Drives the daily score's tasks bonus and streaks.
- **`plans`** — the **Planner** page (including its Prayer view). Calendar-style
  entries with start/end times, recurrence, and prayer-block assignment.

They overlap (title, category, priority, status, `life_area`) but are not unified.
If you add a field to one "task" concept, decide consciously whether the other needs
it too. Unifying them is a known future refactor — see the app's TODO/known-limitations.
