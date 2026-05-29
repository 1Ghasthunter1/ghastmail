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