# Noridoc: test

Path: @/test

### Overview

- Contains Vitest coverage for the `nori-discord` CLI package.
- Tests the CLI as a spawned process for user-visible behavior and uses unit tests only for pure helpers.
- Avoids network calls to Discord; request execution behavior is covered through dry-run and request construction.

### How it fits into the larger codebase

- CLI tests exercise the same TypeScript entrypoint that contributors run locally via `tsx`.
- Helper tests pin behavior that is risky for agents: snowflake preservation, JSON coercion, header/query/body routing, and structured error output.
- Packaging and live Discord calls are intentionally not part of the current suite; those should be added when publishing or session bootstrap integration is introduced.

### Core Implementation

- `cli.test.ts` spawns `npx tsx src/index.ts` and verifies exit codes plus JSON stdout for usage errors, missing tokens, dry-runs, route listing, and route descriptions.
- `parse-args.test.ts` verifies CLI flag coercion and snowflake-safe parsing.
- `request.test.ts` verifies the method/path/params to HTTP request mapping without calling the network.
- `errors.test.ts` verifies the stable JSON error contract and Discord-specific remediation hints.

### Things to Know

- Tests use dry-run output instead of mocking `fetch`, because the important behavior is request resolution and agent-visible output.
- The suite intentionally treats the CLI internals as a black box wherever practical.
- If live Discord smoke tests are added later, they should be isolated behind an explicit environment flag and never require production tokens.

Created and maintained by Nori.
