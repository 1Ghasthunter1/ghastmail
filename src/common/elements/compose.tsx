import clsx from "clsx";
import { useState } from "react";
import type { ReactNode } from "react";
import TitleBar from "./titlebar";
import Button from "./button";
import Input from "./input";

/**
 * Gmail-style docked compose window.
 *
 * A draft window — not draggable — with its own Win95 title bar carrying three
 * controls:
 *   • minimize — collapse to just the title bar, a small strip at the bottom.
 *   • maximize — expand to fill the screen.
 *   • close.
 * Below the bar sit the To / Subject / body fields and a Send action. Several
 * of these are arranged by `ComposeDock`, which pins them to the bottom-right.
 */

type ComposeMode = "normal" | "minimized" | "maximized";

interface ComposeWindowProps {
  /** Sender shown in the read-only "From" line. */
  from?: string;
  onClose?: () => void;
}

function ComposeWindow({ from, onClose }: ComposeWindowProps) {
  const [mode, setMode] = useState<ComposeMode>("normal");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const title = subject.trim() || "New Message";
  const minimized = mode === "minimized";
  const maximized = mode === "maximized";

  // Each control toggles its mode off (back to normal) when already active.
  const toggleMinimize = () =>
    setMode((m) => (m === "minimized" ? "normal" : "minimized"));
  const toggleMaximize = () =>
    setMode((m) => (m === "maximized" ? "normal" : "maximized"));

  return (
    <div
      className={clsx(
        "bevel-raised flex flex-col bg-silver p-[3px] font-w95 shadow-[2px_2px_4px_rgba(0,0,0,0.35)]",
        maximized
          ? "fixed inset-0 z-50"
          : minimized
            ? "w-64"
            : "w-[26rem]",
      )}
    >
      <TitleBar
        title={title}
        controls={["minimize", "maximize", "close"]}
        onMinimize={toggleMinimize}
        onMaximize={toggleMaximize}
        onClose={onClose}
      />

      {!minimized && (
        <>
          <div
            className={clsx(
              "flex flex-col gap-1 px-2 py-2 text-base text-black",
              maximized && "min-h-0 flex-1",
            )}
          >
            {from && (
              <div className="flex items-baseline gap-2 text-sm">
                <span className="w-12 shrink-0 text-w95-gray">From</span>
                <span className="truncate">{from}</span>
              </div>
            )}
            <Input
              className="w-full"
              placeholder="To"
              value={to}
              onValueChange={setTo}
            />
            <Input
              className="w-full"
              placeholder="Subject"
              value={subject}
              onValueChange={setSubject}
            />
            <textarea
              className={clsx(
                "bevel-field w-full resize-none bg-white p-1 font-w95 text-base leading-snug text-black outline-none",
                maximized ? "min-h-0 flex-1" : "h-56",
              )}
              placeholder="Write your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-2 pb-2">
            <Button previewState="focused" onClick={onClose}>
              Send
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Fixed frame that pins compose windows to the bottom-right corner and lays
 * them out in a row, so a second draft opens to the left of the first.
 */
function ComposeDock({ children }: { children: ReactNode }) {
  return (
    <div
      className={clsx(
        "pointer-events-none fixed bottom-0 right-0 z-40",
        // row-reverse: the first (oldest) draft hugs the corner, newer ones
        // stack to its left — Gmail's docking order.
        "flex flex-row-reverse items-end gap-3 p-3",
      )}
    >
      {/* Each window re-enables pointer events; the frame itself is click-through. */}
      {children}
    </div>
  );
}

export default ComposeWindow;
export { ComposeWindow, ComposeDock };
