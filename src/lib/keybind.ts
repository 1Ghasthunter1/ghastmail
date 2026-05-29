import { useEffect, useId, useRef } from "react";

/**
 * App-wide keyboard shortcut layer.
 *
 * Components declare a shortcut with a human-readable spec — `"c"`, `"cmd+c"`,
 * `"shift+/"`, `"alt+enter"` — via `useKeybind`. A single window-level keydown
 * listener (attached lazily, removed when the last binding unmounts) dispatches
 * to the matching handler. `keybindTokens` turns the same spec into display
 * labels for the `<Kbd>` component.
 *
 * Editable-field rule: when focus is in an input/textarea/select/contenteditable,
 * only shortcuts that include a modifier (Cmd/Ctrl/Alt) fire — so typing a plain
 * letter never triggers a bare-letter shortcut.
 */

export interface Combo {
  /** Main key, lowercased to match `KeyboardEvent.key` (e.g. "c", "enter", "/"). */
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

type ModName = "meta" | "ctrl" | "shift" | "alt";

const MOD_ALIASES: Record<string, ModName> = {
  cmd: "meta",
  command: "meta",
  meta: "meta",
  super: "meta",
  win: "meta",
  ctrl: "ctrl",
  control: "ctrl",
  shift: "shift",
  alt: "alt",
  option: "alt",
  opt: "alt",
};

// Spec token -> the value React's `KeyboardEvent.key` reports (lowercased).
const KEY_ALIASES: Record<string, string> = {
  esc: "escape",
  del: "delete",
  return: "enter",
  space: " ",
  spacebar: " ",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
};

export function parseKeybind(spec: string): Combo {
  const combo: Combo = {
    key: "",
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
  };
  for (const raw of spec.split("+")) {
    const token = raw.trim().toLowerCase();
    if (!token) continue;
    const mod = MOD_ALIASES[token];
    if (mod) {
      combo[mod] = true;
    } else {
      combo.key = KEY_ALIASES[token] ?? token;
    }
  }
  return combo;
}

// Pretty labels for the keycap display.
const KEY_DISPLAY: Record<string, string> = {
  " ": "Space",
  escape: "Esc",
  enter: "Enter",
  delete: "Del",
  backspace: "Bksp",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

/** Turns a spec into ordered display labels, e.g. `"cmd+c"` -> `["Cmd", "C"]`. */
export function keybindTokens(spec: string): string[] {
  const c = parseKeybind(spec);
  const tokens: string[] = [];
  if (c.ctrl) tokens.push("Ctrl");
  if (c.alt) tokens.push("Alt");
  if (c.shift) tokens.push("Shift");
  if (c.meta) tokens.push("Cmd");
  if (c.key) tokens.push(KEY_DISPLAY[c.key] ?? c.key.toUpperCase());
  return tokens;
}

interface Registration {
  combo: Combo;
  handler: (e: KeyboardEvent) => void;
  enabled: boolean;
  /** Fire even when focus is in an editable field (e.g. Esc to close). */
  allowInInput: boolean;
}

const registry = new Map<string, Registration>();
let listening = false;

function hasModifier(c: Combo): boolean {
  return c.meta || c.ctrl || c.alt;
}

function matches(combo: Combo, e: KeyboardEvent): boolean {
  return (
    e.key.toLowerCase() === combo.key &&
    e.metaKey === combo.meta &&
    e.ctrlKey === combo.ctrl &&
    e.shiftKey === combo.shift &&
    e.altKey === combo.alt
  );
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  if (el.isContentEditable) return true;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.repeat) return;
  const editable = isEditable(e.target);
  // Most recently registered wins, so an open dialog's binding shadows the
  // page beneath it rather than both firing.
  for (const reg of [...registry.values()].reverse()) {
    if (!reg.enabled) continue;
    if (editable && !hasModifier(reg.combo) && !reg.allowInInput) continue;
    if (matches(reg.combo, e)) {
      e.preventDefault();
      reg.handler(e);
      return;
    }
  }
}

/**
 * Register `handler` to fire when `spec` is pressed. A falsy `spec` or
 * `enabled: false` registers nothing. The handler may change between renders
 * without re-registering.
 */
export function useKeybind(
  spec: string | undefined,
  handler: (e: KeyboardEvent) => void,
  options?: { enabled?: boolean; allowInInput?: boolean },
): void {
  const id = useId();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const enabled = options?.enabled ?? true;
  const allowInInput = options?.allowInInput ?? false;

  useEffect(() => {
    if (!spec || !enabled) return;
    registry.set(id, {
      combo: parseKeybind(spec),
      handler: (e) => handlerRef.current(e),
      enabled: true,
      allowInInput,
    });
    if (!listening) {
      window.addEventListener("keydown", onKeyDown);
      listening = true;
    }
    return () => {
      registry.delete(id);
      if (registry.size === 0 && listening) {
        window.removeEventListener("keydown", onKeyDown);
        listening = false;
      }
    };
  }, [spec, enabled, allowInInput, id]);
}
