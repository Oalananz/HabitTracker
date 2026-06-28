-- ================================================================
-- Migration v5: Comprehensive daily score
-- Run in your Supabase SQL Editor AFTER migration_v3.
--
-- Rebalances daily_score (still 0-10) to reflect ALL of the day's
-- tracked data — every worship extra, discipline, sleep, focus, and a
-- bonus when the day's tasks/habits are all complete.
--
-- New breakdown (max 10):
--   Focus goal met .............................. +2
--   All 5 prayers ............................... +2
--   Quran + a dhikr ............................. +1
--   Night prayer + 12 sunnah rakahs ............. +1
--   Discipline (no_reels+no_masturbation+no_music) +2
--   Sleep goal met .............................. +1
--   All tasks/habits done (tasks_done) .......... +1
-- ================================================================

-- ----------------------------------------------------------------
-- 1. New column: tasks_done (set by the app when all of the day's
--    tasks/habits are completed). Lets the score trigger read it.
-- ----------------------------------------------------------------
ALTER TABLE day_records
  ADD COLUMN IF NOT EXISTS tasks_done boolean DEFAULT false;

-- ----------------------------------------------------------------
-- 2. Replace the score function with the comprehensive formula
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_day_score()
RETURNS TRIGGER AS $$
DECLARE
  v_score integer := 0;
BEGIN
  -- Focus goal met: +2
  IF NEW.focus_hours >= NEW.focus_goal THEN
    v_score := v_score + 2;
  END IF;

  -- All 5 prayers done: +2
  IF NEW.fajr AND NEW.dhuhr AND NEW.asr AND NEW.maghrib AND NEW.isha THEN
    v_score := v_score + 2;
  END IF;

  -- Quran + at least one dhikr: +1
  IF NEW.quran AND (NEW.dhikr_morning OR NEW.dhikr_evening) THEN
    v_score := v_score + 1;
  END IF;

  -- Night prayer + 12 sunnah rakahs: +1
  IF NEW.night_prayer AND NEW.sunnah_prayer THEN
    v_score := v_score + 1;
  END IF;

  -- Discipline (all tracked journeys clean today): +2
  IF NEW.no_reels AND NEW.no_masturbation AND NEW.no_music THEN
    v_score := v_score + 2;
  END IF;

  -- Sleep goal met: +1
  IF NEW.sleep_hours >= NEW.sleep_goal THEN
    v_score := v_score + 1;
  END IF;

  -- All of the day's tasks/habits done: +1
  IF NEW.tasks_done THEN
    v_score := v_score + 1;
  END IF;

  -- Cap at 10
  NEW.daily_score := LEAST(v_score, 10);
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------
-- 3. Extend upsert_day_record to accept p_tasks_done
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION upsert_day_record(
  p_user_id         uuid,
  p_date            date,
  p_focus_hours     numeric DEFAULT NULL,
  p_no_reels        boolean DEFAULT NULL,
  p_no_masturbation boolean DEFAULT NULL,
  p_low_sugar       boolean DEFAULT NULL,
  p_no_music        boolean DEFAULT NULL,
  p_no_yapping      boolean DEFAULT NULL,
  p_fajr            boolean DEFAULT NULL,
  p_dhuhr           boolean DEFAULT NULL,
  p_asr             boolean DEFAULT NULL,
  p_maghrib         boolean DEFAULT NULL,
  p_isha            boolean DEFAULT NULL,
  p_quran           boolean DEFAULT NULL,
  p_dhikr_morning   boolean DEFAULT NULL,
  p_dhikr_evening   boolean DEFAULT NULL,
  p_night_prayer    boolean DEFAULT NULL,
  p_sunnah_prayer   boolean DEFAULT NULL,
  p_sleep_hours     numeric DEFAULT NULL,
  p_focus_goal      numeric DEFAULT NULL,
  p_sleep_goal      numeric DEFAULT NULL,
  p_tasks_done      boolean DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_result day_records%ROWTYPE;
  v_achievements JSONB;
BEGIN
  INSERT INTO day_records (user_id, date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, date) DO NOTHING;

  UPDATE day_records SET
    focus_hours     = COALESCE(p_focus_hours, focus_hours),
    focus_goal      = COALESCE(p_focus_goal, focus_goal),
    no_reels        = COALESCE(p_no_reels, no_reels),
    no_masturbation = COALESCE(p_no_masturbation, no_masturbation),
    low_sugar       = COALESCE(p_low_sugar, low_sugar),
    no_music        = COALESCE(p_no_music, no_music),
    no_yapping      = COALESCE(p_no_yapping, no_yapping),
    fajr            = COALESCE(p_fajr, fajr),
    dhuhr           = COALESCE(p_dhuhr, dhuhr),
    asr             = COALESCE(p_asr, asr),
    maghrib         = COALESCE(p_maghrib, maghrib),
    isha            = COALESCE(p_isha, isha),
    quran           = COALESCE(p_quran, quran),
    dhikr_morning   = COALESCE(p_dhikr_morning, dhikr_morning),
    dhikr_evening   = COALESCE(p_dhikr_evening, dhikr_evening),
    night_prayer    = COALESCE(p_night_prayer, night_prayer),
    sunnah_prayer   = COALESCE(p_sunnah_prayer, sunnah_prayer),
    sleep_hours     = COALESCE(p_sleep_hours, sleep_hours),
    sleep_goal      = COALESCE(p_sleep_goal, sleep_goal),
    tasks_done      = COALESCE(p_tasks_done, tasks_done)
  WHERE user_id = p_user_id AND date = p_date
  RETURNING * INTO v_result;

  SELECT check_and_unlock_achievements(p_user_id, p_date) INTO v_achievements;

  RETURN jsonb_build_object(
    'record', to_jsonb(v_result),
    'newAchievements', v_achievements
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
