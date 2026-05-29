import type { ReactNode } from "react";

/**
 * Windows 95-style nav bar.
 *
 * `NavItem` is an icon + label cell with a selectable (sunken) state, used for
 * both the top toolbar and the folder sidebar. `NavBar` lays items out in a
 * row or column. Bevels come from the `bevel-raised` / `bevel-sunken`
 * utilities in App.css.
 */

const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

interface NavItemProps {
  icon?: ReactNode;
  label: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

function NavItem({
  icon,
  label,
  selected = false,
  disabled = false,
  onClick,
  className,
}: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-2 border-0 bg-silver px-2 py-1 font-w95 text-base leading-none select-none",
        selected ? "bevel-sunken" : "bevel-raised",
        disabled ? "cursor-default text-w95-gray" : "cursor-pointer text-black",
        className,
      )}
    >
      {icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

interface NavBarProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
  children: ReactNode;
}

function NavBar({
  orientation = "horizontal",
  className,
  children,
}: NavBarProps) {
  return (
    <div
      className={cn(
        "flex bg-silver",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { NavBar, NavItem };
