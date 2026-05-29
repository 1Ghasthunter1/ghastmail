//! Database migrations for the app's SQLite database.
//!
//! HOW TO ADD A MIGRATION
//! 1. Create the next numbered SQL file in `src-tauri/migrations/`, e.g.
//!    `0002_add_messages.sql`. Use the next sequential `version`.
//! 2. Append a `Migration { .. }` entry to the vec below with that version,
//!    a short snake_case `description`, the `include_str!`'d SQL, and
//!    `MigrationKind::Up`.
//! 3. Never edit a migration that has already shipped — migrations are
//!    append-only. Fix mistakes with a new forward migration.
//!
//! Migrations run inside a transaction at startup (preloaded in
//! `tauri.conf.json`) and again whenever the frontend calls `Database.load`.
//! They must be safe to re-run, so prefer `IF NOT EXISTS` guards.

use tauri_plugin_sql::{Migration, MigrationKind};

/// Connection string for the app database. Keep this in sync with `DB_NAME`
/// on the frontend (`src/lib/db/client.ts`).
pub const DB_URL: &str = "sqlite:ghastmail.db";

/// The ordered list of migrations applied to [`DB_URL`].
pub fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "init",
            sql: include_str!("../migrations/0001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_intelligences",
            sql: include_str!("../migrations/0002_add_intelligences.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
