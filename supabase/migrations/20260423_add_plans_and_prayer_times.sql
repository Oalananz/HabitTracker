-- =====================================================
-- Plans table
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  plan_type TEXT NOT NULL DEFAULT 'daily' CHECK (plan_type IN ('daily', 'weekly', 'monthly', 'custom')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'nominal',
  category TEXT,
  notes TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  prayer_block TEXT CHECK (prayer_block IN ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', NULL)),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for plans
CREATE INDEX IF NOT EXISTS idx_plans_user_date ON plans(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_plans_user_status ON plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_plans_user_prayer ON plans(user_id, prayer_block);
CREATE INDEX IF NOT EXISTS idx_plans_user_type ON plans(user_id, plan_type);

-- =====================================================
-- Prayer Times table
-- =====================================================
CREATE TABLE IF NOT EXISTS prayer_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fajr TEXT NOT NULL DEFAULT '05:00',
  sunrise TEXT,
  dhuhr TEXT NOT NULL DEFAULT '12:15',
  asr TEXT NOT NULL DEFAULT '15:30',
  maghrib TEXT NOT NULL DEFAULT '18:15',
  isha TEXT NOT NULL DEFAULT '19:45',
  source TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, date)
);

-- Indexes for prayer_times
CREATE INDEX IF NOT EXISTS idx_prayer_times_user_date ON prayer_times(user_id, date);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Plans RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON plans
  FOR DELETE USING (auth.uid() = user_id);

-- Prayer Times RLS
ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prayer times" ON prayer_times
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prayer times" ON prayer_times
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prayer times" ON prayer_times
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayer times" ON prayer_times
  FOR DELETE USING (auth.uid() = user_id);
