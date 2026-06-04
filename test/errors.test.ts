import { describe, expect, it } from 'vitest';
import { formatError } from '../src/errors.js';

describe('formatError', () => {
  it('returns structured JSON-ready errors with a source path', () => {
    const result = formatError(new Error('boom'), '/path/to/source');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('unknown_error');
    expect(result.message).toContain('boom');
    expect(result.suggestion).toContain('/path/to/source');
    expect(result.source).toBe('/path/to/source');
  });

  it('suggests setting DISCORD_BOT_TOKEN for missing token errors', () => {
    const result = formatError({ code: 'no_token' }, '/src');

    expect(result.error).toBe('no_token');
    expect(result.suggestion).toContain('DISCORD_BOT_TOKEN');
  });

  it('includes Discord response status, code, and retry timing', () => {
    const result = formatError(
      {
        code: 'discord_http_error',
        status: 429,
        body: { code: 0, message: 'You are being rate limited.', retry_after: 2.5 },
      },
      '/src'
    );

    expect(result.error).toBe('discord_http_429');
    expect(result.message).toContain('You are being rate limited');
    expect(result.suggestion).toContain('2.5');
  });
});
