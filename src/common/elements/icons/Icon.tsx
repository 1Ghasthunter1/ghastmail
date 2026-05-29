import type { CSSProperties, ImgHTMLAttributes } from "react";

/**
 * Base renderer for the Win95 bitmap icons. Each named icon component (Folder,
 * Trash, …) wraps this with its imported PNG. Rendered crisp/pixelated and
 * square; pass `size` (px) to scale — 16 for nav/sidebar, 32 for native.
 */
export interface IconProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src: string;
  size?: number;
}

function Icon({ src, size = 16, alt = "", className, style, ...rest }: IconProps) {
  const computed: CSSProperties = {
    imageRendering: "pixelated",
    ...style,
  };
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
      className={className}
      style={computed}
      {...rest}
    />
  );
}

export default Icon;
