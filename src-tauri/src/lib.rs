mod migrations;
mod keyring;
mod intelligence;
mod gmail;
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
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            keyring::set_keychain_key,
            keyring::check_keychain_key_set,
            keyring::delete_keychain_key,
            intelligence::test_openrouter_key,
            gmail::verify_gmail_account
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}
