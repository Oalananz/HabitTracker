-- =====================================================
-- Achievement fixes
-- 1. The four DISCIPLINE recovery achievements (discipline_recovery_30/90/365,
--    discipline_war_won) were listed in the app but never unlocked by SQL.
-- 2. upsert_day_record re-ran check_and_unlock_achievements after the
--    AFTER UPDATE trigger had already inserted the new rows, so it always
--    reported newAchievements = [] and the unlock toast never appeared.
-- =====================================================

-- Unlocks milestone achievements for the user's personal recovery journeys.
-- A journey's clean streak runs from its latest failure (or its start).
-- Returns the keys unlocked by this call.
CREATE OR REPLACE FUNCTION unlock_recovery_achievements(p_user_id uuid)
RETURNS text[] AS $$
DECLARE
  v_best_days   numeric := 0;
  v_war_days    numeric := 0;
  v_unlocked    text[] := ARRAY[]::text[];
  v_key         text;
BEGIN
  WITH streaks AS (
    SELECT j.title,
           EXTRACT(EPOCH FROM (NOW() - GREATEST(
             j.start_time,
             COALESCE((SELECT MAX(f.timestamp) FROM failure_logs f WHERE f.journey_id = j.id), j.start_time)
           ))) / 86400 AS days
      FROM recovery_journeys j
     WHERE j.user_id = p_user_id AND j.is_active
  )
  SELECT COALESCE(MAX(days), 0),
         COALESCE(MAX(days) FILTER (WHERE lower(trim(title)) = 'the war'), 0)
    INTO v_best_days, v_war_days
    FROM streaks;

  FOR v_key IN
    SELECT k FROM (VALUES
      ('discipline_recovery_30',  v_best_days >= 30),
      ('discipline_recovery_90',  v_best_days >= 90),
      ('discipline_recovery_365', v_best_days >= 365),
      ('discipline_war_won',      v_war_days  >= 100)
    ) AS t(k, earned)
    WHERE earned
  LOOP
    INSERT INTO achievements(user_id, achievement_key) VALUES (p_user_id, v_key)
      ON CONFLICT DO NOTHING;
    IF FOUND THEN v_unlocked := array_append(v_unlocked, v_key); END IF;
  END LOOP;

  RETURN v_unlocked;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_after_day_record()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_stats(NEW.user_id);
  PERFORM check_and_unlock_achievements(NEW.user_id, NEW.date);
  PERFORM unlock_recovery_achievements(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

  -- The AFTER UPDATE trigger has already unlocked anything earned. Rows it
  -- inserted carry this transaction's now(), which identifies them as new.
  PERFORM unlock_recovery_achievements(p_user_id);
  SELECT COALESCE(jsonb_agg(achievement_key), '[]'::jsonb) INTO v_achievements
    FROM achievements
   WHERE user_id = p_user_id AND unlocked_at >= now();

  RETURN jsonb_build_object(
    'record', to_jsonb(v_result),
    'newAchievements', v_achievements
  );
END;
$$ LANGUAGE plpgsql;
