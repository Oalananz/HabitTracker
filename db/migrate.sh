#!/bin/sh
# Applies every db/migrations/*.sql file not yet recorded in schema_migrations,
# in filename order, each in its own transaction. Safe to run repeatedly.
set -eu

export PGPASSWORD="$POSTGRES_PASSWORD"
psql_cmd() {
  psql -v ON_ERROR_STOP=1 -q -h "${POSTGRES_HOST:-db}" -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
}

psql_cmd -c "CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)"

applied=0
for file in /db/migrations/*.sql; do
  name=$(basename "$file")
  if [ "$(psql_cmd -tAc "SELECT 1 FROM schema_migrations WHERE filename = '$name'")" = "1" ]; then
    continue
  fi
  echo "migrate: applying $name"
  psql_cmd --single-transaction -f "$file" \
    -c "INSERT INTO schema_migrations (filename) VALUES ('$name')"
  applied=$((applied + 1))
done

echo "migrate: done ($applied applied)"
