import Database from "@tauri-apps/plugin-sql";

/**
 * Connection string for the app database. Must stay in sync with `DB_URL` in
 * `src-tauri/src/migrations.rs` — migrations are registered against this exact
 * string on the Rust side.
 */
export const DB_NAME = "sqlite:ghastmail.db";

/**
 * Lazily-opened, process-wide database handle.
 *
 * `Database.load` opens the connection and runs any pending migrations, so we
 * memoize the promise: every caller shares one connection and migrations run
 * at most once per session.
 */
let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_NAME);
  }
  return dbPromise;
}

/**
 * Run a read query and get back typed rows.
 *
 * SQLite returns columns exactly as named in the SQL (snake_case here), so the
 * caller's row type should describe the raw shape; map to camelCase in the
 * query module (see `accounts.ts`).
 */
export async function select<Row>(
  sql: string,
  params: unknown[] = [],
): Promise<Row[]> {
  const db = await getDb();
  return db.select<Row[]>(sql, params);
}

/** Result of a write (`INSERT` / `UPDATE` / `DELETE`). */
export interface ExecuteResult {
  rowsAffected: number;
  /** Row id of the last `INSERT`; undefined for `UPDATE`/`DELETE`. */
  lastInsertId?: number;
}

/** Run a write query (`INSERT` / `UPDATE` / `DELETE`). */
export async function execute(
  sql: string,
  params: unknown[] = [],
): Promise<ExecuteResult> {
  const db = await getDb();
  return db.execute(sql, params);
}
