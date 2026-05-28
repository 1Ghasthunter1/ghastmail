import Button from "./common/elements/button";
import "./App.css";

function App() {
  function handleAddAccount() {
    // TODO: open the add-account flow.
  }

  return (
    <main className="container">
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="m-0 text-3xl font-normal">GhastMailer</h1>
        <p className="m-0 opacity-70">No accounts added yet.</p>
        <Button onClick={handleAddAccount} className="mt-2">
          Add mail account
        </Button>
      </div>
    </main>
  );
}

export default App;
