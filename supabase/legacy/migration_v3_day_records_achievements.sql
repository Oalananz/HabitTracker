-- ================================================================
-- Migration v3: Day Records, Achievements, User Stats
-- Run this in your Supabase SQL Editor AFTER all previous migrations
-- ================================================================

-- ----------------------------------------------------------------
-- 1. user_preferences (goal defaults + notification settings)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_goal_hours       numeric(4,1) DEFAULT 6,
  sleep_goal_hours       numeric(3,1) DEFAULT 7,
  achievement_alerts     boolean DEFAULT true,
  discipline_reminder    time DEFAULT '22:00',
  updated_at             timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_select" ON user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_preferences_insert" ON user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_update" ON user_preferences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_preferences_delete" ON user_preferences FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 2. day_records (one row per user per calendar day)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS day_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date             date NOT NULL,
  focus_hours      numeric(4,1) DEFAULT 0,
  focus_goal       numeric(4,1) DEFAULT 6,
  no_reels         boolean DEFAULT false,
  no_masturbation  boolean DEFAULT false,
  low_sugar        boolean DEFAULT false,
  no_music         boolean DEFAULT false,
  no_yapping       boolean DEFAULT false,
  fajr             boolean DEFAULT false,
  dhuhr            boolean DEFAULT false,
  asr              boolean DEFAULT false,
  maghrib          boolean DEFAULT false,
  isha             boolean DEFAULT false,
  quran            boolean DEFAULT false,
  dhikr_morning    boolean DEFAULT false,
  dhikr_evening    boolean DEFAULT false,
  night_prayer     boolean DEFAULT false,
  sunnah_prayer    boolean DEFAULT false,
  sleep_hours      numeric(3,1) DEFAULT 0,
  sleep_goal       numeric(3,1) DEFAULT 7,
  daily_score      integer DEFAULT 0,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE day_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "day_records_select" ON day_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "day_records_insert" ON day_records FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "day_records_update" ON day_records FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "day_records_delete" ON day_records FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 3. achievements (unlock log)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_key  text NOT NULL,
  unlocked_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select" ON achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "achievements_insert" ON achievements FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "achievements_update" ON achievements FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "achievements_delete" ON achievements FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 4. user_stats (one row per user, upsert pattern)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_stats (
  user_id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score                 integer DEFAULT 0,
  total_focus_hours           numeric(8,1) DEFAULT 0,
  focus_streak                integer DEFAULT 0,
  prayer_streak               integer DEFAULT 0,
  no_reels_streak             integer DEFAULT 0,
  no_masturbation_streak      integer DEFAULT 0,
  full_discipline_streak      integer DEFAULT 0,
  best_focus_streak           integer DEFAULT 0,
  best_prayer_streak          integer DEFAULT 0,
  best_no_reels_streak        integer DEFAULT 0,
  best_full_discipline_streak integer DEFAULT 0,
  updated_at                  timestamptz DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_stats_select" ON user_stats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_stats_insert" ON user_stats FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_stats_update" ON user_stats FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_stats_delete" ON user_stats FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 5. Function: recalculate_day_score
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

  -- Quran + at least one dhikr: +2
  IF NEW.quran AND (NEW.dhikr_morning OR NEW.dhikr_evening) THEN
    v_score := v_score + 2;
  END IF;

  -- No Reels: +1
  IF NEW.no_reels THEN
    v_score := v_score + 1;
  END IF;

  -- No Masturbation: +1
  IF NEW.no_masturbation THEN
    v_score := v_score + 1;
  END IF;

  -- No Music: +1
  IF NEW.no_music THEN
    v_score := v_score + 1;
  END IF;

  -- Sleep goal met: +1
  IF NEW.sleep_hours >= NEW.sleep_goal THEN
    v_score := v_score + 1;
  END IF;

  -- Cap at 10
  NEW.daily_score := LEAST(v_score, 10);
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_recalculate_day_score ON day_records;
CREATE TRIGGER trg_recalculate_day_score
  BEFORE INSERT OR UPDATE ON day_records
  FOR EACH ROW EXECUTE FUNCTION recalculate_day_score();

-- ----------------------------------------------------------------
-- 6. Function: update_user_stats (recompute all streaks)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_focus_streak           integer := 0;
  v_prayer_streak          integer := 0;
  v_no_reels_streak        integer := 0;
  v_no_mas_streak          integer := 0;
  v_discipline_streak      integer := 0;
  v_best_focus             integer := 0;
  v_best_prayer            integer := 0;
  v_best_no_reels          integer := 0;
  v_best_discipline        integer := 0;
  v_total_score            integer := 0;
  v_total_focus            numeric := 0;
  v_row                    RECORD;
  v_prev_date              date := NULL;
BEGIN
  -- Calculate streaks by iterating days in descending order
  -- We accumulate streak until a gap or miss
  FOR v_row IN
    SELECT date, focus_hours, focus_goal,
           fajr, dhuhr, asr, maghrib, isha,
           no_reels, no_masturbation, no_music, no_yapping, low_sugar,
           daily_score
    FROM day_records
    WHERE user_id = p_user_id
    ORDER BY date DESC
  LOOP
    -- Accumulate totals
    v_total_score := v_total_score + v_row.daily_score;
    v_total_focus := v_total_focus + v_row.focus_hours;

    -- Check for date continuity (streak must be consecutive)
    IF v_prev_date IS NULL OR v_prev_date - v_row.date = 1 THEN
      -- Focus streak
      IF v_row.focus_hours >= v_row.focus_goal THEN
        v_focus_streak := v_focus_streak + 1;
        IF v_focus_streak > v_best_focus THEN v_best_focus := v_focus_streak; END IF;
      ELSE
        IF v_focus_streak > v_best_focus THEN v_best_focus := v_focus_streak; END IF;
        v_focus_streak := 0;
      END IF;

      -- Prayer streak
      IF v_row.fajr AND v_row.dhuhr AND v_row.asr AND v_row.maghrib AND v_row.isha THEN
        v_prayer_streak := v_prayer_streak + 1;
        IF v_prayer_streak > v_best_prayer THEN v_best_prayer := v_prayer_streak; END IF;
      ELSE
        IF v_prayer_streak > v_best_prayer THEN v_best_prayer := v_prayer_streak; END IF;
        v_prayer_streak := 0;
      END IF;

      -- No reels streak
      IF v_row.no_reels THEN
        v_no_reels_streak := v_no_reels_streak + 1;
        IF v_no_reels_streak > v_best_no_reels THEN v_best_no_reels := v_no_reels_streak; END IF;
      ELSE
        IF v_no_reels_streak > v_best_no_reels THEN v_best_no_reels := v_no_reels_streak; END IF;
        v_no_reels_streak := 0;
      END IF;

      -- No masturbation streak
      IF v_row.no_masturbation THEN
        v_no_mas_streak := v_no_mas_streak + 1;
      ELSE
        v_no_mas_streak := 0;
      END IF;

      -- Full discipline streak (all 5 discipline items)
      IF v_row.no_reels AND v_row.no_masturbation AND v_row.no_music AND v_row.no_yapping AND v_row.low_sugar THEN
        v_discipline_streak := v_discipline_streak + 1;
        IF v_discipline_streak > v_best_discipline THEN v_best_discipline := v_discipline_streak; END IF;
      ELSE
        IF v_discipline_streak > v_best_discipline THEN v_best_discipline := v_discipline_streak; END IF;
        v_discipline_streak := 0;
      END IF;
    ELSE
      -- Gap in dates — streaks reset
      IF v_focus_streak > v_best_focus THEN v_best_focus := v_focus_streak; END IF;
      IF v_prayer_streak > v_best_prayer THEN v_best_prayer := v_prayer_streak; END IF;
      IF v_no_reels_streak > v_best_no_reels THEN v_best_no_reels := v_no_reels_streak; END IF;
      IF v_discipline_streak > v_best_discipline THEN v_best_discipline := v_discipline_streak; END IF;
      v_focus_streak := 0; v_prayer_streak := 0; v_no_reels_streak := 0;
      v_no_mas_streak := 0; v_discipline_streak := 0;
    END IF;

    v_prev_date := v_row.date;
  END LOOP;

  -- Final best checks
  IF v_focus_streak > v_best_focus THEN v_best_focus := v_focus_streak; END IF;
  IF v_prayer_streak > v_best_prayer THEN v_best_prayer := v_prayer_streak; END IF;
  IF v_no_reels_streak > v_best_no_reels THEN v_best_no_reels := v_no_reels_streak; END IF;
  IF v_discipline_streak > v_best_discipline THEN v_best_discipline := v_discipline_streak; END IF;

  -- Upsert user_stats
  INSERT INTO user_stats (
    user_id, total_score, total_focus_hours,
    focus_streak, prayer_streak, no_reels_streak, no_masturbation_streak, full_discipline_streak,
    best_focus_streak, best_prayer_streak, best_no_reels_streak, best_full_discipline_streak,
    updated_at
  ) VALUES (
    p_user_id, v_total_score, v_total_focus,
    v_focus_streak, v_prayer_streak, v_no_reels_streak, v_no_mas_streak, v_discipline_streak,
    v_best_focus, v_best_prayer, v_best_no_reels, v_best_discipline,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    total_focus_hours = EXCLUDED.total_focus_hours,
    focus_streak = EXCLUDED.focus_streak,
    prayer_streak = EXCLUDED.prayer_streak,
    no_reels_streak = EXCLUDED.no_reels_streak,
    no_masturbation_streak = EXCLUDED.no_masturbation_streak,
    full_discipline_streak = EXCLUDED.full_discipline_streak,
    best_focus_streak = EXCLUDED.best_focus_streak,
    best_prayer_streak = EXCLUDED.best_prayer_streak,
    best_no_reels_streak = EXCLUDED.best_no_reels_streak,
    best_full_discipline_streak = EXCLUDED.best_full_discipline_streak,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- 7. Function: check_and_unlock_achievements
--    Returns JSONB array of newly unlocked achievement keys
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(
  p_user_id uuid,
  p_date    date
) RETURNS JSONB AS $$
DECLARE
  v_stats         user_stats%ROWTYPE;
  v_day           day_records%ROWTYPE;
  v_newly_unlocked text[] := ARRAY[]::text[];
  v_key           text;
  v_total_days    integer;
  v_prev_day      day_records%ROWTYPE;
  v_fajr_streak   integer := 0;
  v_quran_streak  integer := 0;
  v_focus_week    boolean := true;
  v_perf_week     boolean := true;
  v_perf9_week    boolean := true;
  v_perfect_streak integer := 0;
  v_comeback      boolean := false;
  v_dawn_grind_count integer := 0;
  v_ramadan_count  integer := 0;
  v_full_worship_week boolean := true;
  v_row           RECORD;
  v_cnt           integer;
  v_prev_date     date := NULL;
BEGIN
  -- Get current stats (after update_user_stats was called)
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN '[]'::JSONB; END IF;

  -- Get today's record
  SELECT * INTO v_day FROM day_records WHERE user_id = p_user_id AND date = p_date;
  IF NOT FOUND THEN RETURN '[]'::JSONB; END IF;

  -- Total days with data
  SELECT COUNT(*) INTO v_total_days FROM day_records WHERE user_id = p_user_id;

  -- Helper: try to insert achievement, return true if new
  -- We'll do inline inserts with ON CONFLICT DO NOTHING

  -- ---- STREAK ACHIEVEMENTS ----
  IF v_stats.focus_streak >= 3 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_focus_3') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_focus_3'); END IF;
  END IF;
  IF v_stats.focus_streak >= 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_focus_7') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_focus_7'); END IF;
  END IF;
  IF v_stats.focus_streak >= 14 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_focus_14') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_focus_14'); END IF;
  END IF;
  IF v_stats.focus_streak >= 30 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_focus_30') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_focus_30'); END IF;
  END IF;
  IF v_stats.focus_streak >= 60 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_focus_60') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_focus_60'); END IF;
  END IF;
  IF v_stats.prayer_streak >= 3 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_prayer_3') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_prayer_3'); END IF;
  END IF;
  IF v_stats.prayer_streak >= 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_prayer_7') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_prayer_7'); END IF;
  END IF;
  IF v_stats.prayer_streak >= 30 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_prayer_30') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_prayer_30'); END IF;
  END IF;
  IF v_stats.prayer_streak >= 60 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_prayer_60') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_prayer_60'); END IF;
  END IF;
  IF v_stats.prayer_streak >= 100 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_prayer_100') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_prayer_100'); END IF;
  END IF;
  IF v_stats.no_reels_streak >= 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_noreels_7') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_noreels_7'); END IF;
  END IF;
  IF v_stats.no_reels_streak >= 30 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_noreels_30') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_noreels_30'); END IF;
  END IF;
  IF v_stats.no_reels_streak >= 90 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_noreels_90') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_noreels_90'); END IF;
  END IF;
  IF v_stats.full_discipline_streak >= 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_discipline_7') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_discipline_7'); END IF;
  END IF;
  IF v_stats.full_discipline_streak >= 30 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_discipline_30') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_discipline_30'); END IF;
  END IF;
  IF v_stats.full_discipline_streak >= 90 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'streak_discipline_90') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'streak_discipline_90'); END IF;
  END IF;

  -- ---- SCORE ACHIEVEMENTS ----
  IF v_day.daily_score = 10 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'score_first_perfect') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'score_first_perfect'); END IF;
  END IF;
  IF v_stats.total_score >= 100 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'score_total_100') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'score_total_100'); END IF;
  END IF;
  IF v_stats.total_score >= 500 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'score_total_500') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'score_total_500'); END IF;
  END IF;
  IF v_stats.total_score >= 1000 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'score_total_1000') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'score_total_1000'); END IF;
  END IF;

  -- Perfect 3 in a row
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT daily_score FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 2 AND date <= p_date
  ) sub WHERE daily_score = 10;
  IF v_cnt = 3 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'score_perfect_3') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'score_perfect_3'); END IF;
  END IF;

  -- Perfect 7 in a row
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT daily_score FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 6 AND date <= p_date
  ) sub WHERE daily_score = 10;
  IF v_cnt = 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'score_perfect_7') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'score_perfect_7'); END IF;
  END IF;

  -- Weekly avg >= 8
  SELECT COALESCE(AVG(daily_score),0) INTO v_cnt FROM day_records
  WHERE user_id = p_user_id AND date >= p_date - 6 AND date <= p_date;
  IF v_cnt >= 8 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'score_weekly_avg_8') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'score_weekly_avg_8'); END IF;
  END IF;
  IF v_cnt >= 9 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'score_weekly_avg_9') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'score_weekly_avg_9'); END IF;
  END IF;

  -- ---- WORSHIP ACHIEVEMENTS ----
  IF v_day.fajr AND v_day.dhuhr AND v_day.asr AND v_day.maghrib AND v_day.isha THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'worship_first_full') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'worship_first_full'); END IF;
  END IF;

  -- Quran 7 in a row
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT quran FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 6 AND date <= p_date
  ) sub WHERE quran = true;
  IF v_cnt = 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'worship_quran_7') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'worship_quran_7'); END IF;
  END IF;

  -- Full worship mode (all worship items)
  IF v_day.fajr AND v_day.dhuhr AND v_day.asr AND v_day.maghrib AND v_day.isha
     AND v_day.quran AND v_day.dhikr_morning AND v_day.dhikr_evening
     AND v_day.night_prayer AND v_day.sunnah_prayer THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'worship_all_extras_day') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'worship_all_extras_day'); END IF;
  END IF;

  -- Fajr 7 in a row
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT fajr FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 6 AND date <= p_date
  ) sub WHERE fajr = true;
  IF v_cnt = 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'worship_fajr_streak_7') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'worship_fajr_streak_7'); END IF;
  END IF;

  -- Fajr 30 in a row
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT fajr FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 29 AND date <= p_date
  ) sub WHERE fajr = true;
  IF v_cnt = 30 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'worship_fajr_streak_30') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'worship_fajr_streak_30'); END IF;
  END IF;

  -- ---- FOCUS ACHIEVEMENTS ----
  IF v_day.focus_hours >= v_day.focus_goal THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'focus_first_goal') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'focus_first_goal'); END IF;
  END IF;
  IF v_day.focus_hours >= 8 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'focus_8h_day') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'focus_8h_day'); END IF;
  END IF;
  IF v_stats.total_focus_hours >= 50 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'focus_50h_total') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'focus_50h_total'); END IF;
  END IF;
  IF v_stats.total_focus_hours >= 200 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'focus_200h_total') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'focus_200h_total'); END IF;
  END IF;
  IF v_stats.total_focus_hours >= 500 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'focus_500h_total') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'focus_500h_total'); END IF;
  END IF;

  -- Focus goal every day for a week
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT focus_hours, focus_goal FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 6 AND date <= p_date
  ) sub WHERE focus_hours >= focus_goal;
  IF v_cnt = 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'focus_week_goal') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'focus_week_goal'); END IF;
  END IF;

  -- ---- DISCIPLINE ACHIEVEMENTS ----
  IF v_day.no_reels AND v_day.no_masturbation AND v_day.low_sugar AND v_day.no_music AND v_day.no_yapping THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'discipline_first_clean') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'discipline_first_clean'); END IF;
  END IF;

  -- ---- COMPOUND ACHIEVEMENTS ----
  IF v_day.daily_score = 10
     AND v_day.no_reels AND v_day.no_masturbation AND v_day.low_sugar AND v_day.no_music AND v_day.no_yapping THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'compound_godmode') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'compound_godmode'); END IF;
  END IF;

  -- Full discipline + all prayers in one day
  IF v_day.no_reels AND v_day.no_masturbation AND v_day.low_sugar AND v_day.no_music AND v_day.no_yapping
     AND v_day.fajr AND v_day.dhuhr AND v_day.asr AND v_day.maghrib AND v_day.isha THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'compound_discipline_god') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'compound_discipline_god'); END IF;
  END IF;

  -- First month survived (30 days data)
  IF v_total_days >= 30 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'compound_first_month') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'compound_first_month'); END IF;
  END IF;

  -- Perfect week (score >= 8 every day for 7 consecutive)
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT daily_score FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 6 AND date <= p_date
  ) sub WHERE daily_score >= 8;
  IF v_cnt = 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'compound_full_week') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'compound_full_week'); END IF;
  END IF;

  -- Comeback: after score < 4, scored >= 8 next day
  SELECT daily_score INTO v_cnt FROM day_records
  WHERE user_id = p_user_id AND date = p_date - 1;
  IF FOUND AND v_cnt < 4 AND v_day.daily_score >= 8 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'compound_comeback') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'compound_comeback'); END IF;
  END IF;

  -- Dawn grind: fajr + focus >= 4h on same day, for 7 days
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT fajr, focus_hours FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 6 AND date <= p_date
  ) sub WHERE fajr = true AND focus_hours >= 4;
  IF v_cnt = 7 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'compound_dawn_grind') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'compound_dawn_grind'); END IF;
  END IF;

  -- Ramadan ready: all prayers + quran + dhikr for 30 days
  SELECT COUNT(*) INTO v_cnt FROM (
    SELECT fajr, dhuhr, asr, maghrib, isha, quran, dhikr_morning, dhikr_evening FROM day_records
    WHERE user_id = p_user_id AND date >= p_date - 29 AND date <= p_date
  ) sub WHERE fajr AND dhuhr AND asr AND maghrib AND isha AND quran AND (dhikr_morning OR dhikr_evening);
  IF v_cnt = 30 THEN
    INSERT INTO achievements(user_id, achievement_key) VALUES(p_user_id,'compound_ramadan_ready') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_newly_unlocked := array_append(v_newly_unlocked, 'compound_ramadan_ready'); END IF;
  END IF;

  RETURN to_jsonb(v_newly_unlocked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- 8. Trigger: after day_records INSERT/UPDATE, update stats + achievements
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_after_day_record()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_stats(NEW.user_id);
  PERFORM check_and_unlock_achievements(NEW.user_id, NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_after_day_record_upsert ON day_records;
CREATE TRIGGER trg_after_day_record_upsert
  AFTER INSERT OR UPDATE ON day_records
  FOR EACH ROW EXECUTE FUNCTION trg_after_day_record();

-- ----------------------------------------------------------------
-- 9. RPC: upsert_day_record (atomic upsert, returns updated row + new achievements)
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
  p_sleep_goal      numeric DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_result day_records%ROWTYPE;
  v_achievements JSONB;
BEGIN
  -- Insert or get existing
  INSERT INTO day_records (user_id, date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Update only non-null fields
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
    sleep_goal      = COALESCE(p_sleep_goal, sleep_goal)
  WHERE user_id = p_user_id AND date = p_date
  RETURNING * INTO v_result;

  -- Check achievements (stats already updated by trigger)
  SELECT check_and_unlock_achievements(p_user_id, p_date) INTO v_achievements;

  RETURN jsonb_build_object(
    'record', to_jsonb(v_result),
    'newAchievements', v_achievements
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
