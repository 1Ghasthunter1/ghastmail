-- 0002_add_intelligences: LLM provider credentials ("Intelligence")
--
-- Migrations are append-only and idempotent. Once a version has shipped, never
-- edit its SQL — add a new numbered file and register it in `migrations.rs`.
--
-- NOTE: api_key is stored in plaintext for now; encryption is a later concern.

CREATE TABLE IF NOT EXISTS intelligences (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    provider   TEXT    NOT NULL,
    api_key    TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
