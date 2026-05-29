import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAccounts,
  createAccount,
  type Account,
  type CreateAccountInput,
} from "../lib/db";
import Button from "../common/elements/button";
import AccountSelect, { accountLabel } from "../common/elements/account-select";
import AddAccountDialog from "../common/elements/add-account-dialog";
import { NavBar, NavItem } from "../common/elements/navbar";
import { icons, type IconName } from "../common/elements/icons";

// --- data layer (TanStack Query — the app default) --------------------------

const accountKeys = {
  all: ["accounts"] as const,
};

function useAccounts() {
  return useQuery({ queryKey: accountKeys.all, queryFn: listAccounts });
}

function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccount(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

// --- mail client chrome ------------------------------------------------------

const FOLDERS: { label: string; icon: IconName }[] = [
  { label: "Inbox", icon: "folder-mail" },
  { label: "Drafts", icon: "compose" },
  { label: "Sent", icon: "folder" },
  { label: "Trash", icon: "trash" },
];

/** The actual mail UI, shown once at least one account exists. */
function MailClient({
  accounts,
  onAddAccount,
}: {
  accounts: Account[];
  onAddAccount: () => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [folder, setFolder] = useState("Inbox");

  // Fall back to the first account until the user picks one (and after the
  // selected one is removed).
  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0];

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar: account picker top-left, actions on the right. */}
      <div className="flex items-center gap-2 bg-silver px-2 py-1">
        <AccountSelect
          accounts={accounts}
          value={selected.id}
          onChange={setSelectedId}
        />
        <div className="flex-1" />
        <Button onClick={() => {}}>Compose</Button>
        <Button onClick={onAddAccount}>Add Account</Button>
      </div>

      {/* Body: folder sidebar + message pane. */}
      <div className="flex min-h-0 flex-1 gap-1 p-1">
        <NavBar orientation="vertical" className="w-40 shrink-0 gap-px p-1">
          {FOLDERS.map(({ label, icon }) => {
            const FolderIcon = icons[icon];
            return (
              <NavItem
                key={label}
                icon={<FolderIcon size={16} />}
                label={label}
                selected={folder === label}
                onClick={() => setFolder(label)}
                className="justify-start"
              />
            );
          })}
        </NavBar>

        <div className="bevel-field flex min-w-0 flex-1 flex-col bg-white">
          {/* Pane header: which folder / account you're looking at. */}
          <div className="flex items-baseline justify-between gap-2 border-b border-w95-gray bg-silver px-2 py-1">
            <span className="font-bold">{folder}</span>
            <span className="truncate text-sm text-w95-gray">
              {accountLabel(selected)} &lt;{selected.email}&gt;
            </span>
          </div>

          {/* No message store yet — empty folder placeholder. */}
          <div className="flex flex-1 items-center justify-center p-6 text-center text-w95-gray">
            <p className="m-0">No messages in {folder}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- empty state -------------------------------------------------------------

/** Shown when there are no accounts yet. */
function EmptyState({ onAddAccount }: { onAddAccount: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="m-0 text-3xl font-normal">GhastMailer</h1>
      <p className="m-0 opacity-70">No accounts added yet.</p>
      <Button className="mt-2" onClick={onAddAccount}>
        Add Account
      </Button>
    </div>
  );
}

// --- page --------------------------------------------------------------------

function Home() {
  const [addOpen, setAddOpen] = useState(false);
  const { data: accounts, isPending } = useAccounts();
  const createAccountMutation = useCreateAccount();

  // Brief boot flash while the db connection opens / migrations run.
  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center text-w95-gray">
        Loading…
      </div>
    );
  }

  const hasAccounts = !!accounts && accounts.length > 0;

  return (
    <>
      {hasAccounts ? (
        <MailClient accounts={accounts} onAddAccount={() => setAddOpen(true)} />
      ) : (
        <EmptyState onAddAccount={() => setAddOpen(true)} />
      )}

      <AddAccountDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(provider, credentials) => {
          createAccountMutation.mutate({ provider, ...credentials });
          setAddOpen(false);
        }}
      />
    </>
  );
}

export default Home;
