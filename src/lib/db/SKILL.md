---
name: database
description: How to work with the SQLite database in this Tauri app — the lib/db query/mutation layer, the TanStack Query usage pattern, and how to add migrations.
---

# Working with the database

This app persists data in **SQLite** via the [`tauri-plugin-sql`](https://v2.tauri.app/plugin/sql/) plugin. The frontend never talks to the plugin directly and **never writes inline SQL in components**. All access goes through the typed functions in `src/lib/db/`.

## The paradigm in one breath

```
component  ──uses──▶  TanStack Query hook  ──calls──▶  src/lib/db/<domain>.ts  ──runs──▶  SQLite
```

- `src/lib/db/<domain>.ts` — one file per table/domain (e.g. `accounts.ts`). Exports small, **typed, async** functions: `listAccounts()`, `getAccount(id)`, `createAccount({...})`, `deleteAccount(id)`.
- `src/lib/db/client.ts` — the shared connection (`getDb`) plus the `select` / `execute` helpers the domain files build on. Don't open your own connection.
- Components call those functions through **TanStack Query** (`useQuery` / `useMutation`) — see below. This is the default for all data fetching in the app.

## Calling existing operations

```ts
import { listAccounts, createAccount } from "../lib/db";
```

Always go through the barrel (`../lib/db`) and prefer an existing function. Functions take a single typed object argument when they have more than one field, e.g. `createAccount({ credentialRef, email, displayName, ... })`, and return fully-typed results (`Account`, `Account[]`, `Account | null`).

### Secrets never go in the db

Passwords and API keys live in the **OS keychain**, not SQLite — see `src/lib/keychain.ts`. The `accounts` table stores a `credential_ref` UUID that names the keychain entry (`accountKeychainKey(ref)`), never the secret itself, and there is deliberately no "read secret" wrapper on the JS side. Deleting an account must delete its keychain entry too; `useDeleteAccount` in `src/lib/accounts.ts` is the only correct way to remove one.

## Using the db from a component (TanStack Query)

Reads use `useQuery`; writes use `useMutation` and invalidate the affected query keys so the UI refreshes.

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMessages, createMessage, type CreateMessageInput } from "./db";

const messageKeys = {
  all: ["messages"] as const,
};

function useMessages() {
  return useQuery({ queryKey: messageKeys.all, queryFn: listMessages });
}

function useCreateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMessageInput) => createMessage(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.all }),
  });
}
```

Conventions:
- **Query keys** are arrays namespaced by domain: `["accounts"]`, `["accounts", id]`. Keep a small `<domain>Keys` object near the hooks.
- When **more than one screen** mutates a domain, the hooks belong in a shared module — not inline in a component — so every view invalidates the same key. `src/lib/accounts.ts` is the worked example: `Home.tsx` and `accounts-settings.tsx` both use it.
- The `QueryClientProvider` is already mounted in `src/main.tsx` — don't add another.
- Put the `queryFn`/`mutationFn` logic in `src/lib/db/`; keep hooks thin.

## Adding a new query or mutation

1. Find or create the right domain file in `src/lib/db/` (e.g. `messages.ts`).
2. Add a typed `async` function that uses `select<Row>(...)` or `execute(...)` from `./client`.
3. SQLite returns **snake_case** columns. Define a private `Row` interface for the raw shape and a `toX()` mapper to the camelCase type the app uses (see `accounts.ts`).
4. Use **parameterized** queries with `$1, $2, …` placeholders — never string-interpolate values.
5. Export the new type/function and add the file to `src/lib/db/index.ts` if it's new.

## Adding a migration

Schema lives in Rust and is applied automatically at startup and on `Database.load`.

1. Create the next numbered file in `src-tauri/migrations/`, e.g. `0004_add_messages.sql`. Use the next sequential version number.
2. Register it in `src-tauri/src/migrations.rs`: append a `Migration { version, description, sql: include_str!("../migrations/0004_add_messages.sql"), kind: MigrationKind::Up }`.
3. Migrations are **append-only and idempotent**: never edit a shipped migration — add a new forward one. Prefer `IF NOT EXISTS` guards; everything runs in a transaction.
4. Restart `pnpm tauri dev` to apply.

> The db name (`sqlite:ghastmail.db`) appears in three places that must agree: `DB_NAME` in `client.ts`, `DB_URL` in `migrations.rs`, and `preload` in `tauri.conf.json`.

## Permissions

`src-tauri/capabilities/default.json` grants `sql:default` (load/select/close) and `sql:allow-execute` (insert/update/delete). If a write fails with a permission error, confirm `sql:allow-execute` is present.
