import { memo, type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { socket } from '../socket';
import type { Chat, Message, RequestStatus } from '@typesLib';

const AVATAR_COLORS = ['#01696f', '#437a22', '#7a39bb', '#da7101', '#006494', '#a13544'] as const;
const CHAT_META_REFRESH_INTERVAL_MS = 5000;

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

type ChatMeta = Pick<Chat, 'id' | 'request' | 'otherUser' | 'refusedHelpAt'>;

type ChatApiResponse = Omit<Chat, 'createdAt' | 'updatedAt' | 'refusedHelpAt'> & {
  createdAt: string;
  updatedAt: string;
  refusedHelpAt?: string | null;
};

type RequestDetailsResponse = {
  user: { id: number };
  description: string;
  category: string;
  urgency: string;
};

const URGENCY_LABELS: Record<string, string> = {
  high: 'דחיפות גבוהה',
  medium: 'דחיפות בינונית',
  low: 'דחיפות נמוכה',
};

const URGENCY_STYLES: Record<string, { background: string; color: string }> = {
  high:   { background: 'rgba(220,38,38,0.10)',  color: '#dc2626' },
  medium: { background: 'rgba(217,119,6,0.10)',  color: '#b45309' },
  low:    { background: 'rgba(22,163,74,0.10)',   color: '#16a34a' },
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

function isValidChatId(chatId: number): boolean {
  return Number.isFinite(chatId) && chatId > 0;
}

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

function normalizeChatMeta(chat: ChatApiResponse): ChatMeta {
  return {
    id: chat.id,
    otherUser: chat.otherUser,
    request: chat.request,
    refusedHelpAt: chat.refusedHelpAt ? new Date(chat.refusedHelpAt) : null,
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

function SystemNotice({ text, date }: { text: string; date?: Date | null }) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '8px 0 14px',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          borderRadius: 999,
          background: 'rgba(40,37,29,0.08)',
          color: '#5e5a53',
          fontSize: 12,
          fontWeight: 700,
          padding: '7px 12px',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        {text}
        {date && (
          <span style={{ marginInlineStart: 6, fontWeight: 500 }}>
            {formatMessageTime(date)}
          </span>
        )}
      </div>
    </div>
  );
}

function RatingModal({
  helperName,
  onSubmit,
  isSubmitting,
}: {
  helperName: string;
  onSubmit: (score: number) => void;
  isSubmitting: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const display = hovered || selected;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div dir="rtl" style={{
        background: '#fff', borderRadius: 18, padding: '32px 28px',
        maxWidth: 360, width: '90%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1f3f8c', marginBottom: 8 }}>
          דרג את {helperName}
        </h2>
        <p style={{ fontSize: 14, color: '#7a7974', marginBottom: 24 }}>
          כיצד הייתה חוויית העזרה שלך?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isSubmitting}
              onClick={() => setSelected(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: 'none', border: 'none',
                cursor: isSubmitting ? 'wait' : 'pointer', fontSize: 36,
                color: star <= display ? '#f5a623' : '#d1cfc9',
                transition: 'color 0.1s', padding: 0,
              }}
            >★</button>
          ))}
        </div>
        <button
          type="button"
          disabled={selected === 0 || isSubmitting}
          onClick={() => onSubmit(selected)}
          style={{
            width: '100%', background: selected > 0 ? '#1f3f8c' : '#d1cfc9',
            color: '#fff', border: 'none', borderRadius: 999, padding: '12px 0',
            fontSize: 15, fontWeight: 800,
            cursor: selected > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
            marginBottom: 10,
          }}
        >
          {isSubmitting ? 'שומר...' : 'שמור דירוג'}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onSubmit(0)}
          style={{
            background: 'none', border: 'none', color: '#7a7974',
            fontSize: 13, cursor: isSubmitting ? 'wait' : 'pointer',
            textDecoration: 'underline',
          }}
        >
          דלג, לא עכשיו
        </button>
      </div>
    </div>
  );
}

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
  const [requestSnippet, setRequestSnippet] = useState<{ description: string; urgency: string; category: string } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const markChatAsRead = useCallback(async () => {
    if (!isValidChatId(chatId)) return;

    try {
      await api.patch(`/chats/${chatId}/mark-as-read`);
    } catch (err) {
      console.error(`Failed to mark chat ${chatId} as read:`, err);
    }
  }, [chatId]);

  const fetchChatMeta = useCallback(async () => {
    if (!isValidChatId(chatId)) return;

    try {
      const response = await api.get<ChatApiResponse[]>('/chats');
      const currentChat = response.data.find((chat) => chat.id === chatId);
      setChatMeta(currentChat ? normalizeChatMeta(currentChat) : null);

      if (!currentChat?.request) {
        setRequestOwnerId(null);
        return;
      }

      try {
        const requestResponse = await api.get<RequestDetailsResponse>(
          `/requests/${currentChat.request.id}`
        );
        setRequestOwnerId(requestResponse.data.user.id);
        setRequestSnippet({
          description: requestResponse.data.description,
          urgency: requestResponse.data.urgency,
          category: requestResponse.data.category,
        });
      } catch (err) {
        console.error('Failed to fetch request owner:', err);
        setRequestOwnerId(null);
      }
    } catch (err) {
      console.error('Failed to fetch chat details:', err);
      setChatMeta(null);
      setRequestOwnerId(null);
    }
  }, [chatId]);

  useEffect(() => {
    fetchChatMeta();

    const intervalId = window.setInterval(fetchChatMeta, CHAT_META_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchChatMeta]);

  useEffect(() => {
    async function fetchMessages() {
      if (!isValidChatId(chatId)) {
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
        markChatAsRead();
      } catch (err) {
        console.error('Failed to fetch chat messages:', err);
        setError('לא הצלחנו לטעון את ההודעות');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [chatId, markChatAsRead]);

  useEffect(() => {
    if (!user || !isValidChatId(chatId)) return;

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
      markChatAsRead();

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
  }, [chatId, markChatAsRead, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();

    if (!trimmed || !isValidChatId(chatId) || !user || !socket.connected) {
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

  async function commitCompletion(score: number) {
    if (!chatMeta?.request) return;
    try {
      setIsSubmittingRating(true);
      await api.post(`/chats/${chatId}/complete`, { score });
      navigate('/chats');
    } catch (err) {
      console.error('Failed to complete request:', err);
      setSocketError('לא הצלחנו להשלים את הבקשה');
      setIsSubmittingRating(false);
    }
  }

  async function handleStatusChange(nextStatus: RequestStatus) {
    if (!chatMeta?.request || nextStatus === chatMeta.request.status) return;

    if (nextStatus === 'completed' && !confirm('האם אתה בטוח שברצונך לסגור את הבקשה')) {
      return;
    }

    try {
      setIsUpdatingStatus(true);

      if (nextStatus === 'completed') {
        setIsUpdatingStatus(false);
        setShowRatingModal(true);
        return;
      }

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

  async function handleRejectRequest() {
    if (!chatMeta?.request) return;

    if (!confirm('האם אתה בטוח רוצה לסרב לעזרה?')) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await api.patch(`/requests/${chatMeta.request.id}`, { status: 'open' });
      await api.delete(`/chats/${chatId}`);
      navigate('/chats');
    } catch (err) {
      console.error('Failed to reject request:', err);
      setSocketError('לא הצלחנו לסרב לעזרה');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const canSend = input.trim().length > 0 && !!user && isSocketConnected;
  const headerTitle = chatMeta?.request?.title ?? `צ׳אט #${chatId}`;
  const otherUserName = chatMeta?.otherUser.name ?? `צ׳אט ${chatId}`;
  const headerLabel = chatMeta?.request ? `${otherUserName} - ${headerTitle}` : otherUserName;
  const canChangeStatus = !!chatMeta?.request && requestOwnerId === user?.id;
  const showRefusedHelpNotice =
    !!chatMeta?.request && !!chatMeta.refusedHelpAt && requestOwnerId !== user?.id;

  return (
    <div
      dir="rtl"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
      }}
    >
      <section
        aria-label="חדר צ׳אט"
        style={{
          width: '100%',
          maxWidth: 760,
          height: '100%',
          minHeight: 0,
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
                fontSize: 18,
                fontWeight: 800,
                color: '#1f3f8c',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {headerLabel}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                  <button
                    type="button"
                    onClick={handleRejectRequest}
                    disabled={isUpdatingStatus}
                    style={{
                      border: '1px solid rgba(161,53,68,0.22)',
                      borderRadius: 999,
                      background: '#fff1f3',
                      color: '#a13544',
                      cursor: isUpdatingStatus ? 'wait' : 'pointer',
                      fontSize: 14,
                      fontWeight: 800,
                      padding: '8px 14px',
                    }}
                  >
                    סרב לעזרה
                  </button>
                </div>
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

        {chatMeta?.request && requestSnippet && (
          <div
            style={{
              padding: '10px 18px',
              background: '#eff6ff',
              borderBottom: '1px solid rgba(37,99,235,0.12)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1f3f8c' }}>
                📋 {chatMeta.request.title}
              </span>
              {requestSnippet.description && (
                <p style={{
                  margin: '3px 0 0',
                  fontSize: 12,
                  color: '#5e5a53',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {requestSnippet.description}
                </p>
              )}
            </div>
            {requestSnippet.urgency && URGENCY_STYLES[requestSnippet.urgency] && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 999,
                flexShrink: 0,
                ...URGENCY_STYLES[requestSnippet.urgency],
              }}>
                {URGENCY_LABELS[requestSnippet.urgency]}
              </span>
            )}
          </div>
        )}

        <main
          role="list"
          aria-label="הודעות"
          style={{
            flex: 1,
            minHeight: 0,
            padding: '18px 16px',
            background: '#f8f5f1',
            overflowY: 'auto',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#7a7974' }}>טוען הודעות...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#a13544' }}>{error}</div>
          ) : (
            <>
              {showRefusedHelpNotice && (
                <SystemNotice
                  text={`${otherUserName} סירב לעזרה`}
                  date={chatMeta?.refusedHelpAt}
                />
              )}

              {messages.length === 0 ? (
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
            </>
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

      {showRatingModal && chatMeta && (
        <RatingModal
          helperName={chatMeta.otherUser.name}
          onSubmit={commitCompletion}
          isSubmitting={isSubmittingRating}
        />
      )}
    </div>
  );
}
