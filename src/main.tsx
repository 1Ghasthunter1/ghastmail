import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Elements from "./pages/Elements";

// Single app-wide query client. TanStack Query is the default way data is
// fetched/mutated in this app — see `src/lib/db/SKILL.md`.
const queryClient = new QueryClient();

// Hash routing: URLs look like `…/index.html#/settings`, which survives
// reloads in Tauri's webview (no server to fall back to index.html).
const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "settings", element: <Settings /> },
      { path: "elements", element: <Elements /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
