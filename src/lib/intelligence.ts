import { invoke } from "@tauri-apps/api/core";

/**
 * Thin wrappers over the Rust intelligence commands (see
 * `src-tauri/src/intelligence.rs`). LLM API calls live in Rust so API keys never
 * need to be read back into the webview.
 */

/**
 * Validate an OpenRouter API key by sending a tiny test completion through the
 * SDK. Resolves on success; rejects with the provider error message otherwise.
 */
export function testOpenRouterKey(apiKey: string): Promise<void> {
  return invoke("test_openrouter_key", { key: apiKey });
}
