import { invoke } from "@tauri-apps/api/core";

/**
 * Thin wrappers over the Rust keychain commands (see
 * `src-tauri/src/keyring.rs`). Secrets live in the OS keychain — never in the
 * SQLite db — so the frontend only ever stores or checks them, it doesn't keep
 * the values around.
 *
 * The Rust commands take single-letter args (`k`, `v`); Tauri maps those
 * straight through, so the invoke payload uses the same names.
 */

/** Store (or overwrite) the secret stored under `key`. */
export function setKeychainKey(key: string, value: string): Promise<void> {
  return invoke("set_keychain_key", { k: key, v: value });
}

// NOTE: there is intentionally no "read secret" wrapper. Secrets only flow
// *into* Rust (save / connectivity test) and never back out to JS — an injected
// script in a rendered email must not be able to read stored API keys. Rust
// reads keys from the keychain internally when it needs them.

/** Whether a secret is stored under `key` (without reading the value). */
export function checkKeychainKeySet(key: string): Promise<boolean> {
  return invoke("check_keychain_key_set", { k: key });
}

/** Remove the secret stored under `key`. A no-op if nothing is stored. */
export function deleteKeychainKey(key: string): Promise<void> {
  return invoke("delete_keychain_key", { k: key });
}
