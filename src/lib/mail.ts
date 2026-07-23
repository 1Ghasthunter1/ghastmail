/**
 * Mail domain types + placeholder data.
 *
 * There is no message store yet (see `src/lib/db/SKILL.md` — only accounts are
 * persisted). Until a sync layer lands, the inbox renders from the hard-coded
 * `DUMMY_MESSAGES` below so the list/reader UI can be built and styled. Swap
 * this out for a TanStack Query hook backed by the db when messages are real.
 */

export interface Message {
  id: number;
  /** Display name of the sender, e.g. "Clippy". */
  from: string;
  /** Sender address, shown in the reader header. */
  fromEmail: string;
  /** Everyone this was addressed to, including you. Drives Reply All. */
  to: string[];
  subject: string;
  /** One-line snippet shown after the subject in the list row. */
  preview: string;
  /** Full message body — plain text, blank line between paragraphs. */
  body: string;
  /** Pre-formatted timestamp for the row (today → time, else date). */
  time: string;
  unread: boolean;
  starred: boolean;
}

/**
 * A stand-in inbox. Deliberately period-flavoured so the empty product still
 * feels alive while the real sync is wired up.
 */
export const DUMMY_MESSAGES: Message[] = [
  {
    id: 1,
    from: "Clippy",
    fromEmail: "assistant@office.microsoft.com",
    to: ["you@ghastmail.local"],
    subject: "It looks like you're writing an email",
    preview: "Would you like help with that? I noticed you've started a letter…",
    body: "Hi there!\n\nIt looks like you're writing an email. Would you like help with that?\n\nI can help you:\n  • Format the message\n  • Check your spelling\n  • Add a cheerful sign-off\n\nJust say the word — I'm always watching.\n\nYours eagerly,\nClippy",
    time: "10:32 AM",
    unread: true,
    starred: true,
  },
  {
    id: 2,
    from: "Windows Update",
    fromEmail: "no-reply@update.windows.com",
    to: ["you@ghastmail.local", "everyone@office.local"],
    subject: "Your computer will restart in 5 minutes",
    preview: "Updates are ready to install. Please save your work before the scheduled restart.",
    body: "Important updates are ready for your computer.\n\nYour computer is scheduled to restart in 5 minutes to finish installing. Please save any open work now.\n\nThis restart cannot be postponed more than 4 additional times.\n\n— Windows Update",
    time: "9:47 AM",
    unread: true,
    starred: false,
  },
  {
    id: 3,
    from: "Solitaire High Scores",
    fromEmail: "scores@games.local",
    to: ["you@ghastmail.local"],
    subject: "New personal best!",
    preview: "Congratulations — you cleared the board in 2 minutes 14 seconds.",
    body: "Congratulations!\n\nYou've set a new personal best in Solitaire:\n\n  Time: 2:14\n  Moves: 118\n  Score: 8,240\n\nThe cards will now cascade in celebration. You've earned it.",
    time: "Yesterday",
    unread: false,
    starred: true,
  },
  {
    id: 4,
    from: "Dial-Up Networking",
    fromEmail: "connection@isp.net",
    to: ["you@ghastmail.local", "mom@homephone.net"],
    subject: "You've got mail (and a phone bill)",
    preview: "Your connection lasted 3 hours 12 minutes. Someone is trying to call.",
    body: "Connection summary\n\nYour dial-up session lasted 3 hours 12 minutes.\n\nPlease note: the phone line was occupied for the entire duration. Three callers reached a busy signal. Your mother would like you to call her back.\n\nDisconnecting now to free the line.",
    time: "Yesterday",
    unread: false,
    starred: false,
  },
  {
    id: 5,
    from: "Defragmenter",
    fromEmail: "maintenance@system.local",
    to: ["you@ghastmail.local", "sysadmin@office.local"],
    subject: "Defragmentation 84% complete",
    preview: "The little blocks are almost all lined up. Please do not touch anything.",
    body: "Disk Defragmenter status\n\nProgress: 84%\n\nThe coloured blocks are nearly all in order. This is oddly satisfying to watch, but please do not open any programs, move the mouse aggressively, or breathe on the machine until it finishes.\n\nEstimated time remaining: 2 hours.",
    time: "Mon",
    unread: false,
    starred: false,
  },
  {
    id: 6,
    from: "Screensaver",
    fromEmail: "flying-toasters@after-dark.com",
    to: ["you@ghastmail.local"],
    subject: "The toasters are flying again",
    preview: "You've been idle for 15 minutes. The toasters have taken flight.",
    body: "Hello,\n\nYou have been idle for 15 minutes, so the flying toasters have once again taken to the skies of your monitor.\n\nMove the mouse or press any key to bring them gently back to earth.\n\nFly safe.",
    time: "Mon",
    unread: false,
    starred: false,
  },
  {
    id: 7,
    from: "Recycle Bin",
    fromEmail: "trash@desktop.local",
    to: ["you@ghastmail.local"],
    subject: "Are you sure you want to do this?",
    preview: "You're about to permanently delete 42 items. This action cannot be undone.",
    body: "Confirm File Delete\n\nYou are about to permanently delete 42 items totalling 3.7 MB.\n\nAre you sure you want to do this? Really sure? There's no getting them back afterwards.\n\n[Yes]   [No]   [Cancel]   [Ask me again later]",
    time: "Sun",
    unread: false,
    starred: false,
  },
  {
    id: 8,
    from: "Minesweeper",
    fromEmail: "board@games.local",
    to: ["you@ghastmail.local", "highscores@games.local"],
    subject: "That was a mine.",
    preview: "Better luck next time. The board has been revealed for your review.",
    body: "Game over.\n\nThat was, in fact, a mine.\n\nThe board has been fully revealed below so you can see exactly how avoidable that was. Square (4,7) was flagged incorrectly.\n\nPress F2 to try again.",
    time: "Sun",
    unread: false,
    starred: false,
  },
];

// --- replying ----------------------------------------------------------------

/** Which action bar button was pressed in the reader. */
export type ReplyKind = "reply" | "reply-all" | "forward";

/** Prefill for a compose window opened from a message. */
export interface Draft {
  to: string;
  subject: string;
  body: string;
  /** Field the compose window should focus on open. */
  focus: "to" | "body";
}

/** Adds `Re: ` / `Fwd: ` unless the subject already carries it. */
function prefixSubject(prefix: string, subject: string) {
  return subject.toLowerCase().startsWith(prefix.toLowerCase())
    ? subject
    : prefix + subject;
}

/**
 * Builds the compose prefill for a reader action.
 *
 * `self` is the address of the account in focus — it's dropped from Reply All
 * recipients so you don't mail yourself.
 *
 * Replies open with an empty body and focus it, so you type straight away.
 * Forward carries the standard forwarded-message block (the original is the
 * whole point) and focuses To, the one field it can't fill in. The leading
 * blank lines leave room to write above the block.
 */
export function buildDraft(
  message: Message,
  kind: ReplyKind,
  self: string,
): Draft {
  if (kind === "forward") {
    return {
      to: "",
      subject: prefixSubject("Fwd: ", message.subject),
      body:
        `\n\nBegin forwarded message:\n\n` +
        `From: ${message.from} <${message.fromEmail}>\n` +
        `Date: ${message.time}\n` +
        `Subject: ${message.subject}\n` +
        `To: ${message.to.join(", ")}\n\n` +
        message.body,
      focus: "to",
    };
  }

  const recipients =
    kind === "reply-all"
      ? [message.fromEmail, ...message.to]
      : [message.fromEmail];

  return {
    // Dedupe, and never address the reply back to yourself.
    to: [...new Set(recipients)].filter((a) => a !== self).join(", "),
    subject: prefixSubject("Re: ", message.subject),
    body: "",
    focus: "body",
  };
}
