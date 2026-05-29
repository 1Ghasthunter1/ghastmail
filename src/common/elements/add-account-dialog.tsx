import { useState } from "react";
import type { ReactNode } from "react";
import Dialog from "./dialog";
import Button from "./button";
import Input from "./input";
import googleMail from "../media/mailProviders/google-mail-beta.png";

/**
 * "Add Account" dialog.
 *
 * Two steps in one window:
 *   1. Pick a mail provider (raised Win95 logo tiles).
 *   2. Fill in that provider's "bring your own credentials" form — the user
 *      supplies their own OAuth client so the app never ships shared secrets.
 *
 * For now Google is the only provider.
 */

const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export type Provider = "google";

/** Everything the Gmail BYOC flow needs to connect an account. */
export interface GoogleCredentials {
  displayName: string;
  email: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

const DEFAULT_GOOGLE_CREDS: GoogleCredentials = {
  displayName: "",
  email: "",
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
      className={cn(
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

function AddAccountDialog({ open = true, onClose, onAdd }: AddAccountDialogProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [creds, setCreds] = useState<GoogleCredentials>(DEFAULT_GOOGLE_CREDS);

  // Reset back to the picker and clear the form, then close.
  function close() {
    setProvider(null);
    setCreds(DEFAULT_GOOGLE_CREDS);
    onClose?.();
  }

  function set<K extends keyof GoogleCredentials>(key: K) {
    return (value: string) => setCreds((c) => ({ ...c, [key]: value }));
  }

  const canSubmit =
    creds.email.trim() !== "" &&
    creds.clientId.trim() !== "" &&
    creds.clientSecret.trim() !== "";

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

  // Step 2: Gmail bring-your-own-credentials form.
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
            onClick={() => {
              onAdd?.("google", creds);
              close();
            }}
          >
            Connect
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="m-0 text-sm opacity-70">
          Bring your own credentials: create an OAuth client in the Google Cloud
          Console and paste its details below.
        </p>

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
    </Dialog>
  );
}

export default AddAccountDialog;
export { AddAccountDialog };
