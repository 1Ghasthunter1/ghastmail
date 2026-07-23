import clsx from "clsx";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Dialog from "../elements/dialog";
import Button from "../elements/button";
import Input from "../elements/input";
import Loader from "../elements/loader";
import Link from "../elements/link";
import googleMail from "../media/mailProviders/google-mail-beta.png";

/**
 * "Add Account" dialog.
 *
 * Steps in one window:
 *   1. Pick a mail provider (raised Win95 logo tiles).
 *   2. Fill in that provider's "bring your own credentials" form — the user
 *      supplies their own Google OAuth client *and* their mailbox login, so the
 *      app never ships shared secrets.
 *   3. A brief loader (mock timing for now), then a success confirmation in the
 *      same window.
 *
 * For now Google is the only provider, and this is UI only — `onAdd` fires on a
 * successful "connect" but nothing is persisted here.
 */

export type Provider = "google";

/** How long the loader shows before we "connect" (mock). */
const SAVE_DELAY_MS = 1500;

/** Everything the Gmail BYOC flow needs to connect an account. */
export interface GoogleCredentials {
  displayName: string;
  email: string;
  password: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

const DEFAULT_GOOGLE_CREDS: GoogleCredentials = {
  displayName: "",
  email: "",
  password: "",
  clientId: "",
  clientSecret: "",
  redirectUri: "http://localhost",
  scopes: "https://mail.google.com/",
};

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
  /** Called with the entered credentials when the user connects an account. */
  onAdd?: (provider: Provider, credentials: GoogleCredentials) => void;
}

function AddAccountDialog({
  open = true,
  onClose,
  onAdd,
}: AddAccountDialogProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [creds, setCreds] = useState<GoogleCredentials>(DEFAULT_GOOGLE_CREDS);
  // "form" while picking/typing, "loading" during the (mock) connect, then
  // "success".
  const [phase, setPhase] = useState<"form" | "loading" | "success">("form");

  // Hold on the loader briefly, then commit. The commit happens here (not on
  // the Save click) so closing mid-loader cancels it: the cleanup flips
  // `cancelled`, so neither `onAdd` nor a phase change fires afterward.
  useEffect(() => {
    if (phase !== "loading" || !provider) return;
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled) return;
      onAdd?.(provider, creds);
      setPhase("success");
    }, SAVE_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [phase, provider, creds, onAdd]);

  // Reset back to the picker and clear the form, then close.
  function close() {
    setProvider(null);
    setCreds(DEFAULT_GOOGLE_CREDS);
    setPhase("form");
    onClose?.();
  }

  function set<K extends keyof GoogleCredentials>(key: K) {
    return (value: string) => setCreds((c) => ({ ...c, [key]: value }));
  }

  const canSubmit =
    creds.email.trim() !== "" &&
    creds.password.trim() !== "" &&
    creds.clientId.trim() !== "" &&
    creds.clientSecret.trim() !== "";

  // Step 3a: connecting — show the loader (not dismissible until it resolves).
  if (phase === "loading") {
    return (
      <Dialog
        open={open}
        title="Connecting to Google…"
        onClose={close}
        className="w-[28rem]"
      >
        <Loader
          leftIcon="computer"
          rightIcon="folder-mail"
          className="w-full"
        />
      </Dialog>
    );
  }

  // Step 3b: connected — confirm success in the same window.
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
            {creds.email.trim() || "Your Google account"} was connected
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

  // Step 2: Gmail bring-your-own-credentials form (login + OAuth client).
  return (
    <Dialog
      open={open}
      title="Add Account — Google"
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
      <div className="flex flex-col gap-4">
        {/* Mailbox login. */}
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm font-bold opacity-70">Mailbox</p>

          <Field label="Display name" hint="Shown in your account list.">
            <Input
              className="w-full"
              placeholder="Work Gmail"
              value={creds.displayName}
              onValueChange={set("displayName")}
            />
          </Field>

          <Field label="Email address">
            <Input
              className="w-full"
              type="email"
              placeholder="you@gmail.com"
              value={creds.email}
              onValueChange={set("email")}
            />
          </Field>

          <Field label="Password" hint="App password for your mailbox.">
            <Input
              className="w-full"
              type="password"
              value={creds.password}
              onValueChange={set("password")}
            />
          </Field>
        </div>

        {/* OAuth client (bring your own). */}
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm font-bold opacity-70">Google OAuth</p>
          <p className="m-0 text-sm opacity-70">
            Follow the directions <Link>here</Link> to obtain these creds
            smoothly
          </p>

          <Field label="OAuth client ID">
            <Input
              className="w-full"
              placeholder="…apps.googleusercontent.com"
              value={creds.clientId}
              onValueChange={set("clientId")}
            />
          </Field>

          <Field label="OAuth client secret">
            <Input
              className="w-full"
              type="password"
              value={creds.clientSecret}
              onValueChange={set("clientSecret")}
            />
          </Field>

          <Field
            label="Redirect URI"
            hint="Must match an authorized redirect URI on your OAuth client."
          >
            <Input
              className="w-full"
              value={creds.redirectUri}
              onValueChange={set("redirectUri")}
            />
          </Field>

          <Field label="Scopes" hint="Space-separated OAuth scopes to request.">
            <Input
              className="w-full"
              value={creds.scopes}
              onValueChange={set("scopes")}
            />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

export default AddAccountDialog;
export { AddAccountDialog };
