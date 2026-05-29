import { Outlet } from "react-router-dom";
import "./App.css";

/** Shell layout. Shared chrome lives here; routed pages render in the Outlet. */
function App() {
  return (
    <main className="container flex min-h-screen flex-col">
      <Outlet />
    </main>
  );
}

export default App;
