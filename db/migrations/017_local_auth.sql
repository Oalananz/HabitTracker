-- =====================================================
-- Local authentication: server-side sessions.
-- users.password_hash (see 001_core.sql) holds a scrypt hash; each login
-- creates a row here and the browser only ever receives the opaque token.
-- Only a SHA-256 of the token is stored, so a DB leak can't replay sessions.
-- =====================================================

CREATE TABLE IF NOT EXISTS sessions (
  token_hash   TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
