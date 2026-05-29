-- 0001_init: initial schema
--
-- Migrations are append-only and idempotent. Once a version has shipped, never
-- edit its SQL — add a new numbered file and register it in `migrations.rs`.

CREATE TABLE IF NOT EXISTS accounts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    provider      TEXT    NOT NULL,
    display_name  TEXT    NOT NULL DEFAULT '',
    email         TEXT    NOT NULL,
    client_id     TEXT    NOT NULL,
    client_secret TEXT    NOT NULL,
    redirect_uri  TEXT    NOT NULL,
    scopes        TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (provider, email)
);
