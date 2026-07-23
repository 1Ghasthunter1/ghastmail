import { useState } from "react";
import Button from "../elements/button";
import Divider from "../elements/divider";
import { icons } from "../elements/icons";
import AddAccountDialog from "./add-account-dialog";

// --- panel -------------------------------------------------------------------
//
// Mirrors `intelligence-settings.tsx` in layout. No data wiring yet — this is
// just the chrome (title, add action, empty state) plus the add-account dialog
// (UI only) for the Accounts section of the Settings window.

const FolderMailIcon = icons["folder-mail"];

/** Settings panel for managing connected mail accounts. */
function AccountsSettings() {
  const [addOpen, setAddOpen] = useState(false);

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

      {/* Connected accounts — placeholder until the data layer is wired up. */}
      <div className="flex flex-1 items-center justify-center text-center text-w95-gray">
        <p className="m-0">No accounts added yet.</p>
      </div>

      {/* UI only for now — the dialog runs its own loader/success sequence and
          nothing is persisted. */}
      <AddAccountDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

export default AccountsSettings;
export { AccountsSettings };
