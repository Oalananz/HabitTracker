-- ================================================================
-- Migration: today_state — per-user/per-day store for the Today page
-- extras that previously lived only in the browser (localStorage):
--   • Top 3 Priorities
--   • Evening Review (daily reflection)
--   • Saved AI Daily Plan
-- Stored as JSONB so the shapes can evolve without further migrations.
-- ================================================================

CREATE TABLE IF NOT EXISTS today_state (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date          date NOT NULL,
  priorities    jsonb DEFAULT '[]'::jsonb,
  daily_review  jsonb,
  ai_plan       jsonb,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS today_state_user_date_idx ON today_state (user_id, date);
