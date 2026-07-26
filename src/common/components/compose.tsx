import clsx from "clsx";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import TitleBar from "../elements/titlebar";
import Button from "../elements/button";
import Input from "../elements/input";
import Link from "../elements/link";
import { useKeybind } from "../../lib/keybind";
import { parseRecipients } from "../../lib/mail";
import { gmailErrorCopy, isGmailError, sendGmailMessage } from "../../lib/gmail";
import type { Account } from "../../lib/db";

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

/**
 * Inline send failure, sized for the compose window's action row.
 *
 * Deliberately not a dialog: the draft stays visible and editable behind it, so
 * fixing a typo'd address is one click away.
 */
function SendError({ error }: { error: unknown }) {
  const copy = gmailErrorCopy(error);
  const raw = isGmailError(error) ? error.raw : null;

  return (
    <span
      className="min-w-0 flex-1 truncate text-sm"
      // The full diagnosis, since the row only has space for one line.
      title={[copy.headline, copy.secondary, raw].filter(Boolean).join("\n\n")}
    >
      {copy.headline}
      {copy.helpUrl && (
        <>
          {" "}
          <Link href={copy.helpUrl}>{copy.helpLabel}</Link>
        </>
      )}
    </span>
  );
}

interface ComposeWindowProps {
  /**
   * The sending account. Shown in the read-only "From" line, and its
   * `credentialRef` is what lets Rust find the app password — so without it
   * Send is disabled.
   */
  account?: Account;
  onClose?: () => void;
  /** Disable the built-in Esc-to-close binding. */
  noEscClose?: boolean;
  /**
   * Seed values for a draft opened from an existing message (reply / forward).
   * Seeds only — the fields are editable and own their state from then on.
   */
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  /**
   * Field to focus when the window opens. Replies point at the body (To and
   * Subject are already filled in); a forward points at To.
   */
  autoFocusField?: "to" | "body";
}

function ComposeWindow({
  account,
  onClose,
  noEscClose = false,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  autoFocusField,
}: ComposeWindowProps) {
  const [mode, setMode] = useState<ComposeMode>("normal");
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  const from = account?.email;

  // No cache to invalidate — there's no local message store yet — so this is a
  // plain mutation for its pending/error state.
  const send = useMutation({
    mutationFn: () => {
      if (!account) throw new Error("No account to send from.");
      return sendGmailMessage({
        credentialRef: account.credentialRef,
        from: account.email,
        to: parseRecipients(to),
        subject,
        body,
      });
    },
    // The window closes on success; the draft is gone either way, and there's
    // no Sent view to return to yet (Gmail files the copy server-side).
    onSuccess: () => onClose?.(),
  });

  // Esc closes the most recently opened compose window, even while a field has
  // focus (you're almost always typing in one). Blocked mid-send so a stray Esc
  // can't hide a draft whose delivery hasn't been confirmed.
  useKeybind("escape", () => onClose?.(), {
    enabled: !noEscClose && !!onClose && !send.isPending,
    allowInInput: true,
  });

  const canSend =
    !!account && parseRecipients(to).length > 0 && !send.isPending;

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
              autoFocus={autoFocusField === "to"}
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
              autoFocus={autoFocusField === "body"}
            />
          </div>
          <div className="flex items-center gap-2 px-2 pb-2">
            <Button
              previewState={canSend ? "focused" : undefined}
              disabled={!canSend}
              onClick={() => send.mutate()}
            >
              {send.isPending ? "Sending…" : "Send"}
            </Button>
            {send.isPending && (
              <span className="text-sm text-w95-gray">
                Contacting smtp.gmail.com…
              </span>
            )}
            {/* Failures keep the draft open with everything typed intact —
                losing a message to a bad address would be unforgivable. */}
            {send.isError && !send.isPending && <SendError error={send.error} />}
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
