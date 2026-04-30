-- =====================================================
-- Add missing columns to plans table
-- Run this in the Supabase SQL Editor
-- =====================================================

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS day_of_week TEXT CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  ADD COLUMN IF NOT EXISTS start_time TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT;
