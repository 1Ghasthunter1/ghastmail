use keyring_core::{Entry, Error};

const SERVICE_NAME: &str = "ghastmailer";

#[tauri::command]
pub fn set_keychain_key(k: String, v: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &k).map_err(|e| e.to_string())?;
    entry.set_password(&v).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_keychain_key(k: String) -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE_NAME, &k).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(secret) => Ok(Some(secret)),
        Err(Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
pub fn check_keychain_key_set(k: String) -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, &k).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(Error::NoEntry) => Ok(false),
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
pub fn delete_keychain_key(k: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, &k).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        // Already gone — treat as success so deleting is idempotent.
        Err(Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string())
    }
}