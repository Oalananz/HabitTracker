-- =====================================================
-- Migration: Competitive Recovery Mode
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Shared competitive journeys
-- =====================================================
CREATE TABLE IF NOT EXISTS competitive_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  rules_text TEXT,
  rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_failures INTEGER CHECK (max_failures IS NULL OR max_failures >= 0),
  consequence_rules TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  invite_code TEXT NOT NULL UNIQUE DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitive_journeys_owner_id ON competitive_journeys(owner_id);
CREATE INDEX IF NOT EXISTS idx_competitive_journeys_visibility ON competitive_journeys(visibility, is_active);

-- Keep updated_at in sync for mutable journey metadata.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_competitive_journeys_updated_at ON competitive_journeys;
CREATE TRIGGER update_competitive_journeys_updated_at
  BEFORE UPDATE ON competitive_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Participants
-- =====================================================
CREATE TABLE IF NOT EXISTS journey_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES competitive_journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'failed')),
  current_streak BIGINT NOT NULL DEFAULT 0,
  total_failures INTEGER NOT NULL DEFAULT 0 CHECK (total_failures >= 0),
  last_failure_at TIMESTAMPTZ,
  last_check_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (journey_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_journey_participants_journey_id ON journey_participants(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_participants_user_id ON journey_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_participants_status ON journey_participants(status);

-- =====================================================
-- Shared failure logs
-- =====================================================
CREATE TABLE IF NOT EXISTS journey_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES competitive_journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_failures_journey_id ON journey_failures(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_failures_user_id ON journey_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_failures_timestamp ON journey_failures(timestamp DESC);

-- =====================================================
-- Consequences and trigger status
-- =====================================================
CREATE TABLE IF NOT EXISTS journey_consequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES competitive_journeys(id) ON DELETE CASCADE,
  failure_threshold INTEGER NOT NULL CHECK (failure_threshold > 0),
  description TEXT NOT NULL,
  consequence_type TEXT NOT NULL DEFAULT 'text' CHECK (consequence_type IN ('text', 'symbolic', 'warning', 'penalty')),
  symbol TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (journey_id, failure_threshold, description)
);

CREATE INDEX IF NOT EXISTS idx_journey_consequences_journey_id ON journey_consequences(journey_id);

CREATE TABLE IF NOT EXISTS journey_consequence_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES competitive_journeys(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES journey_participants(id) ON DELETE CASCADE,
  consequence_id UUID NOT NULL REFERENCES journey_consequences(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'triggered' CHECK (status IN ('triggered', 'resolved')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (participant_id, consequence_id)
);

CREATE INDEX IF NOT EXISTS idx_journey_consequence_statuses_journey_id ON journey_consequence_statuses(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_consequence_statuses_participant_id ON journey_consequence_statuses(participant_id);

-- =====================================================
-- Invite system
-- =====================================================
CREATE TABLE IF NOT EXISTS journey_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES competitive_journeys(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  invitee_email TEXT,
  invitee_username TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journey_invites_journey_id ON journey_invites(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_invites_invitee_user_id ON journey_invites(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_journey_invites_status ON journey_invites(status);
CREATE INDEX IF NOT EXISTS idx_journey_invites_token ON journey_invites(token);

-- =====================================================
-- Optional social accountability
-- =====================================================
CREATE TABLE IF NOT EXISTS journey_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES competitive_journeys(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  emoji TEXT NOT NULL DEFAULT '👏',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_reactions_journey_id ON journey_reactions(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_reactions_to_user_id ON journey_reactions(to_user_id);

-- =====================================================
-- Check-ins for mandatory daily accountability
-- =====================================================
CREATE TABLE IF NOT EXISTS journey_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id UUID NOT NULL REFERENCES competitive_journeys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (journey_id, user_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_journey_check_ins_journey_id ON journey_check_ins(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_check_ins_user_id ON journey_check_ins(user_id);

-- =====================================================
-- Disable RLS to match existing server-only authorization model
-- =====================================================
ALTER TABLE competitive_journeys DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_failures DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_consequences DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_consequence_statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_check_ins DISABLE ROW LEVEL SECURITY;
