use keyring_core::{Entry, Error};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

const SERVICE_NAME: &str = "ghastmailer";

/// In-process cache of secrets already read from (or written to) the keychain.
///
/// WHY THIS EXISTS. macOS scopes a keychain item's ACL to the exact binary that
/// created it, identified by code signature. Tauri dev builds are unsigned, so
/// every `cargo` rebuild produces a new identity that the item doesn't trust —
/// which means an authorization dialog on every single read, and "Always Allow"
/// stops applying as soon as you rebuild. Reading once per process turns "a
/// dialog every time you send" into "at most one dialog per app launch".
///
/// Writes populate the cache too, so adding an account and then sending from it
/// in the same session never reads the keychain at all.
///
/// TRADEOFF. This keeps the app password resident in process memory for the
/// lifetime of the app, rather than only while a connection is open. That is a
/// deliberate deviation, bounded by: the value is only ever reachable from Rust
/// (there is no JS read path — see `src/lib/keychain.ts`), it is never logged,
/// and it lives in the same process that is already authorized to read it.
/// A signed release build with a stable identity would make the dialogs go away
/// on their own; then this is just an optimization.
fn cache() -> &'static Mutex<HashMap<String, String>> {
    static CACHE: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Read a secret, preferring the cache.
///
/// Internal to Rust on purpose: this is the function other modules (e.g.
/// `gmail::send_gmail_message`) call when they need an actual password. It is
/// deliberately not a `#[tauri::command]` — secrets never travel back to the
/// webview.
pub fn read_secret(key: &str) -> Result<Option<String>, String> {
    if let Some(hit) = cache()
        .lock()
        .map_err(|e| e.to_string())?
        .get(key)
        .cloned()
    {
        return Ok(Some(hit));
    }

    let entry = Entry::new(SERVICE_NAME, key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(secret) => {
            cache()
                .lock()
                .map_err(|e| e.to_string())?
                .insert(key.to_string(), secret.clone());
            Ok(Some(secret))
        }
        Err(Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_keychain_key(k: String, v: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &k).map_err(|e| e.to_string())?;
    entry.set_password(&v).map_err(|e| e.to_string())?;
    // Seed the cache: we already hold the plaintext, so a send right after
    // adding an account needs no keychain read (and no dialog) at all.
    cache().lock().map_err(|e| e.to_string())?.insert(k, v);
    Ok(())
}

#[tauri::command]
pub fn check_keychain_key_set(k: String) -> Result<bool, String> {
    // Answered from the cache when possible — this runs on every render of the
    // Intelligence settings panel, and it must not become a dialog storm.
    if cache().lock().map_err(|e| e.to_string())?.contains_key(&k) {
        return Ok(true);
    }
    let entry = Entry::new(SERVICE_NAME, &k).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(Error::NoEntry) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_keychain_key(k: String) -> Result<(), String> {
    cache().lock().map_err(|e| e.to_string())?.remove(&k);
    let entry = Entry::new(SERVICE_NAME, &k).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        // Already gone — treat as success so deleting is idempotent.
        Err(Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
