export interface KnownRoute {
  method: string;
  path: string;
  resource: string;
  description: string;
  docs_url: string;
}

export const KNOWN_ROUTES: KnownRoute[] = [
  {
    method: 'GET',
    path: '/users/@me',
    resource: 'user',
    description: 'Get the current user object for the authenticated token.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/user#get-current-user',
  },
  {
    method: 'GET',
    path: '/guilds/{guild_id}',
    resource: 'guild',
    description: 'Get a guild by ID.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/guild#get-guild',
  },
  {
    method: 'GET',
    path: '/guilds/{guild_id}/channels',
    resource: 'channel',
    description: 'Get the channels for a guild.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/guild#get-guild-channels',
  },
  {
    method: 'POST',
    path: '/guilds/{guild_id}/channels',
    resource: 'channel',
    description: 'Create a guild channel.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/guild#create-guild-channel',
  },
  {
    method: 'GET',
    path: '/channels/{channel_id}',
    resource: 'channel',
    description: 'Get a channel by ID.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/channel#get-channel',
  },
  {
    method: 'GET',
    path: '/channels/{channel_id}/messages',
    resource: 'message',
    description: 'Get messages for a channel.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/message#get-channel-messages',
  },
  {
    method: 'GET',
    path: '/channels/{channel_id}/messages/{message_id}',
    resource: 'message',
    description: 'Get a channel message by ID.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/message#get-channel-message',
  },
  {
    method: 'POST',
    path: '/channels/{channel_id}/messages',
    resource: 'message',
    description: 'Create a message in a channel.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/message#create-message',
  },
  {
    method: 'PATCH',
    path: '/channels/{channel_id}/messages/{message_id}',
    resource: 'message',
    description: 'Edit a message.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/message#edit-message',
  },
  {
    method: 'DELETE',
    path: '/channels/{channel_id}/messages/{message_id}',
    resource: 'message',
    description: 'Delete a message.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/message#delete-message',
  },
  {
    method: 'PUT',
    path: '/channels/{channel_id}/messages/{message_id}/reactions/{emoji}/@me',
    resource: 'reaction',
    description: 'Create a reaction for the current user.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/message#create-reaction',
  },
  {
    method: 'POST',
    path: '/webhooks/{webhook_id}/{webhook_token}',
    resource: 'webhook',
    description: 'Execute a webhook.',
    docs_url: 'https://docs.discord.com/developers/docs/resources/webhook#execute-webhook',
  },
];

export const listRoutes = (args: { resource?: string | null }) => {
  const { resource } = args;
  if (resource == null || resource.length === 0) {
    return KNOWN_ROUTES;
  }

  const normalized = resource.toLowerCase();
  return KNOWN_ROUTES.filter(
    (route) =>
      route.resource.toLowerCase().includes(normalized) ||
      route.path.toLowerCase().includes(normalized) ||
      route.description.toLowerCase().includes(normalized)
  );
};

export const describeRoute = (args: { method: string; path: string }) => {
  const { method, path } = args;
  const normalizedMethod = method.toUpperCase();
  const route = KNOWN_ROUTES.find(
    (candidate) => candidate.method === normalizedMethod && candidate.path === path
  );

  if (route != null) {
    return {
      ok: true,
      known: true,
      ...route,
    };
  }

  return {
    ok: true,
    known: false,
    method: normalizedMethod,
    path,
    description:
      'No curated route metadata is available. The request command can still call this Discord REST route.',
    docs_url: 'https://docs.discord.com/developers/docs/reference',
  };
};
