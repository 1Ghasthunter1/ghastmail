//! Gmail account verification over IMAP + SMTP with an app password.
//!
//! One command, [`verify_gmail_account`], runs the full probe: connect and sign
//! in to `imap.gmail.com`, read `CAPABILITY` and the RFC 6154 special-use
//! folder map, then authenticate against `smtp.gmail.com`. Both halves must
//! pass — an account that reads fine but silently fails to send is worse than a
//! clean rejection — and nothing is persisted here. The caller only writes the
//! password to the keychain once this returns `Ok`.
//!
//! PASSWORD HYGIENE. The app password lives in a local `String` that is dropped
//! when the probe ends. It is never a field of a `Debug` type, never
//! interpolated into a message we author, and every `raw` string we return
//! comes from the server or the client library. There are no `println!`/`dbg!`
//! calls in this module, `imap`'s traffic echo is switched off explicitly, and
//! lettre's `tracing` feature is left disabled in `Cargo.toml` (it would log the
//! base64 `AUTH PLAIN` blob).
//!
//! TODO(packaging): `pnpm tauri dev` and an unsandboxed `tauri build` open
//! these sockets fine, but a notarized build under the hardened runtime or App
//! Sandbox will need `com.apple.security.network.client` in a macOS
//! entitlements plist referenced from `bundle.macOS.entitlements`.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::{TcpStream, ToSocketAddrs};
use std::time::{Duration, Instant};

use lettre::transport::smtp::authentication::{Credentials, Mechanism};
use lettre::transport::smtp::client::{SmtpConnection, TlsParameters};
use lettre::transport::smtp::extension::ClientId;
use serde::Serialize;

/// Endpoints are constants because Gmail is the only provider. If Google ever
/// moves one, that's a client update, not a user-facing setting.
const IMAP_HOST: &str = "imap.gmail.com";
const IMAP_PORT: u16 = 993;
const SMTP_HOST: &str = "smtp.gmail.com";
/// Preferred SMTP path: STARTTLS.
const SMTP_PORT_STARTTLS: u16 = 587;
/// Fallback when 587 is blocked on the user's network: implicit TLS.
const SMTP_PORT_IMPLICIT: u16 = 465;

const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
const OP_TIMEOUT: Duration = Duration::from_secs(30);
const TOTAL_BUDGET: Duration = Duration::from_secs(60);

/// Fixed EHLO name. Deliberately not the machine's hostname (lettre's
/// `hostname` feature is off) so we don't hand Google the user's computer name.
const EHLO_NAME: &str = "ghastmailer.local";

/// The RFC 6154 attributes we care about, lowercased with the leading
/// backslash stripped. Gmail's folder *names* are localized — a German account
/// has `[Gmail]/Gesendet` — so these flags are the only safe way to find them.
const SPECIAL_USE_FLAGS: [&str; 6] = ["all", "sent", "drafts", "trash", "junk", "flagged"];

// --- result types ------------------------------------------------------------

/// What a successful probe learned. Cached on the account record.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GmailVerification {
    /// Echoed back so the caller can confirm which account this belongs to.
    pub email: String,
    /// Every atom from the server's `CAPABILITY` response, verbatim.
    pub imap_capabilities: Vec<String>,
    /// Special-use flag -> mailbox path, e.g. `{"all": "[Gmail]/All Mail"}`.
    pub special_use: HashMap<String, String>,
    /// Which SMTP path actually worked, 587 or 465.
    pub smtp_port: u16,
    pub smtp_starttls: bool,
    pub elapsed_ms: u64,
}

/// Machine-readable failure classes. The frontend maps these to the wording in
/// the spec's error table; `raw` backs the "Details" disclosure.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GmailErrorKind {
    /// Four distinct causes collapse here — a regular Google password, a wrong
    /// or revoked app password, app passwords disabled by a Workspace admin,
    /// and Advanced Protection enrollment. Gmail answers all four with a
    /// byte-identical `NO [AUTHENTICATIONFAILED] Invalid credentials (Failure)`,
    /// so there is no signal to split on and we must not pretend there is.
    AuthFailed,
    /// Sign-in worked but the mailbox is unusable: IMAP is switched off in the
    /// account's Gmail settings.
    ImapDisabled,
    /// TCP refused, unreachable, or DNS failed — firewall, captive portal, or
    /// simply offline.
    NetworkBlocked,
    /// Certificate chain or hostname verification failed. Usually a corporate
    /// TLS-inspecting proxy. Never retried permissively.
    TlsInvalid,
    /// IMAP was fine; SMTP rejected the same credential.
    SmtpAuthFailed,
    /// Gmail is throttling us.
    RateLimited,
    /// A socket timed out, or the overall budget ran out.
    Timeout,
    /// Unclassified. `raw` is the only thing the user can act on.
    Unexpected,
}

/// Where the probe broke. Lets the UI distinguish "couldn't reach Gmail" from
/// "reading mail works, but sending failed" without any progress reporting.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Stage {
    ImapConnect,
    ImapTls,
    ImapCapability,
    ImapLogin,
    ImapList,
    SmtpConnect,
    SmtpStarttls,
    SmtpAuth,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GmailError {
    pub kind: GmailErrorKind,
    pub stage: Stage,
    /// A short sentence we author. The frontend has richer copy per kind; this
    /// is the fallback.
    pub message: String,
    /// Verbatim server or library text. Never contains the password.
    pub raw: Option<String>,
}

impl GmailError {
    fn new(kind: GmailErrorKind, stage: Stage, raw: Option<String>) -> Self {
        GmailError {
            kind,
            stage,
            message: headline(kind).to_string(),
            raw,
        }
    }
}

fn headline(kind: GmailErrorKind) -> &'static str {
    match kind {
        // Ordered by likelihood: app-password confusion first, admin policy second.
        GmailErrorKind::AuthFailed => {
            "Sign-in failed. Make sure you're using an app password, not your normal Google password."
        }
        GmailErrorKind::ImapDisabled => "IMAP access is turned off for this account.",
        GmailErrorKind::NetworkBlocked => {
            "Couldn't reach Gmail. A firewall or network may be blocking the connection."
        }
        GmailErrorKind::TlsInvalid => "Couldn't verify Gmail's certificate.",
        GmailErrorKind::SmtpAuthFailed => "Reading mail works, but sending failed.",
        GmailErrorKind::RateLimited => {
            "Gmail is temporarily limiting connections. Try again in a few minutes."
        }
        GmailErrorKind::Timeout => "Gmail didn't respond in time.",
        GmailErrorKind::Unexpected => "Something went wrong while connecting to Gmail.",
    }
}

// --- timing ------------------------------------------------------------------

/// Wall-clock ceiling for the whole probe.
///
/// This is enforced from inside the blocking closure rather than by wrapping
/// the task in a timeout: `spawn_blocking` isn't cancellable, so an outer
/// timeout would return to the UI while the thread kept running. Instead every
/// socket operation gets `min(30s, whatever's left)`, which can't overshoot.
struct Budget {
    deadline: Instant,
}

impl Budget {
    fn new() -> Self {
        Budget {
            deadline: Instant::now() + TOTAL_BUDGET,
        }
    }

    fn left(&self) -> Duration {
        self.deadline.saturating_duration_since(Instant::now())
    }

    fn op(&self) -> Duration {
        OP_TIMEOUT.min(self.left())
    }

    fn connect(&self) -> Duration {
        CONNECT_TIMEOUT.min(self.left())
    }

    fn expired(&self) -> bool {
        self.left().is_zero()
    }
}

// --- command -----------------------------------------------------------------

/// Verify a Gmail address + app password against both Gmail servers.
///
/// Returns the cached `CAPABILITY` list and special-use folder map on success.
/// On failure, returns a structured [`GmailError`] — unlike the `String` error
/// that `intelligence::test_openrouter_key` returns, because the frontend needs
/// a machine-readable `kind` to pick the right diagnostic message.
#[tauri::command]
pub async fn verify_gmail_account(
    email: String,
    password: String,
) -> Result<GmailVerification, GmailError> {
    // `imap` and lettre are both blocking, so this must not run on the async
    // executor.
    tauri::async_runtime::spawn_blocking(move || verify_blocking(email, password))
        .await
        .unwrap_or_else(|e| {
            Err(GmailError::new(
                GmailErrorKind::Unexpected,
                Stage::ImapConnect,
                Some(e.to_string()),
            ))
        })
}

fn verify_blocking(email: String, password: String) -> Result<GmailVerification, GmailError> {
    let started = Instant::now();
    let budget = Budget::new();

    // Google presents app passwords as "abcd efgh ijkl mnop" and users paste
    // the spaces. Not stripping them is the likeliest way to report a correct
    // password as a sign-in failure. No case folding, no other transformation.
    let password: String = password.chars().filter(|c| !c.is_whitespace()).collect();
    let email = email.trim().to_string();

    let (imap_capabilities, special_use) = verify_imap(&email, &password, &budget)?;

    if budget.expired() {
        return Err(GmailError::new(
            GmailErrorKind::Timeout,
            Stage::SmtpConnect,
            None,
        ));
    }

    let (smtp_port, smtp_starttls) = verify_smtp(&email, &password, &budget)?;

    Ok(GmailVerification {
        email,
        imap_capabilities,
        special_use,
        smtp_port,
        smtp_starttls,
        elapsed_ms: started.elapsed().as_millis() as u64,
    })
}

// --- IMAP --------------------------------------------------------------------

fn verify_imap(
    email: &str,
    password: &str,
    budget: &Budget,
) -> Result<(Vec<String>, HashMap<String, String>), GmailError> {
    // `imap::connect` uses a plain `TcpStream::connect` with no timeout, so we
    // build the stack by hand to get the connect and per-operation deadlines.
    let addr = (IMAP_HOST, IMAP_PORT)
        .to_socket_addrs()
        .map_err(|e| io_error(Stage::ImapConnect, &e))?
        .next()
        .ok_or_else(|| {
            GmailError::new(
                GmailErrorKind::NetworkBlocked,
                Stage::ImapConnect,
                Some(format!("no address found for {IMAP_HOST}")),
            )
        })?;

    let tcp = TcpStream::connect_timeout(&addr, budget.connect())
        .map_err(|e| io_error(Stage::ImapConnect, &e))?;
    let _ = tcp.set_read_timeout(Some(budget.op()));
    let _ = tcp.set_write_timeout(Some(budget.op()));

    // The default connector verifies the chain and the hostname against the
    // system trust store. There is deliberately no `danger_accept_invalid_*`
    // anywhere in this file — an invalid certificate is a hard failure.
    let connector = native_tls::TlsConnector::new().map_err(|e| {
        GmailError::new(
            GmailErrorKind::TlsInvalid,
            Stage::ImapTls,
            Some(e.to_string()),
        )
    })?;
    let tls = connector.connect(IMAP_HOST, tcp).map_err(|e| {
        GmailError::new(
            GmailErrorKind::TlsInvalid,
            Stage::ImapTls,
            Some(e.to_string()),
        )
    })?;

    let mut client = imap::Client::new(tls);
    // Off by default, but set explicitly: when true the crate echoes all
    // traffic — including the LOGIN line — to stderr.
    client.debug = false;
    // `imap::connect` consumes the greeting for you; `Client::new` does not.
    client
        .read_greeting()
        .map_err(|e| classify_imap(Stage::ImapConnect, &e))?;

    let mut session = client
        .login(email, password)
        .map_err(|(e, _client)| classify_imap(Stage::ImapLogin, &e))?;

    let imap_capabilities = read_capabilities(&mut session)?;

    // `Session::list` quotes the reference name but splices the pattern in
    // verbatim, so the pattern has to carry its own quotes or Gmail replies BAD.
    let names = match session.list(Some(""), Some("\"*\"")) {
        Ok(names) => names,
        Err(e) => {
            let _ = session.logout();
            let mut err = classify_imap(Stage::ImapList, &e);
            // Sign-in succeeded, so a rejected LIST means the mailbox itself is
            // unavailable — IMAP turned off in Gmail's settings.
            if matches!(
                err.kind,
                GmailErrorKind::Unexpected | GmailErrorKind::AuthFailed
            ) {
                err.kind = GmailErrorKind::ImapDisabled;
                err.message = headline(GmailErrorKind::ImapDisabled).to_string();
            }
            return Err(err);
        }
    };

    let mut special_use: HashMap<String, String> = HashMap::new();
    for name in names.iter() {
        for attr in name.attributes() {
            // Special-use flags arrive as `Custom("\\All")` — the crate's
            // `system()` only maps \Noinferiors, \Noselect, \Marked, \Unmarked.
            if let imap::types::NameAttribute::Custom(raw) = attr {
                let key = raw.trim_start_matches('\\').to_ascii_lowercase();
                if SPECIAL_USE_FLAGS.contains(&key.as_str()) {
                    special_use.insert(key, name.name().to_string());
                }
            }
        }
    }

    let name_count = names.len();
    drop(names);

    // The other shape of "IMAP is off": LOGIN and LIST both succeed but the
    // mailbox comes back empty or advertises no special-use folders.
    if name_count == 0 || special_use.is_empty() {
        let _ = session.logout();
        return Err(GmailError::new(
            GmailErrorKind::ImapDisabled,
            Stage::ImapList,
            Some(format!(
                "LIST returned {name_count} mailbox(es) and no special-use flags"
            )),
        ));
    }

    // Best effort — a failed LOGOUT invalidates nothing we just learned.
    let _ = session.logout();

    Ok((imap_capabilities, special_use))
}

/// Read `CAPABILITY` as raw atoms.
///
/// `Session::capabilities()` yields an `imap_proto` type that `imap` 2.4.1
/// doesn't re-export, and the raw atoms are exactly what the frontend caches.
fn read_capabilities<T: Read + Write>(
    session: &mut imap::Session<T>,
) -> Result<Vec<String>, GmailError> {
    let raw = session
        .run_command_and_read_response("CAPABILITY")
        .map_err(|e| classify_imap(Stage::ImapCapability, &e))?;
    let text = String::from_utf8_lossy(&raw);

    Ok(text
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            let rest = line.strip_prefix("* ")?;
            // The keyword's case isn't guaranteed by the RFC.
            let (word, tail) = rest.split_once(' ')?;
            word.eq_ignore_ascii_case("CAPABILITY").then_some(tail)
        })
        .flat_map(str::split_whitespace)
        .map(str::to_string)
        .collect())
}

fn classify_imap(stage: Stage, e: &imap::Error) -> GmailError {
    use imap::Error as E;

    match e {
        E::No(text) | E::Bad(text) => {
            let lower = text.to_ascii_lowercase();
            let kind = if lower.contains("authenticationfailed")
                || lower.contains("invalid credentials")
            {
                GmailErrorKind::AuthFailed
            } else if lower.contains("[unavailable]")
                || lower.contains("too many simultaneous connections")
                || lower.contains("[limit]")
                || lower.contains("try again")
            {
                GmailErrorKind::RateLimited
            } else if lower.contains("imap") && lower.contains("disabled") {
                GmailErrorKind::ImapDisabled
            } else {
                GmailErrorKind::Unexpected
            };
            GmailError::new(kind, stage, Some(text.clone()))
        }
        E::Io(io) => io_error(stage, io),
        // Both mean the chain or hostname didn't check out.
        E::Tls(t) => GmailError::new(GmailErrorKind::TlsInvalid, stage, Some(t.to_string())),
        E::TlsHandshake(t) => {
            GmailError::new(GmailErrorKind::TlsInvalid, stage, Some(t.to_string()))
        }
        E::ConnectionLost => GmailError::new(
            GmailErrorKind::NetworkBlocked,
            stage,
            Some("connection lost".to_string()),
        ),
        other => GmailError::new(GmailErrorKind::Unexpected, stage, Some(other.to_string())),
    }
}

fn io_error(stage: Stage, e: &std::io::Error) -> GmailError {
    let kind = match e.kind() {
        std::io::ErrorKind::TimedOut | std::io::ErrorKind::WouldBlock => GmailErrorKind::Timeout,
        _ => GmailErrorKind::NetworkBlocked,
    };
    GmailError::new(kind, stage, Some(e.to_string()))
}

// --- SMTP --------------------------------------------------------------------

/// Authenticate against Gmail's submission server and nothing more.
///
/// No `MAIL`/`RCPT`/`DATA` is ever issued — a probe message addressed to the
/// user's own mailbox is garbage in their inbox. lettre's message builder isn't
/// even compiled in (see `Cargo.toml`), so this is enforced, not just intended.
///
/// Returns `(port, used_starttls)`.
fn verify_smtp(email: &str, password: &str, budget: &Budget) -> Result<(u16, bool), GmailError> {
    let hello = ClientId::Domain(EHLO_NAME.to_string());
    let creds = Credentials::new(email.to_string(), password.to_string());
    let tls = TlsParameters::new(SMTP_HOST.to_string())
        .map_err(|e| classify_smtp(Stage::SmtpStarttls, &e))?;

    let attempt = || -> Result<(), GmailError> {
        let mut conn = SmtpConnection::connect(
            (SMTP_HOST, SMTP_PORT_STARTTLS),
            Some(budget.connect()),
            &hello,
            None,
            None,
        )
        .map_err(|e| classify_smtp(Stage::SmtpConnect, &e))?;
        // `connect` applies its timeout to reads and writes too; widen those to
        // the per-operation budget now that we're through.
        let _ = conn.set_timeout(Some(budget.op()));
        conn.starttls(&tls, &hello)
            .map_err(|e| classify_smtp(Stage::SmtpStarttls, &e))?;
        conn.auth(&[Mechanism::Plain], &creds)
            .map_err(|e| classify_smtp(Stage::SmtpAuth, &e))?;
        let _ = conn.quit();
        Ok(())
    };

    match attempt() {
        Ok(()) => Ok((SMTP_PORT_STARTTLS, true)),
        // Retry on 465 only when 587 never produced a usable connection. An
        // auth rejection or a TLS failure is a real answer; trying a second
        // port would just paper over it.
        Err(e)
            if matches!(e.stage, Stage::SmtpConnect)
                && matches!(
                    e.kind,
                    GmailErrorKind::Timeout | GmailErrorKind::NetworkBlocked
                ) =>
        {
            if budget.expired() {
                return Err(GmailError::new(
                    GmailErrorKind::Timeout,
                    Stage::SmtpConnect,
                    e.raw,
                ));
            }
            let mut conn = SmtpConnection::connect(
                (SMTP_HOST, SMTP_PORT_IMPLICIT),
                Some(budget.connect()),
                &hello,
                // Implicit TLS: the socket is wrapped before the banner.
                Some(&tls),
                None,
            )
            .map_err(|e| classify_smtp(Stage::SmtpConnect, &e))?;
            let _ = conn.set_timeout(Some(budget.op()));
            conn.auth(&[Mechanism::Plain], &creds)
                .map_err(|e| classify_smtp(Stage::SmtpAuth, &e))?;
            let _ = conn.quit();
            Ok((SMTP_PORT_IMPLICIT, false))
        }
        Err(e) => Err(e),
    }
}

fn classify_smtp(stage: Stage, e: &lettre::transport::smtp::Error) -> GmailError {
    // Display carries both the status code and the server's prose, e.g.
    // "permanent error (535): 5.7.8 Username and Password not accepted...".
    let raw = e.to_string();

    let kind = if e.is_timeout() {
        GmailErrorKind::Timeout
    } else if e.is_tls() {
        GmailErrorKind::TlsInvalid
    } else if e.is_transient() {
        // 421 "Too many login attempts", 454 "Temporary authentication failure".
        GmailErrorKind::RateLimited
    } else if e.is_permanent() {
        if raw.contains("535") {
            GmailErrorKind::SmtpAuthFailed
        } else {
            GmailErrorKind::Unexpected
        }
    } else {
        // Connection / network / client errors carry no status and aren't timeouts.
        GmailErrorKind::NetworkBlocked
    };

    GmailError::new(kind, stage, Some(raw))
}
