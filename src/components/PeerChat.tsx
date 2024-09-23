import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePeerConnection } from '@/hooks/use-peer-connection';
import { cn, copyToClipboard } from '@/lib/utils';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import {
  RiEdit2Line,
  RiFileCopy2Line,
  RiLinkM,
  RiLoader3Fill,
  RiP2pLine,
  RiRefreshFill,
} from 'react-icons/ri';

const PeerChat: FC<{
  mode: 'host' | 'client';
}> = ({ mode }) => {
  const { toast } = useToast();
  const aliasRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const {
    peerId,
    name,
    setName,
    sendMessage,
    messages,
    connectToHost,
    connectedHostId,
    online,
    reset,
    connecting,
    isConnectedToHost,
    connections,
  } = usePeerConnection(mode);
  const [message, setMessage] = useState('');
  const [hostId, setHostId] = useState('');
  const handleEditAlias = () => {
    aliasRef.current?.attributes.removeNamedItem('disabled');
    aliasRef.current?.focus();
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage('chat', { content: message });
      setMessage('');
    }
  };

  const handleConnectToHost = () => {
    if (connectToHost && hostId) {
      connectToHost(hostId);
    }
  };

  const handlePeerIdCopy = () => {
    copyToClipboard(peerId || '');
    toast({
      title: 'Copied to clipboard',
      description: 'Peer ID copied to clipboard',
    });
  };

  const messagesLength = useMemo(() => messages.length, [messages?.length]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current?.scrollHeight,
      behavior: 'smooth',
    });
  }, [messagesLength]);

  useEffect(() => {
    if (connectedHostId) {
      setHostId(connectedHostId);
    }
  }, [connectedHostId]);

  useEffect(() => {
    document.title = `PeerChat - ${mode === 'host' ? 'Host' : 'Client'}`;
  }, []);

  return (
    <main className="container mx-auto flex h-svh max-h-dvh flex-col overflow-hidden py-4 lg:py-8">
      <header className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
          <RiP2pLine />
          <span>PeerChat</span>
          <span className="text-gray-500">
            - {mode === 'host' ? 'Host' : 'Client'}
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs font-bold uppercase">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              { 'bg-green-600': online },
              { 'bg-red-600': !online }
            )}
          />
          {online ? `Online(${connections?.length})` : 'Offline'}
        </div>
      </header>
      <div className="flex w-full flex-col gap-4 pb-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center">
          <div className="flex w-full items-center text-sm font-semibold text-gray-500 lg:text-base">
            <span className="text-nowrap">Peer ID:</span>
            <span className="w-[calc(100% - 8rem)] ml-1 overflow-hidden text-ellipsis text-nowrap font-mono text-gray-700">
              {peerId || (
                <div className="h-6 w-64 animate-pulse rounded bg-gray-200" />
              )}
            </span>
            {peerId ? (
              <>
                {mode === 'host' ? (
                  <RiFileCopy2Line
                    className="ml-1 h-6 w-6 cursor-pointer rounded bg-gray-100 p-1 text-xl text-black transition-all duration-200 ease-out hover:bg-black hover:text-white"
                    onClick={handlePeerIdCopy}
                  />
                ) : null}
                <Dialog>
                  <DialogTrigger>
                    <RiRefreshFill className="ml-1 h-6 w-6 cursor-pointer rounded bg-gray-100 p-1 text-xl text-black transition-all duration-200 ease-out hover:bg-black hover:text-white" />
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete your chat history and reinitiate your peer
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setHostId('');
                          reset();
                        }}
                      >
                        Reinitiate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <RiLoader3Fill className="ml-1 animate-spin text-lg" />
            )}
          </div>
        </div>
        {mode === 'client' && (
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Host ID"
              className={cn(
                'w-full',
                isConnectedToHost &&
                  'border-green-500 bg-green-50 text-green-900',
                !isConnectedToHost &&
                  !connecting &&
                  connectedHostId &&
                  'border-red-500 bg-red-50 text-red-900'
              )}
              value={hostId}
              onChange={(e) => setHostId(e.target.value)}
            />
            <Button onClick={handleConnectToHost}>
              {connecting ? (
                <>
                  Connecting{' '}
                  <RiLoader3Fill className="ml-1 animate-spin text-lg" />
                </>
              ) : (
                <>
                  Connect <RiLinkM className="ml-1 text-lg" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="w-full flex-1 overflow-hidden pt-2">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <div className="flex w-full gap-2 md:w-3/4 lg:w-1/2">
              <Input
                placeholder="Alias"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled
                ref={aliasRef}
                onBlur={() => aliasRef.current?.setAttribute('disabled', '')}
              />
              <Button size="icon" variant="default" onClick={handleEditAlias}>
                {peerId ? (
                  <RiEdit2Line className="text-base" />
                ) : (
                  <RiLoader3Fill className="ml-1 animate-spin text-lg" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden">
            <div
              ref={chatContainerRef}
              className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-md border p-4"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    'mb-2',
                    msg.sender === peerId ? 'text-right' : 'text-left'
                  )}
                >
                  {msg.event === 'status' ? (
                    <div className="text-center font-mono text-xs text-gray-400">
                      {msg.payload.clientName}{' '}
                      {msg.payload.status === 'connected'
                        ? 'connected'
                        : 'disconnected'}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex flex-col',
                        msg.sender === peerId && 'items-end'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block max-w-[75%] rounded-xl p-4 text-sm',
                          {
                            'bg-black text-white': msg.sender === peerId,
                            'bg-gray-300 text-gray-700':
                              msg.sender === 'system',
                            'bg-gray-200 text-gray-800':
                              msg.sender !== peerId && msg.sender !== 'system',
                          }
                        )}
                      >
                        {msg.event === 'chat' && msg.payload.content}
                      </span>
                      <div
                        className={cn(
                          'mt-1 flex items-baseline gap-1',
                          msg.sender === peerId ? 'pr-1' : 'pl-1'
                        )}
                      >
                        <small className="text-xs opacity-75">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </small>
                        <strong className="text-sm">
                          {msg.sender === peerId
                            ? 'You'
                            : msg.senderName || msg.sender}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex items-end gap-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && handleSendMessage()
              }
            />
          </CardFooter>
        </Card>
      </div>
    </main>
  );
};

export default PeerChat;
