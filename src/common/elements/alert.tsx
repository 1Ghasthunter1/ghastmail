import type { ReactNode } from "react";
import Dialog from "./dialog";
import Button from "./button";

/**
 * Windows 95-style alert.
 *
 * The stripped-down dialog for a single message and a short set of choices —
 * "Do you want to continue?", "Delete this item?", a plain notice. It's a
 * thin wrapper over `Dialog`: a close-only title bar, an optional icon beside
 * the message, and a centered row of action buttons. For anything richer
 * (forms, scrollable content), reach for `Dialog` directly.
 */

const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

interface AlertAction {
  label: ReactNode;
  onClick?: () => void;
  /** Renders with a focus ring as the default choice. */
  primary?: boolean;
}

interface AlertProps {
  open?: boolean;
  /** Title bar text. */
  title?: ReactNode;
  /** Icon shown beside the message (e.g. an info/warning glyph). */
  icon?: ReactNode;
  /** The message body. */
  children: ReactNode;
  /** Buttons to show. Defaults to a single "OK" that closes the alert. */
  actions?: AlertAction[];
  modal?: boolean;
  onClose?: () => void;
  className?: string;
}

function Alert({
  open = true,
  title = "Message",
  icon,
  children,
  actions,
  modal = true,
  onClose,
  className,
}: AlertProps) {
  const resolved: AlertAction[] =
    actions && actions.length > 0
      ? actions
      : [{ label: "OK", primary: true, onClick: onClose }];

  return (
    <Dialog
      open={open}
      title={title}
      modal={modal}
      onClose={onClose}
      className={cn("w-72", className)}
      bodyClassName="py-5"
      footer={
        <div className="flex w-full justify-center gap-3">
          {resolved.map((action, i) => (
            <Button
              key={i}
              previewState={action.primary ? "focused" : undefined}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      }
    >
      <div className="flex items-start gap-4">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="min-w-0 flex-1 leading-snug">{children}</div>
      </div>
    </Dialog>
  );
}

export default Alert;
export { Alert };
