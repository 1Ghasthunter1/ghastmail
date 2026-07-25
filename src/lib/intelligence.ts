import { invoke } from "@tauri-apps/api/core";

/**
 * Thin wrappers over the Rust intelligence commands (see
 * `src-tauri/src/intelligence.rs`). LLM API calls live in Rust so API keys never
 * need to be read back into the webview.
 */

/**
 * Validate an OpenRouter API key by sending a tiny test completion through the
 * SDK. Resolves on success; rejects with the provider error message otherwise.
 *
 * The rejection is a plain string here because there's only one failure the
 * user can act on. `verifyGmailAccount` in `src/lib/gmail.ts` deliberately
 * rejects with a structured object instead — Gmail has a whole taxonomy of
 * failures that need different advice.
 */
export function testOpenRouterKey(apiKey: string): Promise<void> {
  return invoke("test_openrouter_key", { key: apiKey });
}
