-- Allow weekly plans to target more than one weekday, e.g. sun,mon.
ALTER TABLE plans
  DROP CONSTRAINT IF EXISTS plans_day_of_week_check;

ALTER TABLE plans
  ADD CONSTRAINT plans_day_of_week_check
  CHECK (
    day_of_week IS NULL
    OR day_of_week ~ '^(sun|mon|tue|wed|thu|fri|sat)(,(sun|mon|tue|wed|thu|fri|sat))*$'
  );
