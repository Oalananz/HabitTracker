-- ================================================================
-- Migration v7b: Learning Tracker + Safe Learning Website Connections
-- Run in your Supabase SQL Editor AFTER previous migrations (including v6).
--
-- Adds course/module/lesson/study-session/skill/certificate/resource
-- tracking, plus a connection-provider catalog and connected-account
-- table reserved for FUTURE OAuth providers. No OAuth flow is wired
-- up yet — the only supported connection methods in this version are
-- manual course-link entry and CSV import. No credentials (usernames,
-- passwords, cookies) are ever requested or stored by this schema.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. learning_courses
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_courses (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title                   text NOT NULL,
  provider                text,
  course_url              text,
  description             text,
  life_area               text DEFAULT 'learning',
  status                  text CHECK (status IN ('not_started','in_progress','completed','paused')) DEFAULT 'not_started',
  progress_percentage     int DEFAULT 0,
  started_at              timestamptz,
  completed_at            timestamptz,
  target_completion_date  date,
  external_provider_id    uuid,
  external_course_id      text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE learning_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_courses_select" ON learning_courses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "learning_courses_insert" ON learning_courses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "learning_courses_update" ON learning_courses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "learning_courses_delete" ON learning_courses FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS learning_courses_user_id_idx ON learning_courses(user_id);

-- ----------------------------------------------------------------
-- 2. learning_modules
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_modules (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id            uuid REFERENCES learning_courses(id) ON DELETE CASCADE,
  title                text,
  "order"              int DEFAULT 0,
  status               text CHECK (status IN ('not_started','in_progress','completed')) DEFAULT 'not_started',
  progress_percentage  int,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_modules_select" ON learning_modules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "learning_modules_insert" ON learning_modules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "learning_modules_update" ON learning_modules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "learning_modules_delete" ON learning_modules FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS learning_modules_user_id_idx ON learning_modules(user_id);

-- ----------------------------------------------------------------
-- 3. learning_lessons
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_lessons (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id            uuid REFERENCES learning_courses(id) ON DELETE CASCADE,
  module_id            uuid REFERENCES learning_modules(id) ON DELETE SET NULL,
  title                text,
  "order"              int DEFAULT 0,
  duration_minutes     int,
  status               text CHECK (status IN ('not_started','in_progress','completed')) DEFAULT 'not_started',
  completed_at         timestamptz,
  external_lesson_id   text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE learning_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_lessons_select" ON learning_lessons FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "learning_lessons_insert" ON learning_lessons FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "learning_lessons_update" ON learning_lessons FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "learning_lessons_delete" ON learning_lessons FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS learning_lessons_user_id_idx ON learning_lessons(user_id);

-- ----------------------------------------------------------------
-- 4. skills (defined before study_sessions so it can be referenced inline)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                 text NOT NULL,
  category             text,
  level                text CHECK (level IN ('beginner','intermediate','advanced')) DEFAULT 'beginner',
  progress_percentage  int DEFAULT 0,
  target_level         text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_select" ON skills FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "skills_insert" ON skills FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "skills_update" ON skills FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "skills_delete" ON skills FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS skills_user_id_idx ON skills(user_id);

-- ----------------------------------------------------------------
-- 5. study_sessions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id          uuid REFERENCES learning_courses(id) ON DELETE SET NULL,
  skill_id           uuid REFERENCES skills(id) ON DELETE SET NULL,
  title              text,
  duration_minutes   int NOT NULL,
  date               date NOT NULL,
  notes              text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_sessions_select" ON study_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "study_sessions_insert" ON study_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "study_sessions_update" ON study_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "study_sessions_delete" ON study_sessions FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS study_sessions_user_id_idx ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS study_sessions_user_id_date_idx ON study_sessions(user_id, date);

-- ----------------------------------------------------------------
-- 6. certificates
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title              text NOT NULL,
  provider           text,
  issue_date         date,
  certificate_url    text,
  file_url           text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates_select" ON certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "certificates_insert" ON certificates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "certificates_update" ON certificates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "certificates_delete" ON certificates FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS certificates_user_id_idx ON certificates(user_id);

-- ----------------------------------------------------------------
-- 7. learning_resources
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  url         text NOT NULL,
  type        text CHECK (type IN ('course','video','article','book','documentation','other')) DEFAULT 'other',
  provider    text,
  status      text CHECK (status IN ('saved','in_progress','completed')) DEFAULT 'saved',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_resources_select" ON learning_resources FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "learning_resources_insert" ON learning_resources FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "learning_resources_update" ON learning_resources FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "learning_resources_delete" ON learning_resources FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS learning_resources_user_id_idx ON learning_resources(user_id);

-- ----------------------------------------------------------------
-- 8. learning_providers — shared catalog, NOT user-scoped.
--    Only a 'manual' provider is enabled in this version. Any
--    'oauth'/'api_key'/'extension' rows added in the future are
--    inert until a real adapter + consent flow is implemented.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_providers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  type         text CHECK (type IN ('oauth','api_key','manual','extension')) NOT NULL,
  website_url  text,
  is_enabled   boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE learning_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_providers_select_all" ON learning_providers FOR SELECT USING (true);

INSERT INTO learning_providers (name, type, website_url, is_enabled)
SELECT 'Manual Course Link', 'manual', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM learning_providers WHERE name = 'Manual Course Link');

-- ----------------------------------------------------------------
-- 9. connected_learning_accounts
--    Token columns are reserved for FUTURE OAuth providers. No code
--    path in this version writes to access_token_encrypted /
--    refresh_token_encrypted — they remain NULL.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connected_learning_accounts (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_id               uuid REFERENCES learning_providers(id),
  display_name              text,
  external_account_id       text,
  access_token_encrypted    text,
  refresh_token_encrypted   text,
  token_expires_at          timestamptz,
  scopes                    text,
  status                    text CHECK (status IN ('connected','expired','disconnected','error')) DEFAULT 'connected',
  last_synced_at            timestamptz,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

ALTER TABLE connected_learning_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connected_learning_accounts_select" ON connected_learning_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "connected_learning_accounts_insert" ON connected_learning_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "connected_learning_accounts_update" ON connected_learning_accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "connected_learning_accounts_delete" ON connected_learning_accounts FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS connected_learning_accounts_user_id_idx ON connected_learning_accounts(user_id);

-- ----------------------------------------------------------------
-- 10. external_learning_courses — reserved for FUTURE OAuth sync.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS external_learning_courses (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connected_account_id    uuid REFERENCES connected_learning_accounts(id) ON DELETE CASCADE,
  provider_id             uuid REFERENCES learning_providers(id),
  external_course_id      text,
  title                   text,
  url                     text,
  provider_name           text,
  progress_percentage     int,
  status                  text,
  last_synced_at          timestamptz,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE external_learning_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_learning_courses_select" ON external_learning_courses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "external_learning_courses_insert" ON external_learning_courses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "external_learning_courses_update" ON external_learning_courses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "external_learning_courses_delete" ON external_learning_courses FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS external_learning_courses_user_id_idx ON external_learning_courses(user_id);
