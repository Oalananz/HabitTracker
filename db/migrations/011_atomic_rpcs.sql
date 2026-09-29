-- =============================================================
-- Migration: atomic increment RPCs (prevent race conditions)
-- =============================================================

-- 1. Atomic goal progress increment (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_goal_progress(
  p_goal_id UUID,
  p_user_id UUID,
  p_amount INT DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE goals
  SET
    current_count = current_count + p_amount,
    completed = CASE
      WHEN current_count + p_amount >= target_count THEN true
      ELSE completed
    END,
    completed_at = CASE
      WHEN current_count + p_amount >= target_count THEN NOW()
      ELSE completed_at
    END
  WHERE id = p_goal_id AND user_id = p_user_id
  RETURNING to_jsonb(goals.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 2. Atomic journey failure increment (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_journey_failure(
  p_participant_id UUID,
  p_reset_streak BOOLEAN DEFAULT TRUE
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE journey_participants
  SET
    total_failures = total_failures + 1,
    current_streak = CASE WHEN p_reset_streak THEN 0 ELSE current_streak END,
    last_failure_at = CASE WHEN p_reset_streak THEN NOW() ELSE last_failure_at END
  WHERE id = p_participant_id
  RETURNING to_jsonb(journey_participants.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
