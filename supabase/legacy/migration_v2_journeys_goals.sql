-- =====================================================
-- Migration: Recovery Journeys + Goals
-- Run this in the Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Recovery Journeys table (replaces single recovery_states)
-- =====================================================
CREATE TABLE IF NOT EXISTS recovery_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_journeys_user_id ON recovery_journeys(user_id);

-- Add journey_id to failure_logs (nullable for backward compat)
ALTER TABLE failure_logs ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES recovery_journeys(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_failure_logs_journey_id ON failure_logs(journey_id);

-- =====================================================
-- 2. Goals table
-- =====================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'open',  -- 'weekly', 'dated', 'open'
  target_date DATE,                        -- for dated goals
  target_count INTEGER DEFAULT 1,          -- for quantifiable goals
  current_count INTEGER DEFAULT 0,         -- progress
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_user_type ON goals(user_id, goal_type);

-- =====================================================
-- 3. Disable RLS on new tables
-- =====================================================
ALTER TABLE recovery_journeys DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
