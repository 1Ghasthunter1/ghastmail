import { execute, select } from "./client";

/**
 * Mail accounts.
 *
 * This module is the canonical example of the db-query pattern (see
 * `src/lib/db/SKILL.md`): one file per table/domain, exporting small, typed,
 * async functions. Components never write SQL — they call these.
 */

/** A mail account, as exposed to the app (camelCase). */
export interface Account {
  id: number;
  provider: string;
  displayName: string;
  email: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
  createdAt: string;
}

/** Raw row shape returned by SQLite (snake_case columns). */
interface AccountRow {
  id: number;
  provider: string;
  display_name: string;
  email: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string;
  created_at: string;
}

/** Fields needed to create an account. `displayName` defaults to `''`. */
export interface CreateAccountInput {
  provider: string;
  displayName?: string;
  email: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    provider: row.provider,
    displayName: row.display_name,
    email: row.email,
    clientId: row.client_id,
    clientSecret: row.client_secret,
    redirectUri: row.redirect_uri,
    scopes: row.scopes,
    createdAt: row.created_at,
  };
}

/** All accounts, newest first. */
export async function listAccounts(): Promise<Account[]> {
  const rows = await select<AccountRow>(
    "SELECT * FROM accounts ORDER BY created_at DESC, id DESC",
  );
  return rows.map(toAccount);
}

/** A single account by id, or `null` if it doesn't exist. */
export async function getAccount(id: number): Promise<Account | null> {
  const rows = await select<AccountRow>(
    "SELECT * FROM accounts WHERE id = $1",
    [id],
  );
  return rows.length ? toAccount(rows[0]) : null;
}

/** Insert an account and return the freshly-created row. */
export async function createAccount(
  input: CreateAccountInput,
): Promise<Account> {
  const { lastInsertId } = await execute(
    `INSERT INTO accounts
       (provider, display_name, email, client_id, client_secret, redirect_uri, scopes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.provider,
      input.displayName ?? "",
      input.email,
      input.clientId,
      input.clientSecret,
      input.redirectUri,
      input.scopes,
    ],
  );

  const created = await getAccount(lastInsertId!);
  if (!created) {
    throw new Error("createAccount: row vanished immediately after insert");
  }
  return created;
}

/** Delete an account by id. Returns true if a row was removed. */
export async function deleteAccount(id: number): Promise<boolean> {
  const { rowsAffected } = await execute(
    "DELETE FROM accounts WHERE id = $1",
    [id],
  );
  return rowsAffected > 0;
}
