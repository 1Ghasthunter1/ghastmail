import { invoke } from "@tauri-apps/api/core";

/**
 * Thin wrapper over the Rust Gmail commands (see `src-tauri/src/gmail.rs`).
 *
 * The IMAP/SMTP round-trip lives in Rust so the app password only ever travels
 * *into* the shell — same policy as the intelligence keys (`src/lib/keychain.ts`).
 */

/** Which Gmail server, and how far the probe got, when something failed. */
export type GmailStage =
  | "imapConnect"
  | "imapTls"
  | "imapCapability"
  | "imapLogin"
  | "imapList"
  | "smtpConnect"
  | "smtpStarttls"
  | "smtpAuth"
  | "compose"
  | "smtpSend"
  | "keychain";

export type GmailErrorKind =
  | "auth_failed"
  | "imap_disabled"
  | "network_blocked"
  | "tls_invalid"
  | "smtp_auth_failed"
  | "rate_limited"
  | "timeout"
  | "credential_missing"
  | "invalid_recipient"
  | "unexpected";

export interface GmailError {
  kind: GmailErrorKind;
  stage: GmailStage;
  /** Fallback sentence authored in Rust. `gmailErrorMessage` has richer copy. */
  message: string;
  /** Verbatim server/library text for the Details disclosure. */
  raw: string | null;
}

/** What a successful probe learned about the account. */
export interface GmailVerification {
  email: string;
  /** IMAP CAPABILITY atoms, verbatim. */
  imapCapabilities: string[];
  /** RFC 6154 flag (`all`, `sent`, `drafts`, …) → folder path. */
  specialUse: Record<string, string>;
  smtpPort: number;
  smtpStarttls: boolean;
  elapsedMs: number;
}

/**
 * Verify a Gmail address + app password against imap.gmail.com and
 * smtp.gmail.com. Both must pass; nothing is persisted here.
 *
 * NOTE: unlike `testOpenRouterKey`, which rejects with a plain string, this
 * rejects with a structured `GmailError`. That's deliberate — the machine-readable
 * `kind` is what lets the dialog pick the right diagnostic instead of dumping raw
 * protocol text. Use `isGmailError` before touching the fields.
 */
export function verifyGmailAccount(
  email: string,
  password: string,
): Promise<GmailVerification> {
  return invoke<GmailVerification>("verify_gmail_account", { email, password });
}

export interface SendMessageInput {
  /** The sending account's `credentialRef` — Rust reads the password itself. */
  credentialRef: string;
  /** Must be the account's own address; Gmail rejects mismatched senders. */
  from: string;
  to: string[];
  subject: string;
  body: string;
}

/**
 * Send a plain-text message through Gmail's SMTP server.
 *
 * Takes a `credentialRef`, not a password: the secret is read from the keychain
 * in Rust and never enters the webview. Rejects with a `GmailError`.
 *
 * Gmail files SMTP-sent mail into the Sent folder itself, so there's nothing
 * further to do on success.
 */
export function sendGmailMessage(input: SendMessageInput): Promise<void> {
  return invoke("send_gmail_message", {
    credentialRef: input.credentialRef,
    from: input.from,
    to: input.to,
    subject: input.subject,
    body: input.body,
  });
}

/** Narrow an unknown rejection value to a `GmailError`. */
export function isGmailError(e: unknown): e is GmailError {
  return (
    typeof e === "object" &&
    e !== null &&
    "kind" in e &&
    "stage" in e &&
    typeof (e as GmailError).kind === "string"
  );
}

/** Where Google's app-password generator lives. */
export const APP_PASSWORD_URL = "https://myaccount.google.com/apppasswords";
const IMAP_SETTINGS_URL =
  "https://mail.google.com/mail/u/0/#settings/fwdandpop";

export interface GmailErrorCopy {
  /** Dialog title. */
  title: string;
  /** The one sentence that explains what to do. */
  headline: string;
  /** Second-most-likely cause, when the protocol can't tell them apart. */
  secondary?: string;
  helpUrl?: string;
  helpLabel?: string;
  /** Whether a plain retry is worth offering. */
  retryable: boolean;
}

/**
 * Map a `GmailError` to something actionable.
 *
 * The important case is `auth_failed`: a regular Google password, a wrong or
 * revoked app password, app passwords disabled by a Workspace admin, and
 * Advanced Protection enrollment all produce a byte-identical server response.
 * One message has to cover all four, ordered by likelihood — app-password
 * confusion first, admin policy second. Never blame the password without
 * mentioning the app-password distinction; that's the actual cause most of the
 * time.
 */
export function gmailErrorCopy(err: unknown): GmailErrorCopy {
  if (!isGmailError(err)) {
    return {
      title: "Couldn't connect to Gmail",
      headline: "Something went wrong while connecting to Gmail.",
      retryable: true,
    };
  }

  switch (err.kind) {
    case "auth_failed":
      return {
        title: "Sign-in failed",
        headline:
          "Make sure you're using an app password, not your normal Google password.",
        secondary:
          "If this is a work or school account, your administrator may have disabled app passwords.",
        helpUrl: APP_PASSWORD_URL,
        helpLabel: "Create an app password",
        retryable: false,
      };

    case "imap_disabled":
      return {
        title: "IMAP is turned off",
        headline: "IMAP access is turned off for this account.",
        secondary:
          "Turn it on under Forwarding and POP/IMAP in Gmail's settings, then try again.",
        helpUrl: IMAP_SETTINGS_URL,
        helpLabel: "Open Gmail settings",
        retryable: true,
      };

    case "network_blocked":
      return {
        title: "Couldn't reach Gmail",
        headline:
          err.stage.startsWith("smtp")
            ? "Couldn't reach Gmail. A firewall or network may be blocking ports 587 and 465."
            : "Couldn't reach Gmail. A firewall or network may be blocking port 993.",
        retryable: true,
      };

    case "tls_invalid":
      return {
        title: "Certificate not trusted",
        headline: "Couldn't verify Gmail's certificate, so the connection was refused.",
        secondary:
          "This usually means something on the network is inspecting encrypted traffic — a corporate proxy, for example.",
        retryable: false,
      };

    case "smtp_auth_failed":
      // Same failure, two very different situations. During setup IMAP had just
      // accepted the credential seconds earlier, so it's likely transient. While
      // sending from a saved account, the stored password has probably been
      // revoked — app passwords are revocable and people revoke them.
      // `smtpAuth` only occurs during setup; `smtpSend` only when sending.
      return err.stage === "smtpSend"
        ? {
            title: "Sending failed",
            headline: "Gmail rejected this account's app password.",
            secondary:
              "It may have been revoked. Remove the account under Settings → Accounts and add it again with a new app password.",
            helpUrl: APP_PASSWORD_URL,
            helpLabel: "Create an app password",
            retryable: true,
          }
        : {
            title: "Sending failed",
            headline: "Reading mail works, but sending failed.",
            secondary:
              "Gmail accepted these credentials for IMAP a moment ago, so this is often temporary.",
            retryable: true,
          };

    case "rate_limited":
      return {
        title: "Gmail is limiting connections",
        headline:
          "Gmail is temporarily limiting connections. Try again in a few minutes.",
        retryable: true,
      };

    case "timeout":
      return {
        title: "Gmail didn't respond",
        headline: "Gmail didn't respond in time.",
        retryable: true,
      };

    case "credential_missing":
      return {
        title: "App password missing",
        headline: "This account's app password isn't in your keychain.",
        secondary:
          "Remove the account under Settings → Accounts and add it again.",
        retryable: false,
      };

    case "invalid_recipient":
      return {
        title: "Check the address",
        // Rust names the offending address, which matters when several were
        // typed into the To field.
        headline: err.message,
        retryable: false,
      };

    case "unexpected":
    default:
      return {
        title: "Couldn't connect to Gmail",
        headline: err.message || "Something went wrong while connecting to Gmail.",
        retryable: true,
      };
  }
}
