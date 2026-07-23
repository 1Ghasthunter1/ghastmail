import clsx from "clsx";
import type { Message } from "../../lib/mail";

/**
 * Gmail-style message list.
 *
 * Full-width rows, one per message: star, sender, subject + preview snippet,
 * and the timestamp pinned right. Unread rows are bold on white; read rows go
 * grey-backed and regular weight, the way a read Gmail row recedes. Clicking
 * anywhere on a row (except the star) opens it.
 *
 * Purely presentational — the parent owns read/starred state and passes
 * messages already reflecting it.
 */

interface MessageListProps {
  messages: Message[];
  /** Fired when a row is activated by click, Enter, or Space. */
  onOpen: (message: Message) => void;
  onToggleStar: (id: number) => void;
}

/** Pixel-ish five-point star; filled + gold when the message is starred. */
function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z"
        className={clsx(
          filled ? "fill-[#e0a800] stroke-[#8a6800]" : "fill-none stroke-w95-gray",
        )}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MessageRow({
  message,
  onOpen,
  onToggleStar,
}: {
  message: Message;
  onOpen: (message: Message) => void;
  onToggleStar: (id: number) => void;
}) {
  const { unread } = message;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(message)}
      onKeyDown={(e) => {
        // Enter / Space activate, matching native button behaviour.
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(message);
        }
      }}
      className={clsx(
        "flex w-full cursor-default items-center gap-2 border-b border-w95-light px-2 py-1",
        "focus:outline focus:outline-1 focus:-outline-offset-2 focus:outline-black",
        unread ? "bg-white font-bold" : "bg-[#f4f4f4] text-w95-gray",
        "hover:bg-w95-light hover:text-black",
      )}
    >
      <button
        type="button"
        // Stop the click bubbling to the row, or starring would also open it.
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(message.id);
        }}
        aria-label={message.starred ? "Unstar message" : "Star message"}
        aria-pressed={message.starred}
        className="flex shrink-0 items-center p-0.5"
      >
        <Star filled={message.starred} />
      </button>

      {/* Sender column — fixed so subjects line up down the list. */}
      <span className="w-40 shrink-0 truncate">{message.from}</span>

      {/* Subject + snippet share the remaining width and truncate together. */}
      <span className="min-w-0 flex-1 truncate">
        {message.subject}
        <span className="font-normal text-w95-gray"> — {message.preview}</span>
      </span>

      <span className="shrink-0 text-sm tabular-nums">{message.time}</span>
    </div>
  );
}

function MessageList({ messages, onOpen, onToggleStar }: MessageListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {messages.map((message) => (
        <MessageRow
          key={message.id}
          message={message}
          onOpen={onOpen}
          onToggleStar={onToggleStar}
        />
      ))}
    </div>
  );
}

export default MessageList;
