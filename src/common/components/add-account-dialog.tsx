import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Dialog from "../elements/dialog";
import Button from "../elements/button";
import Input from "../elements/input";
import Loader from "../elements/loader";
import Link from "../elements/link";
import { icons } from "../elements/icons";
import { APP_PASSWORD_URL, gmailErrorCopy, isGmailError } from "../../lib/gmail";
import googleMail from "../media/mailProviders/google-mail-beta.png";

/**
 * "Add Account" dialog.
 *
 * Steps in one window:
 *   1. Pick a mail provider (raised Win95 logo tiles).
 *   2. Fill in the account's details — for Gmail that's a display name, the
 *      address, and an app password. Nothing else: Gmail's IMAP and SMTP
 *      endpoints are constants, so there's no server-settings surface.
 *   3. A loader while `onSave` verifies the credentials against Gmail and
 *      persists the account, then either a diagnosis of what went wrong or a
 *      success confirmation, in the same window.
 *
 * Google is the only provider, so the picker is a formality — but it's the seam
 * where a second one lands, and it costs one click.
 */

export type Provider = "google";

/** A beat on the loader before the real work starts, so it isn't a flash. */
const SAVE_DELAY_MS = 500;

/** What the Gmail form collects. */
export interface GmailAccountForm {
  displayName: string;
  email: string;
  password: string;
}

const EMPTY_FORM: GmailAccountForm = {
  displayName: "",
  email: "",
  password: "",
};

/** Shape check only — Workspace accounts on custom domains are valid too. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

interface ProviderTileProps {
  src: string;
  alt: string;
  onClick?: () => void;
}

/** A pickable provider logo — raised bevel that sinks while pressed. */
function ProviderTile({ src, alt, onClick }: ProviderTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "bevel-raised flex items-center justify-center bg-silver p-3",
        "cursor-pointer border-0 select-none",
        "active:bevel-sunken active:translate-x-px active:translate-y-px",
        "hover:brightness-105",
      )}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-12 w-auto"
        style={{ imageRendering: "pixelated" }}
      />
    </button>
  );
}

/** A labeled field row for the credentials form. */
function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-bold">{label}</span>
      {children}
      {hint && <span className="text-sm opacity-70">{hint}</span>}
    </label>
  );
}

interface AddAccountDialogProps {
  open?: boolean;
  onClose?: () => void;
  /**
   * Verify and persist the account. Rejecting routes the dialog to its error
   * screen with the typed input intact; resolving shows the success screen.
   */
  onSave?: (provider: Provider, form: GmailAccountForm) => Promise<unknown>;
}

function AddAccountDialog({
  open = true,
  onClose,
  onSave,
}: AddAccountDialogProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [form, setForm] = useState<GmailAccountForm>(EMPTY_FORM);
  const [revealPassword, setRevealPassword] = useState(false);
  // "form" while picking/typing, "loading" while connecting, then "error" or
  // "success".
  const [phase, setPhase] = useState<"form" | "loading" | "error" | "success">(
    "form",
  );
  const [error, setError] = useState<unknown>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Latest `onSave`/`form` without making them effect dependencies.
  //
  // Callers pass an inline arrow (`onSave={(p, f) => mutateAsync(f)}`), so its
  // identity changes on every parent render — and calling it *causes* a parent
  // render, because the mutation flips to pending. Depending on it would tear
  // down and re-arm the timer mid-save, firing the save again every
  // SAVE_DELAY_MS until the first one resolved. A 15-second verification
  // produced 15 duplicate accounts that way.
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const formRef = useRef(form);
  formRef.current = form;

  // Hold on the loader a beat, then verify + save. The work happens here (not
  // on the Save click) so closing mid-loader cancels the UI transition: the
  // cleanup flips `cancelled`, so no phase change fires afterward.
  //
  // Depends only on the phase transition, so it runs exactly once per entry
  // into "loading".
  useEffect(() => {
    if (phase !== "loading" || !provider) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        await onSaveRef.current?.(provider, formRef.current);
        if (cancelled) return;
        setPhase("success");
      } catch (e) {
        if (cancelled) return;
        setError(e);
        setShowDetails(false);
        setPhase("error");
      }
    }, SAVE_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [phase, provider]);

  // Reset back to the picker and clear the form, then close.
  function close() {
    setProvider(null);
    setForm(EMPTY_FORM);
    setRevealPassword(false);
    setError(null);
    setPhase("form");
    onClose?.();
  }

  function set<K extends keyof GmailAccountForm>(key: K) {
    return (value: string) => setForm((f) => ({ ...f, [key]: value }));
  }

  const canSubmit = looksLikeEmail(form.email) && form.password.trim() !== "";

  // Step 3a: connecting — show the loader (not dismissible until it resolves).
  if (phase === "loading") {
    return (
      <Dialog
        open={open}
        title="Connecting to Gmail…"
        onClose={close}
        className="w-[28rem]"
      >
        <Loader leftIcon="computer" rightIcon="folder-mail" className="w-full" />
      </Dialog>
    );
  }

  // Step 3b (failure): diagnose it. Nothing was saved, and the typed input is
  // kept — going Back lands on a filled-in form.
  if (phase === "error") {
    const WarningIcon = icons["warning-exclamation"];
    const copy = gmailErrorCopy(error);
    const raw = isGmailError(error)
      ? (error.raw ?? error.message)
      : error instanceof Error
        ? error.message
        : String(error);

    return (
      <Dialog
        open={open}
        title={copy.title}
        onClose={close}
        className="w-[28rem]"
        footer={
          <>
            {copy.retryable && (
              <Button previewState="focused" onClick={() => setPhase("loading")}>
                Retry
              </Button>
            )}
            <Button
              previewState={copy.retryable ? undefined : "focused"}
              onClick={() => setPhase("form")}
            >
              Back
            </Button>
            <Button onClick={close}>Close</Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <span className="shrink-0">
            <WarningIcon size={32} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="m-0">{copy.headline}</p>
            {copy.secondary && (
              <p className="m-0 text-sm opacity-70">{copy.secondary}</p>
            )}
            {copy.helpUrl && (
              <p className="m-0 text-sm">
                <Link href={copy.helpUrl}>→ {copy.helpLabel}</Link>
              </p>
            )}

            {/* Power users and bug reports both need the unedited response. */}
            {raw && (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setShowDetails((s) => !s)}
                  className="cursor-pointer border-0 bg-transparent p-0 text-sm underline opacity-70"
                >
                  {showDetails ? "Hide details" : "Details"}
                </button>
                {showDetails && (
                  <pre className="bevel-field mt-1 max-h-24 overflow-auto bg-white p-1 text-sm break-words whitespace-pre-wrap">
                    {raw}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </Dialog>
    );
  }

  // Step 3c: connected — confirm success in the same window.
  if (phase === "success") {
    return (
      <Dialog
        open={open}
        title="Account connected"
        onClose={close}
        className="w-[28rem]"
        footer={
          <Button previewState="focused" onClick={close}>
            Done
          </Button>
        }
      >
        <div className="flex items-start gap-4">
          <span className="shrink-0">
            <img
              src={googleMail}
              alt="Google Mail"
              draggable={false}
              className="h-8 w-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </span>
          <p className="m-0">
            {form.email.trim() || "Your Google account"} was connected
            successfully.
          </p>
        </div>
      </Dialog>
    );
  }

  // Step 1: provider picker.
  if (provider === null) {
    return (
      <Dialog open={open} title="Add Account" onClose={close}>
        <div className="flex flex-col gap-4">
          <p className="m-0">Choose a mail provider to connect:</p>
          <div className="flex flex-wrap gap-3">
            <ProviderTile
              src={googleMail}
              alt="Google Mail"
              onClick={() => setProvider("google")}
            />
          </div>
        </div>
      </Dialog>
    );
  }

  // Step 2: the Gmail form. Three fields — the servers are constants.
  return (
    <Dialog
      open={open}
      title="Add Gmail Account"
      onClose={close}
      className="w-[28rem]"
      footer={
        <>
          <Button onClick={() => setProvider(null)}>Back</Button>
          <Button
            disabled={!canSubmit}
            previewState={canSubmit ? "focused" : undefined}
            onClick={() => setPhase("loading")}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Display name" hint="Shown in your account list.">
          <Input
            className="w-full"
            placeholder={form.email.trim() || "Work Gmail"}
            value={form.displayName}
            onValueChange={set("displayName")}
          />
        </Field>

        <Field label="Email address">
          <Input
            className="w-full"
            type="email"
            placeholder="you@gmail.com"
            value={form.email}
            onValueChange={set("email")}
          />
        </Field>

        <Field label="App password">
          <div className="flex items-stretch gap-1">
            <Input
              containerClassName="min-w-0 flex-1"
              className="w-full"
              type={revealPassword ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={form.password}
              // Google shows app passwords as "abcd efgh ijkl mnop" and people
              // paste the spaces. Strip them here so the field visibly
              // normalizes instead of failing sign-in later. No length check —
              // Google could change the format.
              onValueChange={(v) => set("password")(v.replace(/\s+/g, ""))}
            />
            <Button
              type="button"
              aria-label={revealPassword ? "Hide password" : "Show password"}
              previewState={revealPassword ? "pressed" : undefined}
              onClick={() => setRevealPassword((r) => !r)}
            >
              {revealPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </Field>

        {/* The 2-Step Verification line is load-bearing: without 2SV Google's
            app-password page 404s, and a 404 reads as "this doesn't exist". */}
        <div className="flex flex-col gap-1 text-sm opacity-70">
          <p className="m-0">
            Gmail requires an app password — your normal Google password will not
            work.
          </p>
          <p className="m-0">
            <Link href={APP_PASSWORD_URL}>→ Create an app password</Link>
          </p>
          <p className="m-0">Needs 2-Step Verification enabled first.</p>
        </div>
      </div>
    </Dialog>
  );
}

export default AddAccountDialog;
export { AddAccountDialog };
