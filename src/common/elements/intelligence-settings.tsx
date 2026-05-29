import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listIntelligences,
  createIntelligence,
  deleteIntelligence,
  type CreateIntelligenceInput,
} from "../../lib/db";
import { icons } from "./icons";
import Button from "./button";
import Divider from "./divider";
import AddIntelligenceDialog, {
  providerLabel,
  type IntelligenceProvider,
} from "./add-intelligence-dialog";

// --- data layer (TanStack Query — the app default) --------------------------

const intelligenceKeys = {
  all: ["intelligences"] as const,
};

function useIntelligences() {
  return useQuery({
    queryKey: intelligenceKeys.all,
    queryFn: listIntelligences,
  });
}

function useCreateIntelligence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIntelligenceInput) => createIntelligence(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: intelligenceKeys.all }),
  });
}

function useDeleteIntelligence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteIntelligence(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: intelligenceKeys.all }),
  });
}

// --- panel -------------------------------------------------------------------

const BrainIcon = icons["brain"];

/** Show only the last few characters of a stored key. */
function maskKey(key: string): string {
  const tail = key.slice(-4);
  return `••••••••${tail}`;
}

/** Settings panel for managing saved LLM credentials ("Intelligence"). */
function IntelligenceSettings() {
  const [addOpen, setAddOpen] = useState(false);
  const { data: intelligences } = useIntelligences();
  const createMutation = useCreateIntelligence();
  const deleteMutation = useDeleteIntelligence();

  const handleAdd = (provider: IntelligenceProvider, apiKey: string) => {
    createMutation.mutate({ provider, apiKey });
    setAddOpen(false);
  };

  const items = intelligences ?? [];

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

      {/* Saved credentials. */}
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-w95-gray">
          <p className="m-0">No intelligence added yet.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="bevel-field flex items-center gap-3 bg-white px-3 py-2"
            >
              <span className="font-bold">{providerLabel(item.provider)}</span>
              <span className="truncate text-sm text-w95-gray">
                {maskKey(item.apiKey)}
              </span>
              <div className="flex-1" />
              <Button onClick={() => deleteMutation.mutate(item.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddIntelligenceDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}

export default IntelligenceSettings;
export { IntelligenceSettings };
