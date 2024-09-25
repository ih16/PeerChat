import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import {
  CONNECTION_STATUS,
  DEFAULT_NAME,
  EVENTS,
  PEER_CONFIG,
  PEER_ERRORS,
  RECONNECT_INTERVAL,
  ROLES,
  STORAGE_KEY,
} from '@/lib/constants';
import {
  Event,
  AllHistoryMessage,
  AllHistoryPayload,
  ChatMessage,
  ChatPayload,
  Message,
  NameMessage,
  NamePayload,
  PeerState,
  StatusMessage,
  StatusPayload,
  UsePeerConnection,
} from '@/lib/types';

export function usePeerConnection(
  role: (typeof ROLES)[keyof typeof ROLES]
): UsePeerConnection {
  const [, forceUpdate] = useState({});
  const [online, setOnline] = useState(navigator.onLine);
  const [connecting, setConnecting] = useState(false);
  const [isConnectedToHost, setIsConnectedToHost] = useState(false);
  const peerState = useRef<PeerState>({
    peerId: null,
    connections: [],
    messages: [],
    name: DEFAULT_NAME,
  });
  const peerInstance = useRef<Peer | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const hostIdRef = useRef<string | null>(null);
  const recentConnections = useRef<Set<string>>(new Set());
  const connectionDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const saveData = useCallback(() => {
    const { peerId, name, messages } = peerState.current;
    const dataToStore = {
      peerId,
      name,
      messages: role === ROLES.HOST ? messages : [],
      lastHostId: hostIdRef.current,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  }, [role]);

  const loadStoredData = useCallback(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const { peerId, name, messages, lastHostId } = JSON.parse(storedData);
      peerState.current.name = name || DEFAULT_NAME;
      if (role === ROLES.HOST) {
        peerState.current.messages = messages || [];
      }
      if (role === ROLES.CLIENT && lastHostId) {
        hostIdRef.current = lastHostId;
      }
      return { peerId, name };
    }
    return null;
  }, [role]);

  const addMessage = useCallback(
    (message: Message) => {
      if (
        message.event === EVENTS.CHAT ||
        (message.event === EVENTS.STATUS && role === ROLES.HOST)
      ) {
        peerState.current.messages.push(message);
        if (role === ROLES.HOST) {
          saveData();
        }
        forceUpdate({});
      }
    },
    [role, saveData]
  );

  const handleIncomingData = useCallback(
    (conn: DataConnection, data: unknown) => {
      if (
        typeof data === 'object' &&
        data !== null &&
        'event' in data &&
        'payload' in data &&
        'timestamp' in data &&
        'sender' in data &&
        'senderName' in data
      ) {
        const message = data as Message;
        if (role === ROLES.HOST) {
          switch (message.event) {
            case EVENTS.CHAT:
              addMessage(message);
              peerState.current.connections.forEach((c) => {
                if (
                  c.peerId !== conn.peer &&
                  c.status === CONNECTION_STATUS.CONNECTED
                ) {
                  c.connection.send(message);
                }
              });
              break;
            case EVENTS.NAME:
              const updatedConnections = peerState.current.connections.map(
                (c) =>
                  c.peerId === conn.peer
                    ? { ...c, name: message.payload.name }
                    : c
              );
              peerState.current.connections = updatedConnections;
              forceUpdate({});
              break;
          }
        } else {
          switch (message.event) {
            case EVENTS.ALL_HISTORY:
              peerState.current.messages = message.payload.messages;
              forceUpdate({});
              break;
            case EVENTS.CHAT:
              addMessage(message);
              break;
          }
        }
      }
    },
    [role, addMessage]
  );

  const handleConnection = useCallback(
    (conn: DataConnection) => {
      let clientName = DEFAULT_NAME;

      const updateClientName = (name: string) => {
        clientName = name;
        peerState.current.connections = peerState.current.connections.map(
          (c) => (c.peerId === conn.peer ? { ...c, name } : c)
        );

        if (role === ROLES.HOST) {
          if (!recentConnections.current.has(conn.peer)) {
            recentConnections.current.add(conn.peer);

            setTimeout(() => {
              recentConnections.current.delete(conn.peer);
            }, 5000);

            if (connectionDebounceTimer.current) {
              clearTimeout(connectionDebounceTimer.current);
            }

            connectionDebounceTimer.current = setTimeout(() => {
              const statusMessage: StatusMessage = {
                event: EVENTS.STATUS,
                payload: {
                  status: CONNECTION_STATUS.CONNECTED,
                  clientId: conn.peer,
                  clientName: name,
                },
                timestamp: Date.now(),
                sender: peerState.current.peerId!,
                senderName: peerState.current.name,
              };
              addMessage(statusMessage);
            }, 1000);
          }
        }

        forceUpdate({});
      };

      conn.on('open', () => {
        peerState.current.connections = [
          ...peerState.current.connections.filter(
            (c) => c.peerId !== conn.peer
          ),
          {
            peerId: conn.peer,
            name: clientName,
            connection: conn,
            status: CONNECTION_STATUS.CONNECTED,
          },
        ];

        if (role === ROLES.HOST) {
          const historyMessage: AllHistoryMessage = {
            event: EVENTS.ALL_HISTORY,
            payload: { messages: peerState.current.messages },
            timestamp: Date.now(),
            sender: peerState.current.peerId!,
            senderName: peerState.current.name,
          };
          conn.send(historyMessage);
        } else if (role === ROLES.CLIENT) {
          const nameMessage: NameMessage = {
            event: EVENTS.NAME,
            payload: { name: peerState.current.name },
            timestamp: Date.now(),
            sender: peerState.current.peerId!,
            senderName: peerState.current.name,
          };
          conn.send(nameMessage);
          setIsConnectedToHost(true);
        }

        setConnecting(false);
        forceUpdate({});
      });

      conn.on('data', (data) => {
        if (typeof data === 'object' && data !== null && 'event' in data) {
          const message = data as Message;
          if (message.event === EVENTS.NAME && role === ROLES.HOST) {
            updateClientName(message.payload.name);
          } else {
            handleIncomingData(conn, data);
          }
        }
      });

      conn.on('close', () => {
        const closedConnection = peerState.current.connections.find(
          (c) => c.peerId === conn.peer
        );
        peerState.current.connections = peerState.current.connections.filter(
          (c) => c.peerId !== conn.peer
        );
        if (role === ROLES.CLIENT && conn.peer === hostIdRef.current) {
          scheduleReconnect();
          setIsConnectedToHost(false);
        } else if (role === ROLES.HOST && closedConnection) {
          recentConnections.current.delete(conn.peer);

          const statusMessage: StatusMessage = {
            event: EVENTS.STATUS,
            payload: {
              status: CONNECTION_STATUS.DISCONNECTED,
              clientId: conn.peer,
              clientName: closedConnection.name,
            },
            timestamp: Date.now(),
            sender: peerState.current.peerId!,
            senderName: peerState.current.name,
          };
          addMessage(statusMessage);
        }

        forceUpdate({});
      });
    },
    [role, handleIncomingData, addMessage]
  );

  const initializePeer = useCallback(
    (storedPeerId?: string) => {
      if (!navigator.onLine) {
        console.log('No internet connection. Skipping peer initialization.');
        setOnline(false);
        setConnecting(false);
        return;
      }

      setOnline(false);
      setConnecting(true);
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }

      const peer = storedPeerId
        ? new Peer(storedPeerId, PEER_CONFIG)
        : new Peer(PEER_CONFIG);

      peer.on('open', (id) => {
        peerState.current.peerId = id;
        saveData();
        setOnline(true);
        setConnecting(false);
        forceUpdate({});

        if (role === ROLES.CLIENT && hostIdRef.current) {
          connectToHost(hostIdRef.current);
        }
      });

      if (role === ROLES.HOST) {
        peer.on('connection', handleConnection);
      }

      peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        setConnecting(false);
        if (err.type === PEER_ERRORS.UNAVAILABLE_ID && navigator.onLine) {
          console.log('ID unavailable, creating new ID');
          initializePeer();
        } else if (role === ROLES.CLIENT) {
          setIsConnectedToHost(false);
          scheduleReconnect();
        }
      });

      peer.on('disconnected', () => {
        setConnecting(false);
        if (role === ROLES.CLIENT) {
          setIsConnectedToHost(false);
          if (navigator.onLine) {
            scheduleReconnect();
          }
        }
      });

      peerInstance.current = peer;
    },
    [role, handleConnection, saveData]
  );

  const connectToHost = useCallback(
    (hostId: string) => {
      if (role === ROLES.CLIENT) {
        hostIdRef.current = hostId;
        saveData();
        setConnecting(true);

        const attemptConnection = () => {
          if (!peerInstance.current || peerInstance.current.disconnected) {
            initializePeer(peerState.current.peerId!);

            peerInstance.current?.on('open', () => {
              const conn = peerInstance.current!.connect(hostId);
              handleConnection(conn);
            });
          } else {
            const conn = peerInstance.current.connect(hostId);
            handleConnection(conn);
          }
        };

        if (navigator.onLine) {
          attemptConnection();
        } else {
          const onlineHandler = () => {
            window.removeEventListener('online', onlineHandler);
            attemptConnection();
          };
          window.addEventListener('online', onlineHandler);
        }
      }
    },
    [role, handleConnection, saveData, initializePeer]
  );

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    reconnectTimeout.current = setTimeout(() => {
      if (role === ROLES.CLIENT && hostIdRef.current && navigator.onLine) {
        console.log(`Attempting to reconnect to host: ${hostIdRef.current}`);
        connectToHost(hostIdRef.current);
      }
    }, RECONNECT_INTERVAL);
  }, [role, connectToHost]);

  const sendMessage = useCallback(
    (
      event: Event,
      payload: ChatPayload | StatusPayload | NamePayload | AllHistoryPayload
    ) => {
      if (!navigator.onLine) {
        console.log('No internet connection. Message not sent.');
        return;
      }

      const message: Message = {
        event,
        payload,
        timestamp: Date.now(),
        sender: peerState.current.peerId!,
        senderName: peerState.current.name,
      } as Message;

      if (event === EVENTS.CHAT) {
        addMessage(message as ChatMessage);
      }

      let messageSent = false;

      if (role === ROLES.HOST) {
        peerState.current.connections.forEach((conn) => {
          if (conn.status === CONNECTION_STATUS.CONNECTED) {
            try {
              conn.connection.send(message);
              messageSent = true;
            } catch (error) {
              console.error('Failed to send message:', error);
            }
          }
        });
      } else if (peerState.current.connections.length > 0) {
        try {
          peerState.current.connections[0].connection.send(message);
          messageSent = true;
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      }

      if (!messageSent && role === ROLES.CLIENT) {
        setIsConnectedToHost(false);
      }
    },
    [role, addMessage]
  );

  const handleOnline = useCallback(() => {
    setOnline(true);
    if (!peerInstance.current || !peerInstance.current.id) {
      initializePeer(peerState.current.peerId || undefined);
    } else {
      peerInstance.current.reconnect();
    }
  }, [initializePeer]);

  const handleOffline = useCallback(() => {
    setOnline(false);
    setConnecting(false);
  }, []);

  const reset = useCallback(() => {
    if (peerInstance.current) {
      peerInstance.current.destroy();
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    peerState.current = {
      peerId: null,
      connections: [],
      messages: [],
      name: DEFAULT_NAME,
    };
    hostIdRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
    setOnline(navigator.onLine);
    setConnecting(false);
    setIsConnectedToHost(false);
    forceUpdate({});
    initializePeer();
  }, [initializePeer]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const storedData = loadStoredData();
    if (navigator.onLine) {
      if (storedData && storedData.peerId) {
        initializePeer(storedData.peerId);
      } else {
        initializePeer();
      }
    } else {
      setOnline(false);
      setConnecting(false);
    }

    let reconnectInterval: NodeJS.Timeout | null = null;
    if (role === ROLES.CLIENT) {
      reconnectInterval = setInterval(() => {
        if (
          navigator.onLine &&
          peerState.current.connections.length === 0 &&
          hostIdRef.current
        ) {
          console.log('No active connections, attempting to reconnect...');
          connectToHost(hostIdRef.current);
        }
      }, RECONNECT_INTERVAL);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
      if (connectionDebounceTimer.current) {
        clearTimeout(connectionDebounceTimer.current);
      }
    };
  }, [
    loadStoredData,
    initializePeer,
    role,
    connectToHost,
    handleOnline,
    handleOffline,
  ]);

  const setName = useCallback(
    (newName: string) => {
      peerState.current.name = newName;
      saveData();
      forceUpdate({});

      const nameMessage: NameMessage = {
        event: EVENTS.NAME,
        payload: { name: newName },
        timestamp: Date.now(),
        sender: peerState.current.peerId!,
        senderName: newName,
      };

      if (role === ROLES.HOST) {
        peerState.current.connections.forEach((conn) => {
          if (conn.status === CONNECTION_STATUS.CONNECTED) {
            conn.connection.send(nameMessage);
          }
        });
      } else if (peerState.current.connections.length > 0) {
        peerState.current.connections[0].connection.send(nameMessage);
      }
    },
    [role, saveData]
  );

  return {
    peerId: peerState.current.peerId,
    connections: peerState.current.connections,
    messages: peerState.current.messages,
    sendMessage,
    setName,
    name: peerState.current.name,
    connectedHostId: role === ROLES.CLIENT ? hostIdRef.current : null,
    online,
    connecting,
    isConnectedToHost,
    reset,
    ...(role === ROLES.CLIENT && { connectToHost }),
  };
}
