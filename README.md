# nori-discord-cli

A CLI for the Discord REST API, designed for coding agents.

`nori-discord-cli` is a thin command-line wrapper around Discord's HTTP REST API. It maps to REST directly: every request is expressed as an HTTP method plus a Discord API path. There is no curated command tree, no business logic, and no endpoint-specific permission layer. Capability boundaries come from Discord bot permissions, OAuth scopes, and token access.

## Why This Exists

Discord's REST API is documented for developers writing application code. This CLI is for agents that need a deterministic shell interface.

- No interactive prompts or decorative output.
- Successful responses are single-line JSON on stdout.
- Errors are JSON on stdout, plus a short human-readable stderr message.
- `--dry-run` resolves the request without requiring a token or calling Discord.
- Errors include a `source` path so an agent can inspect the implementation.
- Route discovery is a helper only; the request command can call routes not listed in the static catalog.

## Install

From source:

```bash
npm install
npm run build
npm link
```

Then set a token:

```bash
export DISCORD_BOT_TOKEN=...
```

For OAuth bearer-token REST calls:

```bash
export DISCORD_BEARER_TOKEN=...
```

## Usage

The general shape is:

```bash
nori-discord <HTTP_METHOD> <PATH> [--param value ...]
```

Examples:

```bash
nori-discord GET /channels/123/messages --limit 10
nori-discord POST /channels/123/messages --content "hello"
echo '{"content":"from stdin"}' | nori-discord POST /channels/123/messages --json-input
nori-discord POST /channels/123/messages --content "hello" --dry-run
```

For `GET` and `DELETE`, regular flags become query parameters. For `POST`, `PUT`, and `PATCH`, regular flags become a JSON body. Use `--query-json` and `--header-json` for routes that need explicit query params or headers alongside a body.

```bash
nori-discord POST /guilds/123/channels \
  --name triage \
  --query-json '{"reason":"setup"}' \
  --header-json '{"X-Audit-Log-Reason":"setup"}'
```

Flags are converted from `--kebab-case` to `snake_case`. Booleans, small integers, and inline JSON objects/arrays are coerced. Discord snowflakes stay strings.

## Discovery

```bash
nori-discord list-routes
nori-discord list-routes --resource message
nori-discord describe POST /channels/{channel_id}/messages
```

The catalog is for agent discovery and suggestions only. Unknown routes can still be called.

## Top-Level Flags

| Flag | Purpose |
| --- | --- |
| `--json-input` | Read body parameters as JSON from stdin. CLI flags override stdin keys. |
| `--query-json <json>` | Merge query parameters from a JSON object. |
| `--header-json <json>` | Merge request headers from a JSON object. |
| `--api-version <version>` | Select the Discord API version. Defaults to `10`. |
| `--dry-run` | Print the resolved request without calling Discord. |
| `--no-auth` | Send no Authorization header. |

## Authentication

`DISCORD_BOT_TOKEN` produces `Authorization: Bot <token>`.

`DISCORD_BEARER_TOKEN` produces `Authorization: Bearer <token>` and takes precedence when set.

Dry runs never print token values. They report only whether a token is present and which authorization type would be used.

## Exit Codes

- `0` - success
- `1` - Discord API error, network error, or missing token
- `2` - bad CLI usage

Created and maintained by Nori.
