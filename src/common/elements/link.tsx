import clsx from "clsx";
import type { AnchorHTMLAttributes } from "react";

/**
 * Windows 95-style inline hyperlink.
 *
 * A plain anchor with slightly bolder, underlined text — the era's "click me"
 * affordance. Inherits color from its surrounding copy; drop it inside a
 * sentence wherever you'd use an `<a>`.
 */
type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

function Link({ className, ...props }: LinkProps) {
  return (
    <a
      className={clsx(
        "cursor-pointer font-semibold underline hover:brightness-110",
        className,
      )}
      {...props}
    />
  );
}

export default Link;
export { Link };
