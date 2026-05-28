import { useState } from "react";
import Button from "./common/elements/button";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="container">
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
        }}
      >
        {/* The one interactive button to test with. */}
        <Button onClick={() => setCount((c) => c + 1)}>
          Pressed {count}
        </Button>

        {/* Every state, rendered side by side. */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <Showcase label="Default">
            <Button previewState="default">Button</Button>
          </Showcase>
          <Showcase label="Hover">
            <Button previewState="hover">Button</Button>
          </Showcase>
          <Showcase label="Pressed">
            <Button previewState="pressed">Button</Button>
          </Showcase>
          <Showcase label="Focused">
            <Button previewState="focused">Button</Button>
          </Showcase>
          <Showcase label="Disabled">
            <Button disabled>Button</Button>
          </Showcase>
        </div>
      </div>
    </main>
  );
}

function Showcase({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
      <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
    </div>
  );
}

export default App;
