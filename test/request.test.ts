import { describe, expect, it } from 'vitest';
import { buildDiscordRequest } from '../src/request.js';

describe('buildDiscordRequest', () => {
  it('routes GET params to the query string and omits request body', () => {
    const request = buildDiscordRequest({
      method: 'GET',
      path: '/channels/123/messages',
      params: { limit: 10, before: '987654321098765432' },
      query: {},
      headers: {},
      apiVersion: '10',
      token: 'bot-token',
      tokenType: 'Bot',
      userAgent: 'nori-discord-cli/test',
    });

    expect(request.url).toBe('https://discord.com/api/v10/channels/123/messages?limit=10&before=987654321098765432');
    expect(request.init.method).toBe('GET');
    expect(request.init.body).toBeUndefined();
    expect(request.init.headers).toMatchObject({
      Authorization: 'Bot bot-token',
      'User-Agent': 'nori-discord-cli/test',
    });
  });

  it('routes POST params to a JSON body while preserving explicit query params', () => {
    const request = buildDiscordRequest({
      method: 'POST',
      path: '/channels/123/messages',
      params: { content: 'hello' },
      query: { wait: true },
      headers: {},
      apiVersion: '10',
      token: 'bot-token',
      tokenType: 'Bot',
      userAgent: 'nori-discord-cli/test',
    });

    expect(request.url).toBe('https://discord.com/api/v10/channels/123/messages?wait=true');
    expect(request.init.body).toBe(JSON.stringify({ content: 'hello' }));
    expect(request.init.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
  });

  it('rejects paths without a leading slash so dry-runs do not hide malformed routes', () => {
    expect(() =>
      buildDiscordRequest({
        method: 'GET',
        path: 'channels/123/messages',
        params: {},
        query: {},
        headers: {},
        apiVersion: '10',
        token: 'bot-token',
        tokenType: 'Bot',
        userAgent: 'nori-discord-cli/test',
      })
    ).toThrow('leading slash');
  });
});
