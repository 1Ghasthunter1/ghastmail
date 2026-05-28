import { useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";

/**
 * Windows 95-style button.
 *
 * Reproduces the bevel states from the design (default / hover / pressed /
 * focused / disabled) using layered inset box-shadows. The component is
 * stateful: it tracks hover, press, and focus internally with useState and
 * picks the matching bevel on each render.
 */

// Win95 bevel palette (matches the SVG's feColorMatrix values).
const FACE = "#C0C0C0"; // silver button face
const LIGHT = "#DFDFDF"; // 0.87451 — inner highlight
const WHITE = "#FFFFFF"; // outer highlight
const GRAY = "#808080"; // 0.498 — inner shadow
const BLACK = "#000000"; // outer shadow

// Raised bevel: light top-left, dark bottom-right.
const RAISED =
  `inset -1px -1px 0 ${BLACK}, inset 1px 1px 0 ${WHITE}, ` +
  `inset -2px -2px 0 ${GRAY}, inset 2px 2px 0 ${LIGHT}`;

// Sunken bevel (pressed): inverted — dark top-left, light bottom-right.
const SUNKEN =
  `inset 1px 1px 0 ${BLACK}, inset -1px -1px 0 ${WHITE}, ` +
  `inset 2px 2px 0 ${GRAY}, inset -2px -2px 0 ${LIGHT}`;

// Forces a static visual state, ignoring interaction — handy for showcases.
type PreviewState = "default" | "hover" | "pressed" | "focused";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  previewState?: PreviewState;
}

function Button({
  children = "Button",
  disabled = false,
  previewState,
  style,
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
  const pressed = previewState ? previewState === "pressed" : pressedState;
  const focused = previewState ? previewState === "focused" : focusedState;

  const active = previewState
    ? previewState === "pressed"
    : pressed && hovered && !disabled;

  const computed: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    fontSize: "1rem",
    lineHeight: 1,
    minWidth: 60,
    padding: "8px 12px",
    boxSizing: "border-box",
    border: "none",
    borderRadius: 0,
    backgroundColor: FACE,
    color: disabled ? GRAY : BLACK,
    // Engraved text look for disabled, matching the SVG's grey "Button".
    textShadow: disabled ? `1px 1px 0 ${WHITE}` : "none",
    boxShadow: active ? SUNKEN : RAISED,
    // Hover gets a touch more contrast on the highlight without changing layout.
    filter: hovered && !disabled && !active ? "brightness(1.03)" : "none",
    // Pressed content nudges down-right, like a real Win95 button.
    transform: active ? "translate(1px, 1px)" : "none",
    // Dotted focus ring, inset — the dashed rect in the focused state.
    outline: focused && !disabled ? `1px dotted ${BLACK}` : "none",
    outlineOffset: "-4px",
    cursor: disabled ? "default" : "pointer",
    userSelect: "none",
    ...style,
  };

  return (
    <button
      type="button"
      disabled={disabled}
      style={computed}
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
