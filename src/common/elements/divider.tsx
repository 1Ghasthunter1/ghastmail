import clsx from "clsx";

/**
 * Windows 95-style etched divider.
 *
 * The classic two-tone groove: a dark gray line with a white line just past it,
 * so it reads as a thin engraved seam. Horizontal by default; pass
 * `orientation="vertical"` to separate side-by-side columns. Span/length comes
 * from the parent (it stretches to fill), with `className` for spacing.
 */
interface DividerProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

function Divider({ orientation = "horizontal", className }: DividerProps) {
  const vertical = orientation === "vertical";
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={clsx(
        "shrink-0 bg-w95-gray",
        vertical
          ? "h-full w-px shadow-[1px_0_0_#ffffff]"
          : "h-px w-full shadow-[0_1px_0_#ffffff]",
        className,
      )}
    />
  );
}

export default Divider;
