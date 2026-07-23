# `src/common/` — shared UI

Shared UI is split into three folders by responsibility. Put a new file in the
right one; don't hand-roll styled markup in a page when a shared piece fits.

## `elements/` — primitives

Generic, reusable, presentational building blocks with no app-specific
knowledge. They know nothing about accounts, mail, intelligence, etc. — you
could lift one into another app unchanged.

Examples: `button`, `input`, `alert`, `dialog` (the generic bevel window),
`divider`, `kbd`, `link`, `loader`, `navbar`, `titlebar`, `icons/`.

## `components/` — specific-use composites

Feature-specific pieces built _from_ elements: dialogs, settings panels, and
other composites tied to a particular domain concept. These import from
`../elements/`.

Examples: `add-account-dialog`, `accounts-settings`, `add-intelligence-dialog`,
`intelligence-settings`, `compose`, `account-select`.

Rule of thumb: if it references a domain type (`Account`, a query key, a
keychain call) or names a feature, it's a component, not an element.

## `layouts/` — layout of any kind

Structural wrappers that arrange regions of a screen: page shells, split panes,
grids, docked-region frames. Layouts compose elements/components into a
positioned structure; they don't own feature logic.

Example: `inbox` — fills a message pane and swaps between `message-list` and
`message-view` depending on whether a message is open.

## Conventions

- Imports are relative (no path alias). From `components/` and `layouts/`,
  reach primitives via `../elements/<name>`.
- Keep the Win95 aesthetic — reuse existing elements and the `bevel-*`
  utilities rather than restyling from scratch.
