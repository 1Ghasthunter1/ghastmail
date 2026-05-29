import type { ReactNode } from "react";
import TitleBar, { type TitleBarControl } from "./titlebar";

/**
 * Windows 95-style dialog window.
 *
 * A general-purpose floating window: a raised silver frame with a `TitleBar`
 * on top, a body for arbitrary content, and an optional footer (typically a
 * row of buttons). Renders nothing when `open` is false. By default it sits in
 * a centered modal overlay; pass `modal={false}` to drop it inline (e.g. for
 * the element showcase). For the trimmed-down confirm/notice case, use
 * `Alert`, which is built on top of this.
 */

const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

interface DialogProps {
  /** Controls visibility. Defaults to true so it can be used uncontrolled. */
  open?: boolean;
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  /** Right-aligned action area, usually buttons. */
  footer?: ReactNode;
  /** Wrap in a centered, click-to-dismiss overlay. Defaults to true. */
  modal?: boolean;
  /** Title bar buttons. Defaults to just the close box. */
  controls?: TitleBarControl[];
  onClose?: () => void;
  /** Classes for the window frame (sizing lives here). */
  className?: string;
  /** Classes for the body wrapper. */
  bodyClassName?: string;
}

function Dialog({
  open = true,
  title,
  icon,
  children,
  footer,
  modal = true,
  controls = ["close"],
  onClose,
  className,
  bodyClassName,
}: DialogProps) {
  if (!open) return null;

  const window = (
    <div
      role="dialog"
      aria-modal={modal}
      className={cn(
        "bevel-raised flex w-80 flex-col bg-silver p-[3px] font-w95",
        className,
      )}
    >
      <TitleBar
        title={title}
        icon={icon}
        controls={controls}
        onClose={onClose}
      />
      <div className={cn("flex-1 px-3 py-4 text-base text-black", bodyClassName)}>
        {children}
      </div>
      {footer && (
        <div className="flex justify-end gap-2 px-3 pb-3">{footer}</div>
      )}
    </div>
  );

  if (!modal) return window;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      {/* Stop overlay clicks from bubbling out and dismissing the dialog. */}
      <div onClick={(e) => e.stopPropagation()}>{window}</div>
    </div>
  );
}

export default Dialog;
export { Dialog };
