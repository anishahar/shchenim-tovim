import { memo, type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { socket } from '../socket';
import type { Message } from '@typesLib';

const AVATAR_COLORS = ['#01696f', '#437a22', '#7a39bb', '#da7101', '#006494', '#a13544'] as const;

type MessageApiResponse = Omit<Message, 'createdAt'> & {
  createdAt: string;
};

type SocketMessagePayload = {
  id?: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string | Date;
};

type SocketAck = {
  ok: boolean;
  error?: string;
};

type RequestStatus = 'open' | 'in_progress' | 'completed';

type ChatMeta = {
  id: number;
  request: {
    id: number;
    title: string;
    status: RequestStatus;
  } | null;
  otherUser: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
};

type ChatApiResponse = ChatMeta & {
  createdAt: string;
  updatedAt: string;
};

type RequestDetailsResponse = {
  user_id: number;
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'פתוחה',
  in_progress: 'בטיפול',
  completed: 'הושלמה',
};

const STATUS_STYLES: Record<RequestStatus, CSSProperties> = {
  open: { background: 'rgba(218,113,1,0.12)', color: '#da7101' },
  in_progress: { background: 'rgba(1,105,111,0.10)', color: '#01696f' },
  completed: { background: 'rgba(67,122,34,0.12)', color: '#437a22' },
};

const REQUEST_STATUS_OPTIONS: RequestStatus[] = ['open', 'in_progress', 'completed'];

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeMessage(message: MessageApiResponse): Message {
  return {
    ...message,
    createdAt: new Date(message.createdAt),
  };
}

function normalizeSocketMessage(message: SocketMessagePayload): Message {
  return {
    id: message.id ?? Date.now(),
    chatId: message.chatId,
    senderId: message.senderId,
    content: message.content,
    createdAt: new Date(message.createdAt),
  };
}

function Avatar({
  name,
  url,
  userId,
  size = 50,
}: {
  name: string;
  url?: string;
  userId: number;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getAvatarColor(userId),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 14,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <div
      role="listitem"
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-start' : 'flex-end',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          padding: '10px 12px',
          borderRadius: 16,
          background: isOwn ? '#dff3f0' : '#ffffff',
          color: '#28251d',
          border: '1px solid rgba(40,37,29,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </p>

        <time
          dateTime={message.createdAt.toISOString()}
          style={{
            display: 'block',
            marginTop: 6,
            fontSize: 11,
            color: '#7a7974',
            textAlign: 'left',
          }}
        >
          {formatMessageTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
});

export default function ChatRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const chatId = Number(id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [chatMeta, setChatMeta] = useState<ChatMeta | null>(null);
  const [requestOwnerId, setRequestOwnerId] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchChatMeta() {
      if (!chatId || Number.isNaN(chatId)) return;

      try {
        const response = await api.get<ChatApiResponse[]>('/chats');
        const currentChat = response.data.find((chat) => chat.id === chatId);
        setChatMeta(currentChat ?? null);

        if (!currentChat?.request) {
          setRequestOwnerId(null);
          return;
        }

        try {
          const requestResponse = await api.get<RequestDetailsResponse>(
            `/requests/${currentChat.request.id}`
          );
          setRequestOwnerId(requestResponse.data.user_id);
        } catch (err) {
          console.error('Failed to fetch request owner:', err);
          setRequestOwnerId(null);
        }
      } catch (err) {
        console.error('Failed to fetch chat details:', err);
        setChatMeta(null);
        setRequestOwnerId(null);
      }
    }

    fetchChatMeta();
  }, [chatId]);

  useEffect(() => {
    async function fetchMessages() {
      if (!chatId || Number.isNaN(chatId)) {
        setError('צ׳אט לא תקין');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get<MessageApiResponse[]>(`/chats/${chatId}/messages`);

        const normalizedMessages = response.data
          .map(normalizeMessage)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        setMessages(normalizedMessages);
      } catch (err) {
        console.error('Failed to fetch chat messages:', err);
        setError('לא הצלחנו לטעון את ההודעות');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    if (!user || !chatId || Number.isNaN(chatId)) return;

    function handleConnect() {
      setIsSocketConnected(true);
      setSocketError(null);
      joinChatRoom();
    }

    function handleDisconnect() {
      setIsSocketConnected(false);
      setSocketError('החיבור לצ׳אט נותק');
    }

    function handleBootstrapError(errorCode: string) {
      setIsSocketConnected(false);
      setSocketError(`שגיאה בחיבור לצ׳אט: ${errorCode}`);
    }

    function handleConnectError(error: Error) {
      setIsSocketConnected(false);
      setSocketError(error.message || 'החיבור לצ׳אט נכשל');
    }

    function joinChatRoom() {
      socket.emit('join_chat', chatId, (response: SocketAck) => {
        if (!response?.ok) {
          setSocketError(response?.error || 'לא ניתן להצטרף לצ׳אט');
          return;
        }

        setSocketError(null);
      });
    }

    function handleNewMessage(message: SocketMessagePayload) {
      if (message.chatId !== chatId) return;

      const normalizedMessage = normalizeSocketMessage(message);

      setMessages((prev) => {
        const exists = prev.some((item) => item.id === normalizedMessage.id);

        if (exists) {
          return prev;
        }

        return [...prev, normalizedMessage].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
      });
    }

    setIsSocketConnected(socket.connected);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('bootstrap_error', handleBootstrapError);
    socket.on('new_message', handleNewMessage);

    if (socket.connected) {
      joinChatRoom();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('bootstrap_error', handleBootstrapError);
      socket.off('new_message', handleNewMessage);
    };
  }, [chatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();

    if (!trimmed || !chatId || Number.isNaN(chatId) || !user || !socket.connected) {
      return;
    }

    socket.emit(
      'send_message',
      {
        chatId,
        content: trimmed,
      },
      (response: SocketAck) => {
        if (!response?.ok) {
          setSocketError(response?.error || 'שליחת ההודעה נכשלה');
          return;
        }

        setInput('');
        setSocketError(null);
      }
    );
  }, [input, chatId, user]);

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleStatusChange(nextStatus: RequestStatus) {
    if (!chatMeta?.request || nextStatus === chatMeta.request.status) return;

    try {
      setIsUpdatingStatus(true);
      await api.patch(`/requests/${chatMeta.request.id}`, { status: nextStatus });
      setChatMeta((prev) =>
        prev?.request
          ? {
              ...prev,
              request: {
                ...prev.request,
                status: nextStatus,
              },
            }
          : prev
      );
    } catch (err) {
      console.error('Failed to update request status:', err);
      setSocketError('לא הצלחנו לעדכן את סטטוס הבקשה');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const canSend = input.trim().length > 0 && !!user && isSocketConnected;
  const headerTitle = chatMeta?.request?.title ?? `צ׳אט #${chatId}`;

  const otherUserName = chatMeta?.otherUser.name ?? `צ׳אט ${chatId}`;
  const canChangeStatus = !!chatMeta?.request && requestOwnerId === user?.id;

  return (
    <div
      dir="rtl"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <section
        aria-label="חדר צ׳אט"
        style={{
          width: '100%',
          maxWidth: 760,
          minHeight: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          border: '1px solid rgba(40,37,29,0.10)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        }}
      >
        <header
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(40,37,29,0.08)',
            background: '#fcfbf9',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <button
            onClick={() => navigate('/chats')}
            aria-label="חזרה לשיחות"
            title="חזרה לשיחות"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 18,
              color: '#1f3f8c',
              fontWeight: 700,
              flexShrink: 0,
              padding: '4px 6px',
              borderRadius: 6,
            }}
          >
            ←
          </button>

          <Avatar
            name={otherUserName}
            url={chatMeta?.otherUser.avatarUrl}
            userId={chatMeta?.otherUser.id ?? (chatId || 1)}
            size={50}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: chatMeta?.request ? 0 : 18,
                fontWeight: 800,
                color: '#1f3f8c',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {chatMeta?.request && (
                <span style={{ fontSize: 18 }}>{`${otherUserName} - ${headerTitle}`}</span>
              )}
              {otherUserName}
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: '#5e5a53',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {isSocketConnected ? 'מחובר לצ׳אט' : 'מנותק מהצ׳אט'}
            </div>
          </div>

          {chatMeta?.request && (
            <div
              style={{
                marginInlineStart: 'auto',
                flexShrink: 0,
              }}
            >
              {canChangeStatus ? (
                <select
                  value={chatMeta.request.status}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as RequestStatus)}
                  aria-label="עדכון סטטוס הבקשה"
                  title="עדכון סטטוס הבקשה"
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    cursor: isUpdatingStatus ? 'wait' : 'pointer',
                    fontSize: 14,
                    fontWeight: 800,
                    padding: '8px 14px',
                    outline: 'none',
                    ...STATUS_STYLES[chatMeta.request.status],
                  }}
                >
                  {REQUEST_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 800,
                    padding: '8px 14px',
                    ...STATUS_STYLES[chatMeta.request.status],
                  }}
                >
                  {STATUS_LABELS[chatMeta.request.status]}
                </span>
              )}
            </div>
          )}
        </header>

        {socketError && (
          <div
            style={{
              padding: '10px 16px',
              background: '#fff4e5',
              color: '#8a4b00',
              fontSize: 13,
              borderBottom: '1px solid rgba(138,75,0,0.15)',
            }}
          >
            {socketError}
          </div>
        )}

        <main
          role="list"
          aria-label="הודעות"
          style={{
            flex: 1,
            padding: '18px 16px',
            background: '#f8f5f1',
            overflowY: 'auto',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#7a7974' }}>טוען הודעות...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#a13544' }}>{error}</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#7a7974' }}>
              עדיין אין הודעות בשיחה הזאת
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={`${message.id}-${message.createdAt.getTime()}`}
                message={message}
                isOwn={message.senderId === user?.id}
              />
            ))
          )}

          <div ref={messagesEndRef} />
        </main>

        <footer
          style={{
            padding: '14px 16px',
            borderTop: '1px solid rgba(40,37,29,0.08)',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              placeholder={isSocketConnected ? 'כתוב הודעה...' : 'אין חיבור לצ׳אט'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={!isSocketConnected}
              aria-label="הודעה חדשה"
              style={{
                flex: 1,
                padding: '12px 14px',
                border: '1px solid rgba(40,37,29,0.14)',
                borderRadius: 12,
                background: isSocketConnected ? '#f6f3ef' : '#eeeeee',
                fontSize: 14,
                color: '#28251d',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <button
              onClick={handleSend}
              disabled={!canSend}
              aria-label="שלח הודעה"
              style={{
                border: 'none',
                background: canSend ? '#1f3f8c' : '#b8c2df',
                color: '#ffffff',
                padding: '12px 18px',
                borderRadius: 12,
                cursor: canSend ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              שלח
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
