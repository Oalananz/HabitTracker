-- =====================================================
-- Editable site copy (e.g. the landing page), managed by admins.
-- One JSON document per key; the app validates it and falls back to
-- built-in defaults for anything missing or invalid.
-- =====================================================

CREATE TABLE IF NOT EXISTS site_content (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL
);
