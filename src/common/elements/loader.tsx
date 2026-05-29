import { useEffect, useState } from "react";
import clsx from "clsx";
import { icons, type IconName } from "./icons";

/**
 * A teal Win95-flavored progress strip for a specific use case: a short,
 * indeterminate wait (e.g. saving credentials).
 *
 * An icon sits on each end with four little squares marching across the middle.
 * The squares light up one at a time, left → right, then reset and loop. Each
 * lit square is cyan with a hard (blur-free) drop toward the bottom-left, so it
 * reads as a stacked second square.
 */

const SQUARE_COUNT = 4;

interface LoaderProps {
  /** Icon shown on the left, by registry name. */
  leftIcon?: IconName;
  /** Icon shown on the right, by registry name. */
  rightIcon?: IconName;
  /** Milliseconds between each square lighting up (left → right). */
  stepMs?: number;
  className?: string;
}

function Loader({ leftIcon, rightIcon, stepMs = 750, className }: LoaderProps) {
  // How many squares are currently lit (0..SQUARE_COUNT). Climbs one per tick,
  // then wraps back to 0 so the sweep repeats.
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLit((n) => (n >= SQUARE_COUNT ? 0 : n + 1));
    }, stepMs);
    return () => clearInterval(id);
  }, [stepMs]);

  const LeftIcon = leftIcon ? icons[leftIcon] : null;
  const RightIcon = rightIcon ? icons[rightIcon] : null;

  return (
    <div
      className={clsx(
        "flex items-center justify-center gap-8 bg-win95-green px-4 py-8",
        className,
      )}
    >
      {LeftIcon && <LeftIcon size={48} />}

      <div className="flex items-center gap-3">
        {Array.from({ length: SQUARE_COUNT }, (_, i) => (
          <span
            key={i}
            className={clsx(
              "size-1.5 bg-[#02fdfc] shadow-[-2px_2px_0_0_#0b3373]",
              i < lit ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      {RightIcon && <RightIcon size={48} />}
    </div>
  );
}

export default Loader;
export { Loader };
