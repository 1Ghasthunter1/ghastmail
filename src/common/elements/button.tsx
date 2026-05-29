import clsx from "clsx";
import { useState } from "react";
import type { ButtonHTMLAttributes } from "react";

/**
 * Windows 95-style button.
 *
 * Reproduces the bevel states from the design (default / hover / pressed /
 * focused / disabled) using the `bevel-raised` / `bevel-sunken` utilities
 * defined in App.css. The component is stateful: it tracks hover, press, and
 * focus internally with useState and picks the matching classes on each render.
 */

// Forces a static visual state, ignoring interaction — handy for showcases.
type PreviewState = "default" | "hover" | "pressed" | "focused";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  previewState?: PreviewState;
}

function Button({
  children = "Button",
  disabled = false,
  previewState,
  className,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onFocus,
  onBlur,
  ...rest
}: ButtonProps) {
  const [hoveredState, setHovered] = useState(false);
  const [pressedState, setPressed] = useState(false);
  const [focusedState, setFocused] = useState(false);

  // A preview override wins over live interaction state.
  const hovered = previewState ? previewState === "hover" : hoveredState;
  const focused = previewState ? previewState === "focused" : focusedState;

  const active = previewState
    ? previewState === "pressed"
    : pressedState && hoveredState && !disabled;

  const classes = clsx(
    "inline-flex items-center justify-center font-w95 text-base leading-none",
    "min-w-[60px] px-3 py-2 box-border border-0 rounded-none bg-silver select-none",
    active
      ? "bevel-sunken translate-x-px translate-y-px"
      : "bevel-raised",
    disabled
      ? "text-w95-gray cursor-default [text-shadow:1px_1px_0_#fff]"
      : "text-black cursor-pointer",
    hovered && !disabled && !active && "brightness-105",
    focused &&
      !disabled &&
      "outline outline-1 outline-dotted outline-black outline-offset-[-4px]",
    className,
  );

  return (
    <button
      type="button"
      disabled={disabled}
      className={classes}
      onMouseEnter={(e) => {
        setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        setPressed(false);
        onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        setPressed(true);
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setPressed(false);
        onMouseUp?.(e);
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
