-- Rebuild `accounts` around Gmail app-password auth.
--
-- The old shape stored a bring-your-own OAuth client (client_id, client_secret,
-- redirect_uri, scopes) — including the secret in plaintext — for a flow that
-- was never implemented. App passwords replace it: the secret goes to the OS
-- keychain and this table stores only a reference to it.
--
-- Dropping rather than migrating is safe here: nothing shipped, and the OAuth
-- columns were never meaningfully populated.
DROP TABLE IF EXISTS accounts;

CREATE TABLE accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    -- UUID v4. This is the keychain entry's name, never the secret itself.
    -- Keyed by UUID rather than email on purpose: people add and remove the
    -- same address repeatedly while testing, and email-keyed entries collide.
    credential_ref  TEXT    NOT NULL UNIQUE,
    -- Reserved discriminators. Today always 'gmail'/'app_password'; they cost
    -- one column each now versus migrating every stored account later.
    provider        TEXT    NOT NULL DEFAULT 'gmail',
    auth_method     TEXT    NOT NULL DEFAULT 'app_password',
    display_name    TEXT    NOT NULL DEFAULT '',
    email           TEXT    NOT NULL,
    -- Cached IMAP CAPABILITY response (JSON array), refreshed per session.
    capabilities    TEXT    NOT NULL DEFAULT '[]',
    -- RFC 6154 special-use flag -> folder path (JSON object). Gmail's folder
    -- names are localized, so these flags are the only safe way to find them.
    special_use     TEXT    NOT NULL DEFAULT '{}',
    -- Set when the app password stops authenticating mid-life. Nothing writes
    -- it yet — there's no sync engine to notice.
    needs_attention INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- No UNIQUE (provider, email): adding the same address twice is allowed.
-- Server host and port are deliberately absent — they're constants for Gmail.
-- When a second provider lands they move into this table and Gmail rows get
-- defaults on migration.
