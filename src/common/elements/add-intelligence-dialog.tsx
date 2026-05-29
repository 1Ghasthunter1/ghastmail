import { useState } from "react";
import Dialog from "./dialog";
import Button from "./button";
import Input from "./input";
import { icons, type IconName } from "./icons";

/**
 * "Add Intelligence" dialog.
 *
 * Two steps in one window:
 *   1. Pick an LLM provider (a button per provider).
 *   2. Fill in that provider's required info — just an API key for now.
 *
 * On confirm it hands the provider + entered fields to `onAdd`; the caller
 * persists them.
 */

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
}

function AddIntelligenceDialog({
  open = true,
  onClose,
  onAdd,
}: AddIntelligenceDialogProps) {
  const [provider, setProvider] = useState<IntelligenceProvider | null>(null);
  const [apiKey, setApiKey] = useState("");

  // Reset to the picker and clear the form, then close.
  function close() {
    setProvider(null);
    setApiKey("");
    onClose?.();
  }

  const canSubmit = apiKey.trim() !== "";

  // Step 1: provider picker.
  if (provider === null) {
    return (
      <Dialog open={open} title="Add Intelligence" onClose={close}>
        <div className="flex flex-col gap-4">
          <p className="m-0">Choose a brain provider</p>
          <div className="flex flex-wrap gap-3">
            {INTELLIGENCE_PROVIDERS.map((p) => {
              const ProviderIcon = p.icon ? icons[p.icon] : null;
              return (
                <Button key={p.id} onClick={() => setProvider(p.id)}>
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
            onClick={() => {
              onAdd?.(provider, apiKey.trim());
              close();
            }}
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
