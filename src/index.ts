#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { formatError } from './errors.js';
import { parseArgs } from './parse-args.js';
import { buildDiscordRequest, sanitizeHeadersForOutput } from './request.js';
import { describeRoute, listRoutes } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.resolve(__dirname, '..');
const USER_AGENT = 'DiscordBot (https://noriagentic.com, nori-discord-cli/0.1.0)';

const program = new Command();

const readStdinJson = async () => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const stdinData = Buffer.concat(chunks).toString().trim();
  if (stdinData.length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(stdinData);
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('stdin JSON must be an object');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw { code: 'bad_usage', message: `Invalid JSON on stdin: ${stdinData.slice(0, 100)}` };
  }
};

const parseJsonOption = (args: { value?: string | null; name: string }) => {
  const { value, name } = args;
  if (value == null) return {};

  try {
    const parsed = JSON.parse(value);
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${name} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw { code: 'bad_usage', message: `${name} must be valid JSON object text.` };
  }
};

const stripControlOptions = (argv: string[]) => {
  const controlsWithValues = new Set(['--api-version', '--query-json', '--header-json']);
  const controlsWithoutValues = new Set(['--json-input', '--dry-run', '--no-auth']);
  const result: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (controlsWithoutValues.has(arg)) {
      continue;
    }

    if (controlsWithValues.has(arg)) {
      i++;
      continue;
    }

    if ([...controlsWithValues, ...controlsWithoutValues].some((control) => arg.startsWith(`${control}=`))) {
      continue;
    }

    result.push(arg);
  }

  return result;
};

const resolveToken = () => {
  if (process.env.DISCORD_BEARER_TOKEN != null && process.env.DISCORD_BEARER_TOKEN !== '') {
    return {
      token: process.env.DISCORD_BEARER_TOKEN,
      tokenType: 'Bearer',
    };
  }

  if (process.env.DISCORD_BOT_TOKEN != null && process.env.DISCORD_BOT_TOKEN !== '') {
    return {
      token: process.env.DISCORD_BOT_TOKEN,
      tokenType: process.env.DISCORD_TOKEN_TYPE || 'Bot',
    };
  }

  return {
    token: null,
    tokenType: process.env.DISCORD_TOKEN_TYPE || 'Bot',
  };
};

const writeError = (error: unknown, exitCode: number) => {
  const formatted = formatError(error, SOURCE_DIR);
  process.stdout.write(`${JSON.stringify(formatted)}\n`);
  if (exitCode === 1) {
    process.stderr.write(`Error: ${formatted.message}\nSuggestion: ${formatted.suggestion}\n`);
  }
  process.exit(exitCode);
};

program
  .name('nori-discord')
  .description(
    'CLI for the Discord REST API. Designed for coding agents.\n\nUsage: nori-discord <HTTP_METHOD> <PATH> [--param value ...]\n\nExamples:\n  nori-discord GET /channels/123/messages --limit 10\n  nori-discord POST /channels/123/messages --content "hello"\n  echo \'{"content":"hi"}\' | nori-discord POST /channels/123/messages --json-input'
  )
  .version('0.1.0');

program
  .command('list-routes')
  .description('List known Discord REST routes for discovery. Requests are not limited to this list.')
  .option('--resource <resource>', 'Filter by resource name, path, or description')
  .action((opts: { resource?: string }) => {
    process.stdout.write(JSON.stringify({ routes: listRoutes({ resource: opts.resource }) }) + '\n');
  });

program
  .command('describe <method> <path>')
  .description('Describe a known Discord REST route, or return fallback docs for unknown routes.')
  .action((method: string, routePath: string) => {
    process.stdout.write(JSON.stringify(describeRoute({ method, path: routePath })) + '\n');
  });

program
  .argument('<HTTP_METHOD>', 'Discord REST HTTP method, e.g. GET, POST, PATCH, PUT, DELETE')
  .argument('<PATH>', 'Discord REST path beginning with /, e.g. /channels/{channel_id}/messages')
  .option('--json-input', 'Read JSON body parameters from stdin')
  .option('--query-json <json>', 'Merge explicit query parameters from a JSON object')
  .option('--header-json <json>', 'Merge additional request headers from a JSON object')
  .option('--api-version <version>', 'Discord API version', '10')
  .option('--dry-run', 'Print the resolved request without calling Discord. Does not require a token.')
  .option('--no-auth', 'Send the request without an Authorization header')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .action(async (method: string, routePath: string, opts: Record<string, any>) => {
    try {
      const { token, tokenType } = resolveToken();
      let params: Record<string, unknown> = {};

      if (opts.jsonInput) {
        params = await readStdinJson();
      }

      const pathIndex = process.argv.indexOf(routePath);
      const rawArgs = pathIndex >= 0 ? process.argv.slice(pathIndex + 1) : [];
      params = { ...params, ...parseArgs(stripControlOptions(rawArgs)) };

      if (!opts.dryRun && opts.auth !== false && token == null) {
        throw { code: 'no_token' };
      }

      const built = buildDiscordRequest({
        method,
        path: routePath,
        params,
        query: parseJsonOption({ value: opts.queryJson, name: '--query-json' }),
        headers: parseJsonOption({ value: opts.headerJson, name: '--header-json' }),
        apiVersion: opts.apiVersion,
        token,
        tokenType,
        userAgent: USER_AGENT,
        noAuth: opts.auth === false,
      });

      if (opts.dryRun) {
        process.stdout.write(
          JSON.stringify({
            ok: true,
            dry_run: true,
            method: method.toUpperCase(),
            path: routePath,
            url: built.url,
            query: built.query,
            body: built.body,
            headers: sanitizeHeadersForOutput(built.headers),
            token_present: token != null,
            authorization_type: tokenType,
          }) + '\n'
        );
        return;
      }

      let response: Response;
      try {
        response = await fetch(built.url, built.init);
      } catch (error) {
        throw { code: 'request_error', message: (error as Error).message };
      }

      const text = await response.text();
      const responseBody = text.length > 0 ? JSON.parse(text) : null;

      if (!response.ok) {
        throw {
          code: 'discord_http_error',
          status: response.status,
          body: responseBody,
          retryAfter: response.headers.get('Retry-After'),
        };
      }

      process.stdout.write(JSON.stringify(responseBody ?? { ok: true }) + '\n');
    } catch (error) {
      const exitCode = (error as Record<string, unknown>)?.code === 'bad_usage' ? 2 : 1;
      writeError(error, exitCode);
    }
  });

if (process.argv.length <= 2) {
  process.stderr.write(program.helpInformation() + '\n');
  process.stderr.write('Error: missing required HTTP_METHOD and PATH arguments\n');
  process.stderr.write(`Source: ${SOURCE_DIR}\n`);
  process.exit(2);
}

program.parse();
