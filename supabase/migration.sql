-- =====================================================
-- Supabase SQL Migration for Habit Tracker
-- Run this in the Supabase SQL Editor to create all tables
-- =====================================================

-- Enable UUID extension (usually enabled by default on Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Users table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  status_message TEXT DEFAULT 'Compiling habits...',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- =====================================================
-- Habits table
-- =====================================================
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'nominal',
  repeat_rule JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

-- =====================================================
-- Task Instances table
-- =====================================================
CREATE TABLE IF NOT EXISTS task_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'nominal',
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  source_type TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one task per habit per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_instances_habit_date
  ON task_instances(habit_id, date) WHERE habit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_instances_date ON task_instances(date);
CREATE INDEX IF NOT EXISTS idx_task_instances_user_id ON task_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_user_date ON task_instances(user_id, date);

-- =====================================================
-- Recovery States table
-- =====================================================
CREATE TABLE IF NOT EXISTS recovery_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Failure Logs table
-- =====================================================
CREATE TABLE IF NOT EXISTS failure_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failure_logs_timestamp ON failure_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_failure_logs_user_id ON failure_logs(user_id);

-- =====================================================
-- Auto-update updated_at trigger for recovery_states
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recovery_states_updated_at
  BEFORE UPDATE ON recovery_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- Since we use custom JWT auth (not Supabase Auth),
-- we disable RLS to allow server-side access.
-- The API routes handle authorization via JWT middleware.
-- =====================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE failure_logs DISABLE ROW LEVEL SECURITY;
