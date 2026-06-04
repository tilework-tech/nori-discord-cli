export interface BuildDiscordRequestArgs {
  method: string;
  path: string;
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  headers: Record<string, unknown>;
  apiVersion: string;
  token?: string | null;
  tokenType?: string | null;
  userAgent: string;
  noAuth?: boolean | null;
}

export interface BuiltDiscordRequest {
  url: string;
  init: RequestInit;
  body?: Record<string, unknown>;
  query: Record<string, unknown>;
  headers: Record<string, string>;
}

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

const appendQueryValue = (params: URLSearchParams, key: string, value: unknown) => {
  if (value == null) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryValue(params, key, item);
    }
    return;
  }

  params.append(key, String(value));
};

const stringifyHeaders = (headers: Record<string, unknown>) => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value != null) result[key] = String(value);
  }
  return result;
};

export const buildDiscordRequest = (args: BuildDiscordRequestArgs): BuiltDiscordRequest => {
  const {
    method,
    path,
    params,
    query,
    headers,
    apiVersion,
    token,
    tokenType,
    userAgent,
    noAuth,
  } = args;
  const normalizedMethod = method.toUpperCase();

  if (!path.startsWith('/')) {
    throw new Error('Discord REST path must start with a leading slash.');
  }

  const body = BODY_METHODS.has(normalizedMethod) ? params : undefined;
  const resolvedQuery = BODY_METHODS.has(normalizedMethod) ? query : { ...params, ...query };
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedQuery)) {
    appendQueryValue(queryParams, key, value);
  }

  const url = `https://discord.com/api/v${apiVersion}${path}${queryParams.size > 0 ? `?${queryParams.toString()}` : ''}`;
  const resolvedHeaders: Record<string, string> = {
    'User-Agent': userAgent,
    ...stringifyHeaders(headers),
  };

  if (!noAuth && token) {
    resolvedHeaders.Authorization = `${tokenType ?? 'Bot'} ${token}`;
  }

  const init: RequestInit = {
    method: normalizedMethod,
    headers: resolvedHeaders,
  };

  if (body != null && Object.keys(body).length > 0) {
    resolvedHeaders['Content-Type'] = resolvedHeaders['Content-Type'] ?? 'application/json';
    init.body = JSON.stringify(body);
  }

  return {
    url,
    init,
    body,
    query: resolvedQuery,
    headers: resolvedHeaders,
  };
};

export const sanitizeHeadersForOutput = (headers: Record<string, string>) => {
  const result = { ...headers };
  if (result.Authorization != null) {
    result.Authorization = '[redacted]';
  }
  return result;
};
