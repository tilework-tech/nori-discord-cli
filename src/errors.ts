export interface CliError {
  ok: false;
  error: string;
  message: string;
  suggestion: string;
  source: string;
}

const suggestionForStatus = (args: { status: number; retryAfter?: unknown }) => {
  const { status, retryAfter } = args;

  if (status === 401) {
    return 'Check DISCORD_BOT_TOKEN or DISCORD_BEARER_TOKEN and the selected token type.';
  }
  if (status === 403) {
    return 'Check the bot permissions, OAuth scopes, guild membership, and channel visibility for this route.';
  }
  if (status === 404) {
    return 'Check the route path and Discord snowflake IDs. Use list-routes for common route shapes.';
  }
  if (status === 429) {
    return `Rate limited by Discord. Retry after ${retryAfter ?? 'the Retry-After value'} seconds and avoid exhausted buckets.`;
  }

  return 'Check the Discord REST API docs for this route and inspect the response body.';
};

export const formatError = (error: unknown, sourceDir: string): CliError => {
  const err = error as Record<string, any>;

  if (err?.code === 'no_token') {
    return {
      ok: false,
      error: 'no_token',
      message: 'No Discord token provided.',
      suggestion:
        'Set DISCORD_BOT_TOKEN for bot auth, or DISCORD_BEARER_TOKEN with DISCORD_TOKEN_TYPE=Bearer for OAuth REST calls.',
      source: sourceDir,
    };
  }

  if (err?.code === 'bad_usage') {
    return {
      ok: false,
      error: 'bad_usage',
      message: err.message ?? 'Invalid CLI usage.',
      suggestion: 'Run nori-discord --help and retry with an HTTP method and a leading-slash route path.',
      source: sourceDir,
    };
  }

  if (err?.code === 'discord_http_error') {
    const status = Number(err.status);
    const body = err.body as Record<string, any> | null | undefined;
    const discordMessage = typeof body?.message === 'string' ? body.message : `Discord HTTP ${status}`;
    const discordCode = body?.code != null ? ` (Discord code ${body.code})` : '';
    return {
      ok: false,
      error: `discord_http_${status}`,
      message: `${discordMessage}${discordCode}`,
      suggestion: suggestionForStatus({ status, retryAfter: body?.retry_after ?? err.retryAfter }),
      source: sourceDir,
    };
  }

  if (err?.code === 'request_error') {
    return {
      ok: false,
      error: 'request_error',
      message: `Network error: ${err.message ?? 'Unknown network error'}`,
      suggestion: 'Check network connectivity and retry. Use --dry-run to verify the resolved request first.',
      source: sourceDir,
    };
  }

  const message = err?.message ?? String(error);
  return {
    ok: false,
    error: 'unknown_error',
    message,
    suggestion: `Unexpected error. Check the CLI source at ${sourceDir} for details.`,
    source: sourceDir,
  };
};
