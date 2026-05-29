import { useEffect, useState } from "react";
import Dialog from "./dialog";
import Button from "./button";
import Input from "./input";
import Loader from "./loader";
import { icons, type IconName } from "./icons";

/**
 * "Add Intelligence" dialog.
 *
 * Steps in one window:
 *   1. Pick an LLM provider (a button per provider).
 *   2. Fill in that provider's required info — just an API key for now.
 *   3. A brief loader, then a success confirmation, both in the same window.
 *
 * On confirm it hands the provider + entered fields to `onAdd`; the caller
 * persists them.
 */

/** How long the loader shows before flipping to the success message. */
const SAVE_DELAY_MS = 100000; // TODO: drop back to 2000 — bumped for debugging.

function providerIcon(provider: IntelligenceProvider): IconName | undefined {
  return INTELLIGENCE_PROVIDERS.find((p) => p.id === provider)?.icon;
}

export type IntelligenceProvider = "claude" | "openai";

export const INTELLIGENCE_PROVIDERS: {
  id: IntelligenceProvider;
  label: string;
  icon?: IconName;
}[] = [
  { id: "claude", label: "Claude", icon: "claude" },
  { id: "openai", label: "OpenAI", icon: "openai" },
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
  // "form" while picking/typing, "loading" during the fake save, then "success".
  const [phase, setPhase] = useState<"form" | "loading" | "success">("form");

  // Hold on the loader for a beat, then commit the save and reveal success.
  // The commit happens here (not on the Save click) so closing mid-loader
  // cancels it — the cleanup clears the timer and `onAdd` never fires.
  useEffect(() => {
    if (phase !== "loading" || !provider) return;
    const id = setTimeout(() => {
      onAdd?.(provider, apiKey.trim());
      setPhase("success");
    }, SAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [phase, provider, apiKey, onAdd]);

  // Reset to the picker and clear the form, then close.
  function close() {
    setProvider(null);
    setApiKey("");
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
          rightIcon={providerIcon(provider)}
          className="w-full"
        />
      </Dialog>
    );
  }

  // Step 3b: saved — confirm success in the same window.
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
            Save
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
            placeholder={provider === "claude" ? "sk-ant-…" : "sk-…"}
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
