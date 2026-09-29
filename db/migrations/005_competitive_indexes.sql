-- Query latency optimization for competitive mode endpoints.
-- Focus: /api/journeys and /api/journeys/[id]

CREATE INDEX IF NOT EXISTS idx_journey_participants_journey_status_joined
  ON journey_participants(journey_id, status, joined_at);

CREATE INDEX IF NOT EXISTS idx_journey_failures_journey_timestamp
  ON journey_failures(journey_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_journey_failures_journey_user_timestamp
  ON journey_failures(journey_id, user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_journey_consequence_statuses_journey_status_participant
  ON journey_consequence_statuses(journey_id, status, participant_id);

CREATE INDEX IF NOT EXISTS idx_journey_reactions_journey_created
  ON journey_reactions(journey_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journey_invites_journey_status_created
  ON journey_invites(journey_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journey_invites_journey_invitee_status
  ON journey_invites(journey_id, invitee_user_id, status);

CREATE INDEX IF NOT EXISTS idx_competitive_journeys_active_created
  ON competitive_journeys(is_active, created_at DESC);
