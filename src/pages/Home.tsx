import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAccounts,
  createAccount,
  type Account,
  type CreateAccountInput,
} from "../lib/db";
import Button from "../common/elements/button";
import AccountSelect, {
  accountLabel,
  ALL_ACCOUNTS,
  type AccountSelection,
} from "../common/components/account-select";
import AddAccountDialog from "../common/components/add-account-dialog";
import Dialog from "../common/elements/dialog";
import Divider from "../common/elements/divider";
import IntelligenceSettings from "../common/components/intelligence-settings";
import AccountsSettings from "../common/components/accounts-settings";
import { ComposeWindow, ComposeDock } from "../common/components/compose";
import Inbox from "../common/layouts/inbox";
import { buildDraft, type Draft } from "../lib/mail";
import { NavBar, NavItem } from "../common/elements/navbar";
import Kbd from "../common/elements/kbd";
import { useKeybind } from "../lib/keybind";
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

/** Gmail caps docked drafts; we mirror that with two. */
const MAX_COMPOSE = 2;

const FOLDERS: { label: string; icon: IconName }[] = [
  { label: "Inbox", icon: "folder-mail" },
  { label: "Drafts", icon: "compose" },
  { label: "Sent", icon: "folder" },
  { label: "Trash", icon: "trash" },
];

const SettingsIcon = icons["settings-gears"];

const SETTINGS_SECTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "general", label: "General", icon: "display" },
  { id: "intelligence", label: "Intelligence", icon: "brain" },
  { id: "accounts", label: "Accounts", icon: "folder-mail" },
];

/** The actual mail UI, shown once at least one account exists. */
function MailClient({
  accounts,
  onAddAccount,
}: {
  accounts: Account[];
  onAddAccount: () => void;
}) {
  const [selection, setSelection] = useState<AccountSelection>(ALL_ACCOUNTS);
  const [folder, setFolder] = useState("Inbox");
  const [inboxUnread, setInboxUnread] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("general");

  // Up/down move the folder selection, clamped at the ends.
  const moveFolder = (delta: number) =>
    setFolder((current) => {
      const idx = FOLDERS.findIndex((f) => f.label === current);
      const next = Math.min(Math.max(idx + delta, 0), FOLDERS.length - 1);
      return FOLDERS[next].label;
    });
  useKeybind("up", () => moveFolder(-1));
  useKeybind("down", () => moveFolder(1));

  // Open compose drafts, oldest first. Capped at two, Gmail-style. Each gets a
  // stable id so its draft state survives re-renders / siblings closing.
  // `draft` is the reply/forward prefill, absent for a blank compose.
  const [composes, setComposes] = useState<{ id: number; draft?: Draft }[]>([]);
  const nextComposeId = useRef(0);
  const openCompose = (draft?: Draft) =>
    setComposes((list) =>
      list.length >= MAX_COMPOSE
        ? list
        : [...list, { id: nextComposeId.current++, draft }],
    );
  const closeCompose = (id: number) =>
    setComposes((list) => list.filter((c) => c.id !== id));

  const isAll = selection === ALL_ACCOUNTS;
  // The single account in focus. In the merged "All accounts" view there is no
  // one account, so actions that need a concrete sender (compose) fall back to
  // the first account.
  const activeAccount = isAll
    ? null
    : (accounts.find((a) => a.id === selection) ?? accounts[0]);
  const composeFrom = (activeAccount ?? accounts[0]).email;

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar: account picker top-left, actions on the right. */}
      <div className="flex items-center gap-2 bg-silver px-2 py-1">
        <AccountSelect
          accounts={accounts}
          value={selection}
          onChange={setSelection}
          allOption
        />
        <div className="flex-1" />
        <Button
          keybind="c"
          // Wrapped: a bare reference would pass the click event as the draft.
          onClick={() => openCompose()}
          disabled={composes.length >= MAX_COMPOSE}
        >
          Compose
        </Button>
      </div>

      {/* Body: folder sidebar + message pane. */}
      <div className="flex min-h-0 flex-1 gap-1 p-1">
        <div className="flex w-40 shrink-0 flex-col">
          <NavBar orientation="vertical" className="gap-px p-1">
            {FOLDERS.map(({ label, icon }) => {
              const FolderIcon = icons[icon];
              const unread = label === "Inbox" ? inboxUnread : 0;
              return (
                <NavItem
                  key={label}
                  icon={<FolderIcon size={16} />}
                  label={
                    <span className="flex w-full items-center gap-2">
                      <span className="truncate">{label}</span>
                      {unread > 0 && (
                        <span className="ml-auto shrink-0 font-bold">
                          ({unread})
                        </span>
                      )}
                    </span>
                  }
                  selected={folder === label}
                  onClick={() => setFolder(label)}
                  className="justify-start"
                />
              );
            })}
          </NavBar>

          {/* Keyboard hint: ↑/↓ move between folders. */}
          <div className="flex items-center justify-center gap-1 px-1 py-2 text-sm text-w95-gray">
            <Kbd keybind="up" />
            <span>/</span>
            <Kbd keybind="down" />
            <span className="ml-1">Navigate</span>
          </div>

          {/* Settings, pinned to the bottom of the sidebar. */}
          <NavBar orientation="vertical" className="mt-auto p-1">
            <NavItem
              icon={<SettingsIcon size={16} />}
              label="Settings"
              selected={settingsOpen}
              onClick={() => setSettingsOpen(true)}
              className="justify-start"
            />
          </NavBar>
        </div>

        {/* `bevel-field` is a 2px inset shadow ring. Inset shadows paint under
            child elements, so the p-0.5 (2px) keeps full-bleed content — the
            silver header, the message rows — from covering the bevel. */}
        <div className="bevel-field flex min-w-0 flex-1 flex-col bg-white p-0.5">
          {/* Pane header: which folder / account you're looking at. */}
          <div className="flex items-baseline justify-between gap-2 border-b border-w95-gray bg-silver px-2 py-1">
            <span className="font-bold">
              {folder === "Inbox" && inboxUnread > 0
                ? `Inbox (${inboxUnread})`
                : folder}
            </span>
            <span className="truncate text-sm text-w95-gray">
              {isAll
                ? `All accounts · ${accounts.length} ${
                    accounts.length === 1 ? "mailbox" : "mailboxes"
                  }`
                : `${accountLabel(activeAccount!)} <${activeAccount!.email}>`}
            </span>
          </div>

          {/* Message list / reader. Only Inbox has placeholder mail for now;
              keyed on folder so switching folders resets the open message. */}
          <Inbox
            key={folder}
            initialMessages={folder === "Inbox" ? undefined : []}
            emptyLabel={`No messages in ${folder}${
              isAll ? " across your accounts" : ""
            }.`}
            onAction={(message, kind) =>
              openCompose(buildDraft(message, kind, composeFrom))
            }
            onUnreadCountChange={folder === "Inbox" ? setInboxUnread : undefined}
          />
        </div>
      </div>

      {/* Settings window — a touch larger than a standard dialog. */}
      <Dialog
        open={settingsOpen}
        title="Settings"
        icon={<SettingsIcon size={16} />}
        onClose={() => setSettingsOpen(false)}
        className="h-[32rem] w-[44rem] max-w-[calc(100vw-4rem)]"
        bodyClassName="flex min-h-0 gap-3"
      >
        {/* Section nav on the left, content on the right. */}
        <NavBar orientation="vertical" className="w-44 shrink-0 gap-px">
          {SETTINGS_SECTIONS.map(({ id, label, icon }) => {
            const SectionIcon = icons[icon];
            return (
              <NavItem
                key={id}
                icon={<SectionIcon size={16} />}
                label={label}
                selected={settingsSection === id}
                onClick={() => setSettingsSection(id)}
                className="justify-start"
              />
            );
          })}
        </NavBar>

        <Divider orientation="vertical" />

        <div className="flex min-w-0 flex-1 flex-col">
          {settingsSection === "intelligence" ? (
            <IntelligenceSettings />
          ) : settingsSection === "accounts" ? (
            <AccountsSettings />
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-w95-gray">
              <p className="m-0">Nothing here yet.</p>
            </div>
          )}
        </div>
      </Dialog>

      {/* Docked compose drafts, pinned to the bottom-left corner. */}
      <ComposeDock>
        {composes.map(({ id, draft }) => (
          <div key={id} className="pointer-events-auto">
            <ComposeWindow
              from={composeFrom}
              onClose={() => closeCompose(id)}
              initialTo={draft?.to}
              initialSubject={draft?.subject}
              initialBody={draft?.body}
              autoFocusField={draft?.focus}
            />
          </div>
        ))}
      </ComposeDock>
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
          // The dialog shows its own success screen and closes itself; we just
          // persist the new account in the background.
          createAccountMutation.mutate({ provider, ...credentials });
        }}
      />
    </>
  );
}

export default Home;
