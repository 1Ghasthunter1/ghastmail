import { useState } from "react";
import Button from "../elements/button";
import Divider from "../elements/divider";
import Alert from "../elements/alert";
import { icons } from "../elements/icons";
import AddAccountDialog from "./add-account-dialog";
import { accountLabel } from "./account-select";
import {
  useAccounts,
  useAddGmailAccount,
  useDeleteAccount,
} from "../../lib/accounts";
import type { Account } from "../../lib/db";

// --- panel -------------------------------------------------------------------
//
// Mirrors `intelligence-settings.tsx` in layout. Account queries and mutations
// come from `src/lib/accounts.ts` rather than being declared here, so this panel
// and `pages/Home.tsx` invalidate the same query key — otherwise adding an
// account in Settings would leave the toolbar's picker stale.

const FolderMailIcon = icons["folder-mail"];

/** Settings panel for managing connected mail accounts. */
function AccountsSettings() {
  const [addOpen, setAddOpen] = useState(false);
  // Account pending a remove confirmation, or null when no alert is shown.
  const [pendingRemove, setPendingRemove] = useState<Account | null>(null);

  const { data: accounts } = useAccounts();
  const addMutation = useAddGmailAccount();
  const deleteMutation = useDeleteAccount();

  const confirmRemove = () => {
    if (pendingRemove) deleteMutation.mutate(pendingRemove);
    setPendingRemove(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Title + add action. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FolderMailIcon size={24} />
          <h2 className="m-0 text-xl font-bold">Accounts</h2>
        </div>
        <Button onClick={() => setAddOpen(true)}>Add Account</Button>
      </div>

      <Divider className="my-3" />

      {/* Connected accounts — one row each. */}
      {!accounts || accounts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-center text-w95-gray">
          <p className="m-0">No accounts added yet.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bevel-field flex items-center gap-3 bg-white px-3 py-2"
            >
              <FolderMailIcon size={16} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-bold">
                  {accountLabel(account)}
                </span>
                <span className="truncate text-sm text-w95-gray">
                  {account.email}
                </span>
              </div>

              <div className="flex-1" />
              <Button onClick={() => setPendingRemove(account)}>Remove</Button>
            </div>
          ))}
        </div>
      )}

      {/* The dialog runs its own loader/error/success sequence; `mutateAsync`
          hands it the rejection so it can diagnose the failure in place. */}
      <AddAccountDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(_provider, form) => addMutation.mutateAsync(form)}
      />

      {/* Confirm before dropping the row and its keychain entry. */}
      <Alert
        open={pendingRemove !== null}
        title="Confirm Remove Account"
        icon="trash"
        onClose={() => setPendingRemove(null)}
        actions={[
          { label: "Yes", primary: true, onClick: confirmRemove },
          { label: "No", onClick: () => setPendingRemove(null) },
        ]}
      >
        {pendingRemove && (
          <>
            Remove {pendingRemove.email} from this device? Its app password is
            deleted from your keychain, and you'll need to enter a new one to
            reconnect.
          </>
        )}
      </Alert>
    </div>
  );
}

export default AccountsSettings;
export { AccountsSettings };
