import { execute, select } from "./client";

/**
 * Mail accounts.
 *
 * This module is the canonical example of the db-query pattern (see
 * `src/lib/db/SKILL.md`): one file per table/domain, exporting small, typed,
 * async functions. Components never write SQL — they call these.
 *
 * NOTE: the app password is *not* here and must never be. It lives in the OS
 * keychain under `account:<credentialRef>`; see `accountKeychainKey` below and
 * `src/lib/keychain.ts` for why secrets never flow back out to JS.
 */

/** Keychain entry name holding an account's app password. */
export function accountKeychainKey(credentialRef: string): string {
  return `account:${credentialRef}`;
}

/** A mail account, as exposed to the app (camelCase). */
export interface Account {
  id: number;
  /** UUID naming this account's keychain entry. Not the secret. */
  credentialRef: string;
  /** Reserved discriminator — always `"gmail"` today. */
  provider: string;
  /** Reserved discriminator — always `"app_password"` today. */
  authMethod: string;
  displayName: string;
  email: string;
  /** Cached IMAP CAPABILITY atoms, refreshed per session. */
  capabilities: string[];
  /** RFC 6154 special-use flag (`all`, `sent`, …) → folder path. */
  specialUse: Record<string, string>;
  /** True once the stored app password stops authenticating. */
  needsAttention: boolean;
  createdAt: string;
}

/** Raw row shape returned by SQLite (snake_case columns). */
interface AccountRow {
  id: number;
  credential_ref: string;
  provider: string;
  auth_method: string;
  display_name: string;
  email: string;
  /** JSON array. */
  capabilities: string;
  /** JSON object. */
  special_use: string;
  needs_attention: number;
  created_at: string;
}

/** Fields needed to create an account. */
export interface CreateAccountInput {
  credentialRef: string;
  email: string;
  displayName?: string;
  /** Defaults to `"gmail"`. */
  provider?: string;
  /** Defaults to `"app_password"`. */
  authMethod?: string;
  capabilities?: string[];
  specialUse?: Record<string, string>;
}

/**
 * Parse a JSON column, falling back to `fallback` if it's malformed.
 *
 * A corrupt cache column shouldn't make an otherwise-usable account
 * unreadable — both of these are re-derived on the next connection anyway.
 */
function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    credentialRef: row.credential_ref,
    provider: row.provider,
    authMethod: row.auth_method,
    displayName: row.display_name,
    email: row.email,
    capabilities: parseJson<string[]>(row.capabilities, []),
    specialUse: parseJson<Record<string, string>>(row.special_use, {}),
    needsAttention: row.needs_attention !== 0,
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
       (credential_ref, provider, auth_method, display_name, email, capabilities, special_use)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.credentialRef,
      input.provider ?? "gmail",
      input.authMethod ?? "app_password",
      input.displayName ?? "",
      input.email,
      JSON.stringify(input.capabilities ?? []),
      JSON.stringify(input.specialUse ?? {}),
    ],
  );

  const created = await getAccount(lastInsertId!);
  if (!created) {
    throw new Error("createAccount: row vanished immediately after insert");
  }
  return created;
}

/**
 * Refresh the cached CAPABILITY / special-use map for an account.
 *
 * Both are session-scoped facts about the server, so they're re-read on each
 * connection rather than trusted indefinitely.
 */
export async function updateAccountSession(input: {
  id: number;
  capabilities: string[];
  specialUse: Record<string, string>;
}): Promise<boolean> {
  const { rowsAffected } = await execute(
    "UPDATE accounts SET capabilities = $1, special_use = $2 WHERE id = $3",
    [
      JSON.stringify(input.capabilities),
      JSON.stringify(input.specialUse),
      input.id,
    ],
  );
  return rowsAffected > 0;
}

/** Flag (or clear) an account whose stored app password stopped working. */
export async function setAccountNeedsAttention(input: {
  id: number;
  needsAttention: boolean;
}): Promise<boolean> {
  const { rowsAffected } = await execute(
    "UPDATE accounts SET needs_attention = $1 WHERE id = $2",
    [input.needsAttention ? 1 : 0, input.id],
  );
  return rowsAffected > 0;
}

/**
 * Delete an account by id. Returns true if a row was removed.
 *
 * The caller must also delete the keychain entry — see `useDeleteAccount` in
 * `src/lib/accounts.ts`, which does both. Orphaned credentials are a real leak.
 */
export async function deleteAccount(id: number): Promise<boolean> {
  const { rowsAffected } = await execute(
    "DELETE FROM accounts WHERE id = $1",
    [id],
  );
  return rowsAffected > 0;
}
