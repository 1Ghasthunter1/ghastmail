import { useState } from "react";
import type { ReactNode } from "react";

/**
 * Windows 95-style window title bar.
 *
 * The navy strip that sits at the top of a window: an optional icon, the
 * title text, and the minimize / maximize / close control buttons on the
 * right. When `active` is false it renders greyed-out (silver bar, grey text)
 * like a background window. Used as the chrome for `Dialog` and `Alert`, but
 * exported on its own for any windowed surface.
 */

const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export type TitleBarControl = "minimize" | "maximize" | "close";

/** The three control glyphs, drawn to match the bitmap window buttons. */
function Glyph({ control }: { control: TitleBarControl }) {
  if (control === "minimize") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" className="fill-current">
        <rect x="4" y="10" width="8" height="2" />
      </svg>
    );
  }
  if (control === "maximize") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" className="fill-current">
        <path fillRule="evenodd" d="M3 3H13V13H3V3Z M4 6H12V12H4V6Z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="fill-current">
      <path d="M4 4H6V5.143H7V6.286H9V5.143H10V4H12V5.143H11V6.286H10V7.429H9V8.571H10V9.714H11V10.857H12V12H10V10.857H9V9.714H7V10.857H6V12H4V10.857H5V9.714H6V8.571H7V7.429H6V6.286H5V5.143H4V4Z" />
    </svg>
  );
}

/** A single 16×16 raised control button that sinks while pressed. */
function ControlButton({
  control,
  disabled,
  onClick,
}: {
  control: TitleBarControl;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const active = pressed && !disabled;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={control}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center border-0 bg-silver p-0 text-black",
        active ? "bevel-sunken translate-x-px translate-y-px" : "bevel-raised",
        disabled ? "cursor-default text-w95-gray" : "cursor-pointer",
      )}
    >
      <Glyph control={control} />
    </button>
  );
}

interface TitleBarProps {
  title: ReactNode;
  icon?: ReactNode;
  /** Navy active bar (default) vs. greyed-out background-window look. */
  active?: boolean;
  /** Which control buttons to show, left to right. */
  controls?: TitleBarControl[];
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  className?: string;
}

function TitleBar({
  title,
  icon,
  active = true,
  controls = ["minimize", "maximize", "close"],
  onMinimize,
  onMaximize,
  onClose,
  className,
}: TitleBarProps) {
  const handlers: Record<TitleBarControl, (() => void) | undefined> = {
    minimize: onMinimize,
    maximize: onMaximize,
    close: onClose,
  };

  return (
    <div
      className={cn(
        "flex select-none items-center gap-1 px-1 py-[3px] font-w95 text-base leading-none",
        active ? "bg-navy text-white" : "bg-silver text-w95-gray",
        className,
      )}
    >
      {icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate text-left font-bold">{title}</span>
      {controls.length > 0 && (
        <span className="flex shrink-0 items-center gap-[2px] pl-1">
          {controls.map((control) => (
            <ControlButton
              key={control}
              control={control}
              onClick={handlers[control]}
            />
          ))}
        </span>
      )}
    </div>
  );
}

export default TitleBar;
export { TitleBar };
