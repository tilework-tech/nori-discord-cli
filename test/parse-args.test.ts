import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/parse-args.js';

describe('parseArgs', () => {
  it('converts kebab-case flags to snake_case and coerces JSON-safe values', () => {
    const result = parseArgs([
      '--channel-id',
      '123456789012345678',
      '--limit',
      '25',
      '--tts',
      'false',
      '--allowed-mentions',
      '{"parse":[]}',
      '--flag',
    ]);

    expect(result).toEqual({
      channel_id: '123456789012345678',
      limit: 25,
      tts: false,
      allowed_mentions: { parse: [] },
      flag: true,
    });
  });

  it('preserves snowflakes, leading zero strings, and decimal-like values as strings', () => {
    const result = parseArgs([
      '--guild-id',
      '123456789012345678',
      '--code',
      '007',
      '--timestamp',
      '1716000000.001200',
    ]);

    expect(result.guild_id).toBe('123456789012345678');
    expect(result.code).toBe('007');
    expect(result.timestamp).toBe('1716000000.001200');
  });
});
