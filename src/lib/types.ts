import { DataConnection } from 'peerjs';
import { CONNECTION_STATUS, EVENTS } from './constants';

export type Event = (typeof EVENTS)[keyof typeof EVENTS];
export type ConnectionStatus =
  (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

export interface ChatPayload {
  content: string;
}

export interface StatusPayload {
  status: ConnectionStatus;
  clientId: string;
  clientName: string;
}

export interface NamePayload {
  name: string;
}

export interface AllHistoryPayload {
  messages: Message[];
}

// Define message types using discriminated unions
export interface ChatMessage {
  event: typeof EVENTS.CHAT;
  payload: ChatPayload;
  timestamp: number;
  sender: string;
  senderName: string;
}

export interface StatusMessage {
  event: typeof EVENTS.STATUS;
  payload: StatusPayload;
  timestamp: number;
  sender: string;
  senderName: string;
}

export interface NameMessage {
  event: typeof EVENTS.NAME;
  payload: NamePayload;
  timestamp: number;
  sender: string;
  senderName: string;
}

export interface AllHistoryMessage {
  event: typeof EVENTS.ALL_HISTORY;
  payload: AllHistoryPayload;
  timestamp: number;
  sender: string;
  senderName: string;
}

// Union of all message types
export type Message =
  | ChatMessage
  | StatusMessage
  | NameMessage
  | AllHistoryMessage;

export interface Connection {
  peerId: string;
  name: string;
  connection: DataConnection;
  status: ConnectionStatus;
}

export interface PeerState {
  peerId: string | null;
  connections: Connection[];
  messages: Message[];
  name: string;
}

export interface UsePeerConnection {
  peerId: string | null;
  connections: Connection[];
  messages: Message[];
  sendMessage: (
    event: Event,
    payload: ChatPayload | StatusPayload | NamePayload | AllHistoryPayload
  ) => void;
  setName: (name: string) => void;
  name: string;
  connectToHost?: (hostId: string) => void;
  connectedHostId: string | null;
  online: boolean;
  connecting: boolean;
  reset: () => void;
  isConnectedToHost: boolean;
}

export type PeerErrorTypes =
  | 'unavailable-id'
  | 'disconnected'
  | 'browser-incompatible'
  | 'invalid-id'
  | 'invalid-key'
  | 'network'
  | 'peer-unavailable'
  | 'ssl-unavailable'
  | 'server-error'
  | 'socket-error'
  | 'socket-closed'
  | 'webrtc';
