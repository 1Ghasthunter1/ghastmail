import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { Account } from "../../lib/db";

/**
 * Windows 95-style account picker.
 *
 * A sunken field showing the active mail account; the raised chevron opens a
 * menu of every connected account. Selection is keyed by account id (not by
 * label) so duplicate display names stay unambiguous. Used in the mail client
 * toolbar (top-left).
 *
 * When `allOption` is set, an always-first "All accounts" entry is added for a
 * merged view across every account; it is represented by the [`ALL_ACCOUNTS`]
 * sentinel rather than an id.
 */

/** Sentinel value for the merged "All accounts" selection. */
export const ALL_ACCOUNTS = "all" as const;

/** Either a specific account id or the merged-view sentinel. */
export type AccountSelection = number | typeof ALL_ACCOUNTS;

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
  /** Currently-selected account id, or the [`ALL_ACCOUNTS`] sentinel. */
  value: AccountSelection;
  onChange: (value: AccountSelection) => void;
  /** Prepend an always-first "All accounts" merged-view option. */
  allOption?: boolean;
  className?: string;
}

function AccountSelect({
  accounts,
  value,
  onChange,
  allOption = false,
  className,
}: AccountSelectProps) {
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
  const isAll = value === ALL_ACCOUNTS;

  const fieldLabel = isAll
    ? "All accounts"
    : selected
      ? accountLabel(selected)
      : "No account";

  function pick(next: AccountSelection) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={clsx("relative font-w95", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="bevel-field flex w-56 items-stretch bg-white p-px text-black"
      >
        <span className="min-w-0 flex-1 truncate px-2 py-1 text-left text-base leading-none">
          {fieldLabel}
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
          {allOption && (
            <li role="option" aria-selected={isAll}>
              <button
                type="button"
                onClick={() => pick(ALL_ACCOUNTS)}
                className={clsx(
                  "group block w-full cursor-pointer px-2 py-1 text-left leading-tight",
                  isAll
                    ? "bg-navy text-white"
                    : "text-black hover:bg-navy hover:text-white",
                )}
              >
                <span className="block truncate text-base font-bold">
                  All accounts
                </span>
                <span
                  className={clsx(
                    "block truncate text-sm",
                    isAll
                      ? "text-white/80"
                      : "text-w95-gray group-hover:text-white/80",
                  )}
                >
                  {accounts.length}{" "}
                  {accounts.length === 1 ? "account" : "accounts"}
                </span>
              </button>
            </li>
          )}

          {accounts.map((account) => {
            const isSelected = account.id === value;
            return (
              <li key={account.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => pick(account.id)}
                  className={clsx(
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
                    className={clsx(
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
