import clsx from "clsx";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { AnchorHTMLAttributes, MouseEvent } from "react";

/**
 * Windows 95-style inline hyperlink.
 *
 * A plain anchor with slightly bolder, underlined text — the era's "click me"
 * affordance. Inherits color from its surrounding copy; drop it inside a
 * sentence wherever you'd use an `<a>`.
 *
 * An `http(s)` href is handed to the OS browser instead of being followed:
 * letting the webview navigate would replace the app with a web page and there
 * is no back button to return from it. Other hrefs (in-app anchors) behave
 * normally.
 */
type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

function isExternal(href: string | undefined): href is string {
  return !!href && /^https?:\/\//i.test(href);
}

function Link({ className, href, onClick, ...props }: LinkProps) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || !isExternal(href)) return;
    e.preventDefault();
    void openUrl(href);
  }

  return (
    <a
      href={href}
      onClick={handleClick}
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
