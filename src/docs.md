# Noridoc: src

Path: @/src

### Overview

- Contains the TypeScript implementation for the `nori-discord` CLI.
- Keeps request construction, error formatting, argument parsing, and route metadata separated so the CLI boundary stays small and testable.
- Uses Node's built-in `fetch` rather than a Discord SDK to preserve a direct REST API mapping.

### How it fits into the larger codebase

- @/src/index.ts is compiled to `dist/index.js` (with type declarations and sourcemaps, per @/tsconfig.json) and exposed as the npm binary from the @/package.json `bin` field.
- Helper modules are pure except for the entrypoint's process, stdin/stdout, and network boundaries.
- The route metadata supports agent discovery commands but does not constrain the dynamic request command.

### Core Implementation

- @/src/parse-args.ts converts unknown CLI flags into Discord-compatible parameter keys and preserves snowflake precision by leaving long integer-like values as strings.
- @/src/request.ts builds the Discord API URL and `RequestInit`, including API versioning, user agent, authorization, content type, query serialization, and JSON body serialization.
- @/src/errors.ts normalizes missing token, bad usage, request, and Discord HTTP failures into the CLI's stable JSON error shape.
- @/src/routes.ts stores common Discord REST route metadata for `list-routes` and `describe`.
- @/src/index.ts handles the side-effect boundary: Commander parsing, stdin reads, token resolution, fetch execution, stdout/stderr, and process exits.

### Things to Know

- `--query-json` and `--header-json` are the escape hatches for Discord routes where regular body/query inference is ambiguous.
- Dry-run output includes the resolved URL, query, body, sanitized headers, token presence, and authorization type.
- `DISCORD_BEARER_TOKEN` wins over `DISCORD_BOT_TOKEN` so OAuth calls can be tested without unsetting the bot token; `DISCORD_TOKEN_TYPE` replaces the `Bot` authorization prefix for bot tokens and is ignored when the bearer token is set.
- Every `docs_url` in @/src/routes.ts (including the unknown-route fallback) uses `https://docs.discord.com/developers/...` with no `/docs` path segment. The `/developers/docs/...` form 404s on the live Discord docs site, and @/test/cli.test.ts pins this shape.
- Error formatting deliberately includes the source path so agents can locate and inspect the CLI code when a call fails.

Created and maintained by Nori.
