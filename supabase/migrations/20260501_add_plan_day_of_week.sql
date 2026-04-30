-- Add optional day-of-week field for plans
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS day_of_week TEXT CHECK (day_of_week IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'));
