import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  setKeychainKey,
  checkKeychainKeySet,
  deleteKeychainKey,
} from "../../lib/keychain";
import { icons } from "../elements/icons";
import Button from "../elements/button";
import Divider from "../elements/divider";
import Alert from "../elements/alert";
import AddIntelligenceDialog, {
  INTELLIGENCE_PROVIDERS,
  providerLabel,
  type IntelligenceProvider,
} from "./add-intelligence-dialog";

// --- keychain access (TanStack Query — the app default) ----------------------
//
// API keys live in the OS keychain, not the SQLite db (see
// `src/lib/keychain.ts`). We never pull the values into the UI — we only ask
// whether each provider has a key stored, save one, or remove one.

/** Keychain entry name for a provider's API key. */
function providerKeychainKey(provider: IntelligenceProvider): string {
  return `intelligence:${provider}`;
}

const intelligenceKeys = {
  presence: ["intelligence", "keychain", "presence"] as const,
};

/** Map of provider → whether a key is stored for it. */
function useIntelligencePresence() {
  return useQuery({
    queryKey: intelligenceKeys.presence,
    queryFn: async () => {
      const entries = await Promise.all(
        INTELLIGENCE_PROVIDERS.map(
          async (p) =>
            [
              p.id,
              await checkKeychainKeySet(providerKeychainKey(p.id)),
            ] as const,
        ),
      );
      return Object.fromEntries(entries) as Record<
        IntelligenceProvider,
        boolean
      >;
    },
  });
}

function useSaveIntelligenceKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      provider,
      apiKey,
    }: {
      provider: IntelligenceProvider;
      apiKey: string;
    }) => setKeychainKey(providerKeychainKey(provider), apiKey),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: intelligenceKeys.presence }),
  });
}

function useDeleteIntelligenceKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: IntelligenceProvider) =>
      deleteKeychainKey(providerKeychainKey(provider)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: intelligenceKeys.presence }),
  });
}

// --- panel -------------------------------------------------------------------

const BrainIcon = icons["brain"];

/** Settings panel for managing saved LLM credentials ("Intelligence"). */
function IntelligenceSettings() {
  const [addOpen, setAddOpen] = useState(false);
  // Provider pending a remove confirmation, or null when no alert is shown.
  const [pendingRemove, setPendingRemove] =
    useState<IntelligenceProvider | null>(null);

  const { data: presence } = useIntelligencePresence();
  const saveMutation = useSaveIntelligenceKey();
  const deleteMutation = useDeleteIntelligenceKey();

  const handleAdd = (provider: IntelligenceProvider, apiKey: string) => {
    // Kick off the keychain write; the dialog runs its own loader/success
    // sequence and closes itself when the user clicks Done.
    saveMutation.mutate({ provider, apiKey });
  };

  const confirmRemove = () => {
    if (pendingRemove) deleteMutation.mutate(pendingRemove);
    setPendingRemove(null);
  };

  // Only providers that actually have a key stored get a row.
  const present = INTELLIGENCE_PROVIDERS.filter((p) => presence?.[p.id]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Title + add action. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BrainIcon size={24} />
          <h2 className="m-0 text-xl font-bold">Intelligence</h2>
        </div>
        <Button onClick={() => setAddOpen(true)}>Add Intelligence</Button>
      </div>

      <Divider className="my-3" />

      {/* Saved keys — one row per provider that has a key stored. */}
      {present.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-w95-gray">
          <p className="m-0">No intelligence added yet.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {present.map((p) => {
            const ProviderIcon = p.icon ? icons[p.icon] : null;
            return (
              <div
                key={p.id}
                className="bevel-field flex items-center gap-3 bg-white px-3 py-2"
              >
                {ProviderIcon && <ProviderIcon size={16} />}
                <span className="font-bold">{providerLabel(p.id)}</span>

                <div className="flex-1" />
                <Button onClick={() => setPendingRemove(p.id)}>Remove</Button>
              </div>
            );
          })}
        </div>
      )}

      <AddIntelligenceDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        existingProviders={present.map((p) => p.id)}
      />

      {/* Confirm before wiping a key out of the keychain. */}
      <Alert
        open={pendingRemove !== null}
        title="Confirm Delete Intelligence"
        icon="trash"
        onClose={() => setPendingRemove(null)}
        actions={[
          { label: "Yes", primary: true, onClick: confirmRemove },
          { label: "No", onClick: () => setPendingRemove(null) },
        ]}
      >
        {pendingRemove && (
          <>
            Remove the {providerLabel(pendingRemove)} API key from this device?
            You'll need to paste it again to re-enable it.
          </>
        )}
      </Alert>
    </div>
  );
}

export default IntelligenceSettings;
export { IntelligenceSettings };
