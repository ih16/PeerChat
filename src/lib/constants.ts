export const STORAGE_KEY = 'peer-chat-data';
export const RECONNECT_INTERVAL = 5000; // 5 seconds
export const DEFAULT_NAME = 'Anonymous';

export const EVENTS = {
  ALL_HISTORY: 'all-history',
  CHAT: 'chat',
  STATUS: 'status',
  NAME: 'name',
} as const;

export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
} as const;

export const ROLES = {
  HOST: 'host',
  CLIENT: 'client',
} as const;

export const PEER_ERRORS = {
  UNAVAILABLE_ID: 'unavailable-id',
} as const;

export const PEER_CONFIG = {
  config: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  },
};
