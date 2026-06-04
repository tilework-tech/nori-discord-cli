# Noridoc: nori-discord-cli

Path: @/

### Overview

- Standalone TypeScript npm package for the `nori-discord` binary.
- Exposes Discord's REST API as method-plus-path shell commands for coding agents.
- Mirrors the agent-facing contract of `nori-slack-cli`: deterministic JSON stdout, structured errors, dry-run support, and no interactive prompts.

### How it fits into the larger codebase

- Intended as the Discord counterpart to `tilework-tech/nori-slack-cli`, but it uses generic HTTP requests instead of a service SDK so the CLI can call any Discord REST route.
- Can be bundled into Nori Sessions later through the same bootstrap npm-tarball path used for `nori-slack-cli`; that integration is deliberately separate from this package scaffold.
- Discord permissions, bot membership, OAuth scopes, and token type are the authorization boundary. The CLI does not enforce Nori-specific policy or endpoint allowlists.
- Route discovery is local metadata for agent ergonomics. It is not a gate on the request surface.

### Core Implementation

- `src/index.ts` is the CLI entrypoint. It defines discovery commands and the dynamic request command, reads JSON stdin, merges CLI params, resolves auth, handles dry-run output, and performs fetch calls.
- `src/request.ts` converts a Discord method/path/parameter set into a fetch request. GET/DELETE params become query strings; POST/PUT/PATCH params become JSON bodies unless explicit query params are supplied.
- `src/errors.ts` converts missing-token, usage, network, and Discord HTTP errors into stable JSON objects with remediation hints and source paths.
- `src/routes.ts` contains the discovery-only known route catalog and fallback route descriptions.
- Tests exercise the CLI boundary with spawned `tsx` processes and keep pure helper coverage for parsing, request construction, and error formatting.

### Things to Know

- Discord snowflakes are preserved as strings during argument parsing to avoid precision loss.
- Dry-run output redacts authorization values and reports only token presence and token type.
- `DISCORD_BEARER_TOKEN` takes precedence over `DISCORD_BOT_TOKEN`; otherwise bot auth is the default.
- `--json-input` waits for stdin. Do not pass it without piping JSON or using an interactive terminal.
- The route catalog should be expanded for discoverability, but unknown routes are always allowed through the dynamic request command.

Created and maintained by Nori.
