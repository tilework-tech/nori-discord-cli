# Noridoc: test

Path: @/test

### Overview

- Contains Vitest coverage for the `nori-discord` CLI package.
- Tests the CLI as a spawned process for user-visible behavior and uses unit tests only for pure helpers.
- Avoids network calls to Discord; request execution behavior is covered through dry-run and request construction.

### How it fits into the larger codebase

- CLI tests exercise the same TypeScript entrypoint (@/src/index.ts) that contributors run locally via `tsx`.
- Helper tests pin behavior that is risky for agents: snowflake preservation, JSON coercion, header/query/body routing, and structured error output.
- The suite is the npm publish gate: `prepublishOnly` in @/package.json runs the build and this suite before any publish.
- Live Discord calls are intentionally not part of the suite.

### Core Implementation

- @/test/cli.test.ts spawns `npx tsx src/index.ts` and verifies exit codes plus JSON stdout for usage errors, missing tokens, dry-runs, route listing, and route descriptions.
- The remaining unit tests pin pure-helper behavior: flag coercion and snowflake-safe parsing, the method/path/params-to-HTTP-request mapping, and the stable JSON error contract with Discord-specific remediation hints.

### Things to Know

- Tests use dry-run output instead of mocking `fetch`, because the important behavior is request resolution and agent-visible output.
- The suite intentionally treats the CLI internals as a black box wherever practical.
- @/test/cli.test.ts pins the shape of every `docs_url` returned by `list-routes` and `describe`: links must start with `https://docs.discord.com/developers/` and must not be followed by a `docs/` segment, because the old `/developers/docs/...` URLs 404.
- If live Discord smoke tests are added later, they should be isolated behind an explicit environment flag and never require production tokens.

Created and maintained by Nori.
