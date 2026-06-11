import { describe, expect, it } from 'vitest';
import { execFile, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, '../src/index.ts');
const PROJECT_ROOT = path.resolve(__dirname, '..');

// The /developers/docs/... URL shape 404s on the live Discord docs site.
const DOCS_URL_PATTERN = /^https:\/\/docs\.discord\.com\/developers\/(?!docs\/)/;

async function runCli(
  args: string[],
  env: Record<string, string> = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await exec('npx', ['tsx', CLI_PATH, ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, ...env },
      timeout: 10000,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code ?? 1,
    };
  }
}

async function runCliWithStdin(
  args: string[],
  stdinData: string,
  env: Record<string, string> = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', CLI_PATH, ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    child.on('close', (code: number | null) => {
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
    child.stdin.write(stdinData);
    child.stdin.end();
  });
}

describe('CLI integration', () => {
  it('exits with usage information when no request is provided', async () => {
    const result = await runCli([]);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('HTTP_METHOD');
  });

  it('returns a structured JSON error when no Discord token is configured', async () => {
    const result = await runCli(['GET', '/users/@me'], {
      DISCORD_BOT_TOKEN: '',
      DISCORD_BEARER_TOKEN: '',
    });

    expect(result.exitCode).toBe(1);
    const output = JSON.parse(result.stdout);
    expect(output.ok).toBe(false);
    expect(output.error).toBe('no_token');
    expect(output.source).toContain('nori-discord-cli');
  });

  it('dry-runs a GET request without requiring a token', async () => {
    const result = await runCli(['GET', '/channels/123/messages', '--dry-run', '--limit', '10'], {
      DISCORD_BOT_TOKEN: '',
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.ok).toBe(true);
    expect(output.dry_run).toBe(true);
    expect(output.method).toBe('GET');
    expect(output.path).toBe('/channels/123/messages');
    expect(output.url).toContain('/api/v10/channels/123/messages?limit=10');
    expect(output.token_present).toBe(false);
    expect(output.body).toBeUndefined();
  });

  it('dry-runs a POST request with stdin JSON and CLI overrides', async () => {
    const result = await runCliWithStdin(
      ['POST', '/channels/123/messages', '--dry-run', '--json-input', '--content', 'from cli'],
      JSON.stringify({ content: 'from stdin', tts: false }),
      { DISCORD_BOT_TOKEN: 'test-token' }
    );

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.body).toEqual({ content: 'from cli', tts: false });
    expect(output.token_present).toBe(true);
    expect(output.authorization_type).toBe('Bot');
  });

  it('supports explicit query and header JSON for ambiguous routes', async () => {
    const result = await runCli(
      [
        'POST',
        '/guilds/123/channels',
        '--dry-run',
        '--query-json',
        '{"reason":"setup"}',
        '--header-json',
        '{"X-Audit-Log-Reason":"setup"}',
      ],
      { DISCORD_BOT_TOKEN: 'test-token' }
    );

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.url).toContain('?reason=setup');
    expect(output.headers['X-Audit-Log-Reason']).toBe('setup');
  });

  it('lists known Discord routes for discovery without limiting requests to that list', async () => {
    const result = await runCli(['list-routes', '--resource', 'message']);

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.routes.length).toBeGreaterThan(0);
    expect(output.routes.some((route: any) => route.method === 'POST' && route.path === '/channels/{channel_id}/messages')).toBe(true);

    const all = await runCli(['list-routes']);
    expect(all.exitCode).toBe(0);
    for (const route of JSON.parse(all.stdout).routes) {
      expect(route.docs_url).toMatch(DOCS_URL_PATTERN);
    }
  });

  it('describes a known route and returns fallback docs for unknown routes', async () => {
    const known = await runCli(['describe', 'POST', '/channels/{channel_id}/messages']);
    expect(known.exitCode).toBe(0);
    const knownOutput = JSON.parse(known.stdout);
    expect(knownOutput.known).toBe(true);
    expect(knownOutput.docs_url).toBe('https://docs.discord.com/developers/resources/message#create-message');

    const unknown = await runCli(['describe', 'PATCH', '/new/discord/route']);
    expect(unknown.exitCode).toBe(0);
    const output = JSON.parse(unknown.stdout);
    expect(output.known).toBe(false);
    expect(output.docs_url).toMatch(DOCS_URL_PATTERN);
  });

  it('reports the package.json version from --version', async () => {
    const pkg = JSON.parse(readFileSync(path.resolve(PROJECT_ROOT, 'package.json'), 'utf8'));
    const result = await runCli(['--version']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(pkg.version);
  });
});
