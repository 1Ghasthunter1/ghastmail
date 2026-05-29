mod migrations;
mod keyring;
use apple_native_keyring_store::keychain;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    keyring_core::set_default_store(keychain::Store::new().expect("failed to open macos keychain"));
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(migrations::DB_URL, migrations::migrations())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![keyring::set_keychain_key, keyring::get_keychain_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}
