-- ================================================================
-- Migration: today_state — per-user/per-day store for the Today page
-- extras that previously lived only in the browser (localStorage):
--   • Top 3 Priorities
--   • Evening Review (daily reflection)
--   • Saved AI Daily Plan
-- Stored as JSONB so the shapes can evolve without further migrations.
-- Run this in your Supabase SQL Editor.
-- ================================================================

CREATE TABLE IF NOT EXISTS today_state (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date          date NOT NULL,
  priorities    jsonb DEFAULT '[]'::jsonb,
  daily_review  jsonb,
  ai_plan       jsonb,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE today_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "today_state_select" ON today_state FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "today_state_insert" ON today_state FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "today_state_update" ON today_state FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "today_state_delete" ON today_state FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS today_state_user_date_idx ON today_state (user_id, date);
