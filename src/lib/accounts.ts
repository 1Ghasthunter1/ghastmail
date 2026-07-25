import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  accountKeychainKey,
  createAccount,
  deleteAccount,
  listAccounts,
  type Account,
} from "./db";
import { deleteKeychainKey, setKeychainKey } from "./keychain";
import { verifyGmailAccount } from "./gmail";

/**
 * Account queries and mutations, shared by every screen that touches accounts.
 *
 * These live here rather than next to a component because both `pages/Home.tsx`
 * and `common/components/accounts-settings.tsx` mutate accounts, and they have
 * to invalidate the *same* query key or one view goes stale after the other
 * changes something.
 *
 * The split of responsibilities: SQLite holds the account record, the OS
 * keychain holds the app password, and these hooks are the only place that
 * keeps the two in step.
 */

export const accountKeys = {
  all: ["accounts"] as const,
  one: (id: number) => ["accounts", id] as const,
};

export function useAccounts() {
  return useQuery({ queryKey: accountKeys.all, queryFn: listAccounts });
}

/** What the Add Account dialog collects. */
export interface AddGmailAccountInput {
  email: string;
  /** Whitespace already stripped by the form; stripped again in Rust. */
  password: string;
  /** Optional; falls back to the email address. */
  displayName?: string;
}

/**
 * Verify a Gmail app password, then persist the account.
 *
 * Order matters:
 *   1. Verify IMAP *and* SMTP. An account that reads fine but silently fails to
 *      send is worse than a clean rejection, so a half-success saves nothing.
 *   2. Mint a UUID and write the password to the keychain under it. Keying by
 *      UUID rather than email means re-adding the same address doesn't collide.
 *   3. Insert the row, caching what verification learned (CAPABILITY,
 *      special-use folder map).
 *
 * If the insert fails we delete the keychain entry we just wrote — otherwise a
 * failed add leaves an orphaned credential behind, which is a real leak.
 *
 * Rejects with the structured `GmailError` from step 1 (see `lib/gmail.ts`), or
 * a plain `Error` from the storage steps.
 */
export async function addGmailAccount(
  input: AddGmailAccountInput,
): Promise<Account> {
  const email = input.email.trim();
  const verification = await verifyGmailAccount(email, input.password);

  const credentialRef = crypto.randomUUID();
  await setKeychainKey(accountKeychainKey(credentialRef), input.password);

  try {
    return await createAccount({
      credentialRef,
      email,
      displayName: input.displayName?.trim() || email,
      capabilities: verification.imapCapabilities,
      specialUse: verification.specialUse,
    });
  } catch (e) {
    await deleteKeychainKey(accountKeychainKey(credentialRef)).catch(() => {
      // Best effort. Surfacing the original insert error matters more than
      // reporting that cleanup also failed.
    });
    throw e;
  }
}

export function useAddGmailAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addGmailAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

/**
 * Remove an account and its stored app password.
 *
 * The keychain entry goes too — leaving it behind is the orphaned-credential
 * leak this whole UUID-keyed scheme exists to avoid.
 */
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (account: Account) => {
      await deleteAccount(account.id);
      await deleteKeychainKey(accountKeychainKey(account.credentialRef));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}
