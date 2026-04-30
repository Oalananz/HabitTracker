-- Add optional time fields for daily timeline scheduling
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;
