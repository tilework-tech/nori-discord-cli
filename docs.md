# Noridoc: nori-discord-cli

Path: @/

### Overview

- Standalone TypeScript npm package that publishes the `nori-discord` binary (package name `nori-discord-cli`).
- Exposes Discord's REST API as method-plus-path shell commands for coding agents.
- Mirrors the agent-facing contract of `nori-slack-cli`: deterministic JSON stdout, structured errors, dry-run support, and no interactive prompts.

### How it fits into the larger codebase

- Intended as the Discord counterpart to `tilework-tech/nori-slack-cli`, but it uses generic HTTP requests instead of a service SDK so the CLI can call any Discord REST route.
- Publish packaging mirrors the published `nori-luma-cli` package: Apache-2.0 in @/LICENSE plus the Ship of Theseus addendum in @/LICENSE-ADDENDUM.txt, and @/package.json carries the license, repository, engines, and `prepublishOnly` (build plus test gate) metadata. Unlike `nori-luma-cli`, the `repository` field is set: the GitHub repo is public, so the npm listing links back to it.
- Can be bundled into Nori Sessions later through the same bootstrap npm-tarball path used for `nori-slack-cli`; that integration is deliberately separate from this package.
- Discord permissions, bot membership, OAuth scopes, and token type are the authorization boundary. The CLI does not enforce Nori-specific policy or endpoint allowlists.
- Route discovery is local metadata for agent ergonomics. It is not a gate on the request surface.

### Core Implementation

- @/src/index.ts is the CLI entrypoint: discovery commands, the dynamic request command, JSON stdin reads, token resolution, dry-run output, and fetch calls. Pure helper modules in @/src split out argument parsing (snowflake-safe coercion of arbitrary flags), request construction, error formatting, and the discovery route catalog; see @/src/docs.md.
- @/tsconfig.json compiles @/src into `dist/` with type declarations and sourcemaps. `dist/index.js` is the `bin` entry, and the npm tarball ships only `dist` plus the license files (@/package.json `files`).
- Tests in @/test exercise the CLI boundary with spawned `tsx` processes and keep pure helper coverage for parsing, request construction, and error formatting. The suite doubles as the publish gate through `prepublishOnly`.

### Things to Know

- Discord snowflakes are preserved as strings during argument parsing to avoid precision loss.
- Dry-run output redacts authorization values and reports only token presence and token type.
- `DISCORD_BEARER_TOKEN` takes precedence over `DISCORD_BOT_TOKEN`; `DISCORD_TOKEN_TYPE` overrides the default `Bot` authorization prefix for bot tokens and has no effect when the bearer token is set.
- Discord docs links in @/src/routes.ts use `https://docs.discord.com/developers/...` with no `/docs` path segment; the `/developers/docs/...` form 404s on the live docs site, and @/test/cli.test.ts pins the working shape.
- `--json-input` waits for stdin. Do not pass it without piping JSON or using an interactive terminal.
- The route catalog should be expanded for discoverability, but unknown routes are always allowed through the dynamic request command.
- The installed command is `nori-discord`, not the package name `nori-discord-cli`.

Created and maintained by Nori.
