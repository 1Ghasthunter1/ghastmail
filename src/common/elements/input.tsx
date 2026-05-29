import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";

/**
 * Windows 95-style text input.
 *
 * A sunken white field (`bevel-field`) with an optional raised dropdown chevron
 * button on the right. When `options` are supplied, the chevron opens a
 * Win95-style menu; picking an item fills the field and fires `onValueChange`.
 * Disabled fields render on the silver face with grey text/chevron.
 */

/** Pixel-style downward chevron, drawn crisp to match the bitmap aesthetic. */
function Chevron({ className }: { className?: string }) {
  return (
    <svg
      width="7"
      height="4"
      viewBox="0 0 7 4"
      shapeRendering="crispEdges"
      className={className}
    >
      <path d="M0 0h7v1H6v1H5v1H4v1H3v-1H2v-1H1V1H0z" />
    </svg>
  );
}

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Show a dropdown chevron button at the right edge. */
  dropdown?: boolean;
  /** Options shown in the dropdown menu. Implies `dropdown`. */
  options?: string[];
  /** Fired when the user types or picks an option. */
  onValueChange?: (value: string) => void;
  onDropdownClick?: () => void;
  /** Classes for the outer field wrapper. */
  containerClassName?: string;
}

function Input({
  dropdown = false,
  options,
  onValueChange,
  onDropdownClick,
  disabled = false,
  className,
  containerClassName,
  onChange,
  ...rest
}: InputProps) {
  const hasMenu = !!options && options.length > 0;
  const showChevron = dropdown || hasMenu;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function pick(option: string) {
    onValueChange?.(option);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        "bevel-field relative inline-flex items-stretch p-px font-w95",
        disabled ? "bg-silver" : "bg-white",
        containerClassName,
      )}
    >
      <input
        disabled={disabled}
        className={clsx(
          "min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-base leading-none outline-none",
          disabled ? "text-w95-gray" : "text-black",
          className,
        )}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        {...rest}
      />
      {showChevron && (
        <button
          type="button"
          disabled={disabled}
          aria-label="Open"
          aria-expanded={hasMenu ? open : undefined}
          onClick={() => {
            onDropdownClick?.();
            if (hasMenu) setOpen((o) => !o);
          }}
          className={clsx(
            "bevel-raised my-px flex w-4 shrink-0 items-center justify-center bg-silver",
            disabled ? "cursor-default" : "cursor-pointer",
          )}
        >
          <Chevron className={disabled ? "fill-w95-gray" : "fill-black"} />
        </button>
      )}
      {hasMenu && open && !disabled && (
        <ul className="bevel-raised absolute top-full -right-px left-0 z-10 mt-px max-h-48 overflow-auto bg-white p-px">
          {options!.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => pick(option)}
                className="block w-full cursor-pointer px-2 py-1 text-left text-base leading-none text-black hover:bg-navy hover:text-white"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Input;
