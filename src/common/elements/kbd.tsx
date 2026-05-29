import clsx from "clsx";
import { keybindTokens } from "../../lib/keybind";

/**
 * Renders a keybind spec as a row of small Win95 keycaps — each key in its own
 * lightly-raised box with an offset background, sized to sit quietly beside a
 * label. Pair with `useKeybind` (or just drop into a `Button keybind=…`).
 */
interface KbdProps {
  keybind: string;
  className?: string;
}

function Kbd({ keybind, className }: KbdProps) {
  const tokens = keybindTokens(keybind);
  if (tokens.length === 0) return null;

  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)}>
      {tokens.map((token, i) => (
        <kbd
          key={i}
          className="bevel-raised inline-flex min-w-[1.1em] items-center justify-center bg-w95-light px-1 py-px font-w95 text-[0.65em] leading-none text-w95-gray"
        >
          {token}
        </kbd>
      ))}
    </span>
  );
}

export default Kbd;
