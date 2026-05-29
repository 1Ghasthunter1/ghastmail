import { useState } from "react";
import Button from "../common/elements/button";
import AddAccountDialog from "../common/elements/add-account-dialog";

/** Empty state shown when no mail accounts have been added yet. */
function Home() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="m-0 text-3xl font-normal">GhastMailer</h1>
      <p className="m-0 opacity-70">No accounts added yet.</p>
      <Button className="mt-2" onClick={() => setAddOpen(true)}>
        Add Account
      </Button>
      <AddAccountDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={() => setAddOpen(false)}
      />
    </div>
  );
}

export default Home;
