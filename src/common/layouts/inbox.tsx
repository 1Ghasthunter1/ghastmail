import { useEffect, useState } from "react";
import MessageList from "../components/message-list";
import MessageView from "../components/message-view";
import { DUMMY_MESSAGES, type Message, type ReplyKind } from "../../lib/mail";

/**
 * Inbox layout.
 *
 * Fills a message pane and swaps between the two states of a mail folder:
 * the full-width row list, and the reader for whichever row you opened.
 * Opening a message marks it read; the star toggles from either view's list.
 *
 * Message state is local because there's no message store yet — see
 * `src/lib/mail.ts`. When sync lands this becomes a TanStack Query hook and
 * the toggles become mutations.
 *
 * Folder switching should remount this (`<Inbox key={folder} …/>`) so the
 * open message and read/star edits don't leak across folders.
 */

interface InboxProps {
  /** Seed messages for this folder. Defaults to the placeholder inbox. */
  initialMessages?: Message[];
  /** Shown when the folder has no messages. */
  emptyLabel?: string;
  /** Reply / Reply All / Forward from the reader's action bar. */
  onAction: (message: Message, kind: ReplyKind) => void;
  /** Reports the unread count whenever it changes (opening a row clears one). */
  onUnreadCountChange?: (count: number) => void;
}

function Inbox({
  initialMessages = DUMMY_MESSAGES,
  emptyLabel = "No messages here.",
  onAction,
  onUnreadCountChange,
}: InboxProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [openId, setOpenId] = useState<number | null>(null);

  const unreadCount = messages.filter((m) => m.unread).length;
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const openMessage = (message: Message) => {
    setOpenId(message.id);
    // Reading a message clears its unread state, as in any mail client.
    setMessages((current) =>
      current.map((m) => (m.id === message.id ? { ...m, unread: false } : m)),
    );
  };

  const toggleStar = (id: number) =>
    setMessages((current) =>
      current.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)),
    );

  // Read from state, not the click payload, so the reader reflects later edits.
  const openMessageData = messages.find((m) => m.id === openId) ?? null;

  if (openMessageData) {
    return (
      <MessageView
        message={openMessageData}
        onBack={() => setOpenId(null)}
        onAction={(kind) => onAction(openMessageData, kind)}
      />
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-w95-gray">
        <p className="m-0">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <MessageList
      messages={messages}
      onOpen={openMessage}
      onToggleStar={toggleStar}
    />
  );
}

export default Inbox;
