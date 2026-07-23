import Button from "../elements/button";
import Divider from "../elements/divider";
import type { Message, ReplyKind } from "../../lib/mail";

/**
 * Single-message reader.
 *
 * Shown in place of the list once a row is opened: a back action, the subject
 * as a heading, the sender/date line, then the body. Body text is plain, so it
 * renders in a `whitespace-pre-wrap` block to keep the author's line breaks.
 */

interface MessageViewProps {
  message: Message;
  /** Return to the list. */
  onBack: () => void;
  /** Opens a compose draft prefilled from this message. */
  onAction: (kind: ReplyKind) => void;
}

const ACTIONS: { kind: ReplyKind; label: string; keybind?: string }[] = [
  { kind: "reply", label: "Reply", keybind: "r" },
  { kind: "reply-all", label: "Reply All", keybind: "shift+r" },
  { kind: "forward", label: "Forward" },
];

function MessageView({ message, onBack, onAction }: MessageViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Reader toolbar. Escape also goes back, via the button's keybind. */}
      <div className="flex shrink-0 items-center gap-2 border-b border-w95-gray bg-silver px-2 py-1">
        <Button keybind="escape" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white p-3">
        <h2 className="m-0 text-lg font-bold">{message.subject}</h2>

        <div className="mt-1 flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate">
            <span className="font-bold">{message.from}</span>
            <span className="text-w95-gray"> &lt;{message.fromEmail}&gt;</span>
          </span>
          <span className="shrink-0 text-w95-gray">{message.time}</span>
        </div>

        <Divider className="my-2" />

        <p className="m-0 whitespace-pre-wrap">{message.body}</p>
      </div>

      {/* Action bar, pinned below the scrolling body. */}
      <div className="flex shrink-0 items-center gap-2 border-t border-w95-gray bg-silver px-2 py-1">
        {ACTIONS.map(({ kind, label, keybind }) => (
          <Button key={kind} keybind={keybind} onClick={() => onAction(kind)}>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default MessageView;
