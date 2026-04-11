import { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Chat, Message } from '@typesLib';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_USER_ID = 999;

const AVATAR_COLORS = [
  '#01696f',
  '#437a22',
  '#7a39bb',
  '#da7101',
  '#006494',
  '#a13544',
] as const;

const STATUS_LABELS: Record<NonNullable<Chat['request']>['status'], string> = {
  open: 'פתוחה',
  in_progress: 'בטיפול',
  completed: 'הושלמה',
};

// ─── Mock Data (UI only) ──────────────────────────────────────────────────────

const MOCK_CHATS: Chat[] = [
  {
    id: 1,
    request: { id: 101, title: 'עזרה עם קניות', imageUrl: 'https://via.placeholder.com/80', status: 'open' },
    otherUser: { id: 301, name: 'דור', avatarUrl: undefined },
    createdAt: new Date('2026-04-04T14:00:00'),
    updatedAt: new Date('2026-04-04T14:45:00'),
  },
  {
    id: 2,
    request: { id: 102, title: 'איסוף תרופות', imageUrl: undefined, status: 'in_progress' },
    otherUser: { id: 302, name: 'משה', avatarUrl: undefined },
    createdAt: new Date('2026-04-04T12:00:00'),
    updatedAt: new Date('2026-04-04T13:30:00'),
  },
  {
    id: 3,
    request: { id: 103, title: 'הוצאת הכלב', imageUrl: undefined, status: 'completed' },
    otherUser: { id: 303, name: 'נועה', avatarUrl: undefined },
    createdAt: new Date('2026-04-03T09:00:00'),
    updatedAt: new Date('2026-04-03T10:00:00'),
  },
];

const MOCK_MESSAGES: Message[] = [
  { id: 1, chatId: 1, senderId: 301, content: 'היי, אתה פנוי לעזור לי עם קניות?', createdAt: new Date('2026-04-04T14:10:00') },
  { id: 2, chatId: 1, senderId: 999, content: 'כן, בכיף. מתי נוח לך?', createdAt: new Date('2026-04-04T14:15:00') },
  { id: 3, chatId: 1, senderId: 301, content: 'עוד שעה בערך, זה מתאים?', createdAt: new Date('2026-04-04T14:20:00') },
  { id: 4, chatId: 2, senderId: 302, content: 'צריך איסוף תרופות מהסופר-פארם.', createdAt: new Date('2026-04-04T12:20:00') },
  { id: 5, chatId: 2, senderId: 999, content: 'סבבה, אני בודק מתי אני יכול.', createdAt: new Date('2026-04-04T12:28:00') },
];

// ─── Pure Utilities ───────────────────────────────────────────────────────────

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
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function getInitialMessages(chatId: number): Message[] {
  return MOCK_MESSAGES
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  url?: string;
  userId: number;
  size?: number;
}

function Avatar({ name, url, userId, size = 50 }: AvatarProps) {
  const sharedStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
  };

  if (url) {
    return <img src={url} alt={name} style={{ ...sharedStyle, objectFit: 'cover' }} />;
  }

  return (
    <div
      aria-hidden
      style={{
        ...sharedStyle,
        background: getAvatarColor(userId),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 14,
        userSelect: 'none',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble = memo(function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div
      role="listitem"
      style={{
        display: 'flex',
        // Own messages sit on the right in RTL layouts (flex-start = right edge)
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

// ─── ChatNotFound ─────────────────────────────────────────────────────────────

interface ChatNotFoundProps {
  onBack: () => void;
}

function ChatNotFound({ onBack }: ChatNotFoundProps) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#ffffff',
          border: '1px solid rgba(40,37,29,0.10)',
          borderRadius: 18,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 24, color: '#1f3f8c' }}>השיחה לא נמצאה</h2>
        <p style={{ marginTop: 12, color: '#5e5a53' }}>
          לא הצלחנו למצוא את השיחה שביקשת לפתוח.
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: 16,
            border: 'none',
            background: '#1f3f8c',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          חזרה לשיחות
        </button>
      </div>
    </div>
  );
}

// ─── ChatRoom ─────────────────────────────────────────────────────────────────

export default function ChatRoom() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const chatId = Number(id);

  const chat = useMemo(
    () => MOCK_CHATS.find((c) => c.id === chatId),
    [chatId],
  );

  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(chatId));
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !chatId) return;

    const newMessage: Message = {
      id: Date.now(),
      chatId,
      senderId: CURRENT_USER_ID,
      content: trimmed,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
  }, [input, chatId]);

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const goBack = useCallback(() => navigate('/chats'), [navigate]);

  if (!chat) {
    return <ChatNotFound onBack={goBack} />;
  }

  const canSend = input.trim().length > 0;

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
        aria-label={`שיחה עם ${chat.otherUser.name}`}
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
        {/* ── Header ── */}
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
            onClick={goBack}
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
            name={chat.otherUser.name}
            url={chat.otherUser.avatarUrl}
            userId={chat.otherUser.id}
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
              {chat.otherUser.name}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: '#5e5a53',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {chat.request?.title ?? 'צ׳אט כללי'}
            </div>
          </div>

          {chat.request && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {chat.request.imageUrl && (
                <img
                  src={chat.request.imageUrl}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    objectFit: 'cover',
                    border: '1px solid rgba(40,37,29,0.08)',
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: 'rgba(1,105,111,0.10)',
                  color: '#01696f',
                }}
              >
                {STATUS_LABELS[chat.request.status]}
              </span>
            </div>
          )}
        </header>

        {/* ── Messages ── */}
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
          {messages.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7a7974',
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              עדיין אין הודעות בשיחה הזאת
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === CURRENT_USER_ID}
              />
            ))
          )}
          {/* Anchor element for auto-scroll */}
          <div ref={messagesEndRef} />
        </main>

        {/* ── Composer ── */}
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
              placeholder="כתוב הודעה..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              aria-label="הודעה חדשה"
              style={{
                flex: 1,
                padding: '12px 14px',
                border: '1px solid rgba(40,37,29,0.14)',
                borderRadius: 12,
                background: '#f6f3ef',
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
                transition: 'background 140ms ease',
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
