import { useEffect, useRef, useState } from "react";
import type { Account } from "../../lib/db";

/**
 * Windows 95-style account picker.
 *
 * A sunken field showing the active mail account; the raised chevron opens a
 * menu of every connected account. Selection is keyed by account id (not by
 * label) so duplicate display names stay unambiguous. Used in the mail client
 * toolbar (top-left).
 */

const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

/** Pixel-style downward chevron (matches the one in `Input`). */
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

/** Display label for an account: its display name, or the email as fallback. */
function accountLabel(account: Account): string {
  return account.displayName.trim() || account.email;
}

interface AccountSelectProps {
  accounts: Account[];
  /** Currently-selected account id, or null. */
  value: number | null;
  onChange: (id: number) => void;
  className?: string;
}

function AccountSelect({ accounts, value, onChange, className }: AccountSelectProps) {
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

  const selected = accounts.find((a) => a.id === value) ?? null;

  return (
    <div ref={containerRef} className={cn("relative font-w95", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="bevel-field flex w-56 items-stretch bg-white p-px text-black"
      >
        <span className="min-w-0 flex-1 truncate px-2 py-1 text-left text-base leading-none">
          {selected ? accountLabel(selected) : "No account"}
        </span>
        <span className="bevel-raised my-px flex w-4 shrink-0 items-center justify-center bg-silver">
          <Chevron className="fill-black" />
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="bevel-raised absolute top-full right-0 left-0 z-20 mt-px max-h-60 overflow-auto bg-white p-px"
        >
          {accounts.map((account) => {
            const isSelected = account.id === value;
            return (
              <li key={account.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(account.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "group block w-full cursor-pointer px-2 py-1 text-left leading-tight",
                    isSelected
                      ? "bg-navy text-white"
                      : "text-black hover:bg-navy hover:text-white",
                  )}
                >
                  <span className="block truncate text-base font-bold">
                    {accountLabel(account)}
                  </span>
                  <span
                    className={cn(
                      "block truncate text-sm",
                      isSelected
                        ? "text-white/80"
                        : "text-w95-gray group-hover:text-white/80",
                    )}
                  >
                    {account.email}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default AccountSelect;
export { AccountSelect, accountLabel };
