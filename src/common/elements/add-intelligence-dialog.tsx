import { useEffect, useState } from "react";
import Dialog from "./dialog";
import Button from "./button";
import Input from "./input";
import Loader from "./loader";
import { icons, type IconName } from "./icons";
import { testOpenRouterKey } from "../../lib/intelligence";

/**
 * "Add Intelligence" dialog.
 *
 * Steps in one window:
 *   1. Pick an LLM provider (a button per provider).
 *   2. Fill in that provider's required info — just an API key for now.
 *   3. A brief loader, then either a success confirmation or an error, both in
 *      the same window. For OpenRouter the loader runs a real connectivity test
 *      against the API; only a passing key gets handed to `onAdd` (and saved).
 *
 * On a successful connect it hands the provider + entered fields to `onAdd`;
 * the caller persists them.
 */

/** How long the loader shows before we run the connectivity test. */
const SAVE_DELAY_MS = 500;

/** Fallback loader icon for providers that ship no logo (e.g. OpenRouter). */
const GENERIC_PROVIDER_ICON: IconName = "brain";

function providerIcon(provider: IntelligenceProvider): IconName | undefined {
  return INTELLIGENCE_PROVIDERS.find((p) => p.id === provider)?.icon;
}

export type IntelligenceProvider = "claude" | "openai" | "openrouter";

export const INTELLIGENCE_PROVIDERS: {
  id: IntelligenceProvider;
  label: string;
  icon?: IconName;
}[] = [
  { id: "claude", label: "Claude", icon: "claude" },
  { id: "openai", label: "OpenAI", icon: "openai" },
  // No brand logo — the loader falls back to GENERIC_PROVIDER_ICON.
  { id: "openrouter", label: "OpenRouter" },
];

export function providerLabel(provider: string): string {
  return (
    INTELLIGENCE_PROVIDERS.find((p) => p.id === provider)?.label ?? provider
  );
}

interface AddIntelligenceDialogProps {
  open?: boolean;
  onClose?: () => void;
  /** Called with the chosen provider and API key once the user confirms. */
  onAdd?: (provider: IntelligenceProvider, apiKey: string) => void;
  /** Providers that already have a key saved — their picker button is disabled. */
  existingProviders?: IntelligenceProvider[];
}

function AddIntelligenceDialog({
  open = true,
  onClose,
  onAdd,
  existingProviders = [],
}: AddIntelligenceDialogProps) {
  const [provider, setProvider] = useState<IntelligenceProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  // "form" while picking/typing, "loading" during the connect/test, then
  // "success" or "error".
  const [phase, setPhase] = useState<"form" | "loading" | "success" | "error">(
    "form",
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Hold on the loader briefly, then run the connectivity test (OpenRouter
  // only — other providers keep the no-test behavior). The commit happens here
  // (not on the Connect click) so closing mid-loader cancels it: the cleanup
  // flips `cancelled`, so neither `onAdd` nor a phase change fires afterward.
  useEffect(() => {
    if (phase !== "loading" || !provider) return;
    let cancelled = false;
    const key = apiKey.trim();
    const id = setTimeout(async () => {
      try {
        if (provider === "openrouter") {
          await testOpenRouterKey(key);
        }
        if (cancelled) return;
        onAdd?.(provider, key);
        setPhase("success");
      } catch (e) {
        if (cancelled) return;
        setErrorMessage(String(e));
        setPhase("error");
      }
    }, SAVE_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [phase, provider, apiKey, onAdd]);

  // Reset to the picker and clear the form, then close.
  function close() {
    setProvider(null);
    setApiKey("");
    setErrorMessage("");
    setPhase("form");
    onClose?.();
  }

  const canSubmit = apiKey.trim() !== "";

  // Step 3a: saving — show the loader (not dismissible until it resolves).
  if (phase === "loading" && provider) {
    return (
      <Dialog
        open={open}
        title={`Connecting to ${providerLabel(provider)}…`}
        onClose={close}
        className="w-[28rem]"
      >
        <Loader
          leftIcon="computer"
          rightIcon={providerIcon(provider) ?? GENERIC_PROVIDER_ICON}
          className="w-full"
        />
      </Dialog>
    );
  }

  // Step 3b (failure): the connectivity test didn't pass — show the error and
  // let the user fix the key. Nothing was saved.
  if (phase === "error" && provider) {
    return (
      <Dialog
        open={open}
        title={`Couldn't reach ${providerLabel(provider)}`}
        icon={<icons.help size={20} />}
        onClose={close}
        className="w-[28rem]"
        footer={
          <>
            <Button previewState="focused" onClick={() => setPhase("form")}>
              Back
            </Button>
            <Button onClick={close}>Close</Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="m-0">
            We couldn't verify your {providerLabel(provider)} API key. It wasn't
            saved.
          </p>
          {errorMessage && (
            <p className="m-0 text-sm opacity-70 break-words">{errorMessage}</p>
          )}
        </div>
      </Dialog>
    );
  }

  // Step 3c: saved — confirm success in the same window.
  if (phase === "success" && provider) {
    return (
      <Dialog
        open={open}
        title={`Added ${providerLabel(provider)}`}
        onClose={close}
        className="w-[28rem]"
        footer={
          <Button previewState="focused" onClick={close}>
            Done
          </Button>
        }
      >
        <p className="m-0">
          Your {providerLabel(provider)} API key was saved successfully.
        </p>
      </Dialog>
    );
  }

  // Step 1: provider picker.
  if (provider === null) {
    return (
      <Dialog open={open} title="Add Intelligence" onClose={close}>
        <div className="flex flex-col gap-4">
          <p className="m-0">Choose a brain provider</p>
          <div className="flex flex-wrap gap-3">
            {INTELLIGENCE_PROVIDERS.map((p) => {
              const ProviderIcon = p.icon ? icons[p.icon] : null;
              const alreadyAdded = existingProviders.includes(p.id);
              return (
                <Button
                  key={p.id}
                  disabled={alreadyAdded}
                  onClick={() => setProvider(p.id)}
                >
                  {ProviderIcon && <ProviderIcon size={16} />}
                  {p.label}
                </Button>
              );
            })}
          </div>
        </div>
      </Dialog>
    );
  }

  // Step 2: provider info form (API key).
  return (
    <Dialog
      open={open}
      title={`Add Intelligence — ${providerLabel(provider)}`}
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
            Connect
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="m-0 text-sm opacity-70">
          Paste your {providerLabel(provider)} API key. It's stored locally on
          this device.
        </p>

        <label className="flex flex-col gap-1">
          <span className="font-bold">API key</span>
          <Input
            className="w-full"
            type="password"
            placeholder={
              provider === "claude"
                ? "sk-ant-…"
                : provider === "openrouter"
                  ? "sk-or-v1-…"
                  : "sk-…"
            }
            value={apiKey}
            onValueChange={setApiKey}
          />
        </label>
      </div>
    </Dialog>
  );
}

export default AddIntelligenceDialog;
export { AddIntelligenceDialog };
