import { execute, select } from "./client";

/**
 * Intelligences — saved LLM provider credentials (Claude, OpenAI, …).
 *
 * Follows the same db-query pattern as `accounts.ts` (see
 * `src/lib/db/SKILL.md`). The `api_key` is stored in plaintext for now;
 * encryption is a later concern.
 */

/** A saved LLM credential, as exposed to the app (camelCase). */
export interface Intelligence {
  id: number;
  provider: string;
  apiKey: string;
  createdAt: string;
}

/** Raw row shape returned by SQLite (snake_case columns). */
interface IntelligenceRow {
  id: number;
  provider: string;
  api_key: string;
  created_at: string;
}

/** Fields needed to create an intelligence. */
export interface CreateIntelligenceInput {
  provider: string;
  apiKey: string;
}

function toIntelligence(row: IntelligenceRow): Intelligence {
  return {
    id: row.id,
    provider: row.provider,
    apiKey: row.api_key,
    createdAt: row.created_at,
  };
}

/** All intelligences, newest first. */
export async function listIntelligences(): Promise<Intelligence[]> {
  const rows = await select<IntelligenceRow>(
    "SELECT * FROM intelligences ORDER BY created_at DESC, id DESC",
  );
  return rows.map(toIntelligence);
}

/** A single intelligence by id, or `null` if it doesn't exist. */
export async function getIntelligence(id: number): Promise<Intelligence | null> {
  const rows = await select<IntelligenceRow>(
    "SELECT * FROM intelligences WHERE id = $1",
    [id],
  );
  return rows.length ? toIntelligence(rows[0]) : null;
}

/** Insert an intelligence and return the freshly-created row. */
export async function createIntelligence(
  input: CreateIntelligenceInput,
): Promise<Intelligence> {
  const { lastInsertId } = await execute(
    "INSERT INTO intelligences (provider, api_key) VALUES ($1, $2)",
    [input.provider, input.apiKey],
  );

  const created = await getIntelligence(lastInsertId!);
  if (!created) {
    throw new Error("createIntelligence: row vanished immediately after insert");
  }
  return created;
}

/** Delete an intelligence by id. Returns true if a row was removed. */
export async function deleteIntelligence(id: number): Promise<boolean> {
  const { rowsAffected } = await execute(
    "DELETE FROM intelligences WHERE id = $1",
    [id],
  );
  return rowsAffected > 0;
}
