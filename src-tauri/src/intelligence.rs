use openrouter_rs::{
    api::chat::{ChatCompletionRequest, Message},
    types::Role,
    OpenRouterClient,
};

/// Model used only to confirm a key authenticates and can complete.
const TEST_MODEL: &str = "~anthropic/claude-sonnet-latest";

/// Validate an OpenRouter API key by sending a tiny "Hello" completion.
///
/// The key is passed in from the frontend (freshly typed by the user) and is
/// never persisted here — the caller only saves it to the keychain once this
/// returns `Ok`. Returns the provider error string on failure so the dialog can
/// show it.
#[tauri::command]
pub async fn test_openrouter_key(key: String) -> Result<(), String> {
    let client = OpenRouterClient::builder()
        .api_key(key)
        .http_referer("https://github.com/ghastmailer")
        .x_title("GhastMailer")
        .build()
        .map_err(|e| e.to_string())?;

    let request = ChatCompletionRequest::builder()
        .model(TEST_MODEL)
        .messages(vec![Message::new(Role::User, "Hello")])
        .max_tokens(1)
        .build()
        .map_err(|e| e.to_string())?;

    client
        .chat()
        .create(&request)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
