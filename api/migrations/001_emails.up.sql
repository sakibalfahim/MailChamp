CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS emails (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('draft','sent','archived')),
  subject       TEXT NOT NULL DEFAULT '',
  body_html     TEXT NOT NULL DEFAULT '',
  body_text     TEXT NOT NULL DEFAULT '',
  intent        TEXT,
  key_facts     JSONB NOT NULL DEFAULT '[]',
  tone          TEXT,
  strategy      TEXT CHECK (strategy IS NULL OR strategy IN ('advanced','naive')),
  to_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS emails_user_status_idx ON emails (user_id, status, updated_at DESC);
