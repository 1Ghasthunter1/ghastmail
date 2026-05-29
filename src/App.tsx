import { Outlet } from "react-router-dom";
import "./App.css";

/** Shell layout. Shared chrome lives here; routed pages render in the Outlet. */
function App() {
  return (
    <main className="flex min-h-screen flex-col pr-2">
      <Outlet />
    </main>
  );
}

export default App;
