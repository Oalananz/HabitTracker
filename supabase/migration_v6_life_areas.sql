-- ================================================================
-- Migration v6: Life Areas system
-- Run in your Supabase SQL Editor AFTER the previous migrations.
--
-- Adds an optional life_area tag to goals, tasks, habits, and plans;
-- a weekly_reviews table; and onboarding state on user_preferences.
-- All changes are additive and non-destructive — existing rows keep
-- working with life_area = NULL (treated as "Unassigned").
--
-- Valid life_area values:
--   health | money | work_business | learning | family_social | personal
-- ================================================================

-- ----------------------------------------------------------------
-- 1. life_area column on the four entity tables (nullable)
-- ----------------------------------------------------------------
ALTER TABLE goals           ADD COLUMN IF NOT EXISTS life_area text;
ALTER TABLE task_instances  ADD COLUMN IF NOT EXISTS life_area text;
ALTER TABLE habits          ADD COLUMN IF NOT EXISTS life_area text;
ALTER TABLE plans           ADD COLUMN IF NOT EXISTS life_area text;

CREATE INDEX IF NOT EXISTS goals_life_area_idx          ON goals(user_id, life_area);
CREATE INDEX IF NOT EXISTS task_instances_life_area_idx ON task_instances(user_id, life_area);
CREATE INDEX IF NOT EXISTS habits_life_area_idx         ON habits(user_id, life_area);
CREATE INDEX IF NOT EXISTS plans_life_area_idx          ON plans(user_id, life_area);

-- ----------------------------------------------------------------
-- 2. weekly_reviews — one saved review per user per week
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start_date       date NOT NULL,
  week_end_date         date NOT NULL,
  wins                  text,
  problems              text,
  lessons               text,
  next_week_priorities  text,
  health_review         text,
  money_review          text,
  work_business_review  text,
  learning_review       text,
  family_social_review  text,
  personal_review       text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reviews_select" ON weekly_reviews FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "weekly_reviews_insert" ON weekly_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "weekly_reviews_update" ON weekly_reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "weekly_reviews_delete" ON weekly_reviews FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 3. Onboarding state on user_preferences
-- ----------------------------------------------------------------
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS focus_areas text[] DEFAULT '{}';
