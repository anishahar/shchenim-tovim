import { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Chat } from '@typesLib';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#01696f',
  '#437a22',
  '#7a39bb',
  '#da7101',
  '#006494',
  '#a13544',
] as const;

// for UI 
const MOCK_CHATS: Chat[] = [
  {
    id: 1,
    request: {
      id: 101,
      title: 'עזרה עם קניות',
      imageUrl: undefined,
      status: 'open',
    },
    otherUser: { id: 301, name: 'דור', avatarUrl: undefined },
    createdAt: new Date('2026-04-04T14:00:00'),
    updatedAt: new Date('2026-04-04T14:45:00'),
  },
  {
    id: 2,
    request: {
      id: 102,
      title: 'איסוף תרופות',
      imageUrl: undefined,
      status: 'in_progress',
    },
    otherUser: { id: 302, name: 'משה', avatarUrl: undefined },
    createdAt: new Date('2026-04-04T12:00:00'),
    updatedAt: new Date('2026-04-04T13:30:00'),
  },
  {
    id: 3,
    request: {
      id: 103,
      title: 'הוצאת הכלב',
      imageUrl: undefined,
      status: 'completed',
    },
    otherUser: { id: 303, name: 'נועה', avatarUrl: undefined },
    createdAt: new Date('2026-04-03T09:00:00'),
    updatedAt: new Date('2026-04-03T10:00:00'),
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestStatus = NonNullable<Chat['request']>['status'];

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

function formatRelativeDate(date: Date): string {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);

  if (diffDays === 0) {
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'אתמול';
  }
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'פתוחה',
  in_progress: 'בטיפול',
  completed: 'הושלמה',
};

const STATUS_STYLES: Record<RequestStatus, React.CSSProperties> = {
  open: { background: 'rgba(218,113,1,0.12)', color: '#da7101' },
  in_progress: { background: 'rgba(1,105,111,0.10)', color: '#01696f' },
  completed: { background: 'rgba(67,122,34,0.12)', color: '#437a22' },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  url?: string;
  userId: number;
}

function Avatar({ name, url, userId }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: 48,
          height: 48,
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
        width: 48,
        height: 48,
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

interface StatusBadgeProps {
  status: RequestStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 999,
        letterSpacing: '0.2px',
        ...STATUS_STYLES[status],
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── ChatItem ─────────────────────────────────────────────────────────────────

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

const ChatItem = memo(function ChatItem({ chat, isSelected, onClick }: ChatItemProps) {
  const { otherUser, request, updatedAt } = chat;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <li
      role="listitem"
      aria-current={isSelected ? 'page' : undefined}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        listStyle: 'none',
        background: isSelected ? 'rgba(1,105,111,0.10)' : undefined,
        borderBottom: '1px solid rgba(40,37,29,0.06)',
        borderRight: isSelected ? '4px solid #01696f' : '4px solid transparent',
        transition: 'background 140ms ease, border-color 140ms ease',
        outline: 'none',
      }}
    >
      <Avatar name={otherUser.name} url={otherUser.avatarUrl} userId={otherUser.id} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row: name + timestamp */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: '#28251d',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {otherUser.name}
          </span>
          <time
            dateTime={updatedAt.toISOString()}
            style={{ fontSize: 11, color: '#7a7974', flexShrink: 0 }}
          >
            {formatRelativeDate(updatedAt)}
          </time>
        </div>

        {/* Request title */}
        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            color: '#5e5a53',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {request?.title ?? 'צ׳אט כללי'}
        </p>

        {/* Request metadata */}
        {request && (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {request.imageUrl && (
              <img
                src={request.imageUrl}
                alt=""
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '1px solid rgba(40,37,29,0.08)',
                }}
              />
            )}
            <StatusBadge status={request.status} />
          </div>
        )}
      </div>
    </li>
  );
});

// ─── Search Icon ──────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7a7974"
      strokeWidth="2"
      style={{
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
      }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

// ─── ChatList ─────────────────────────────────────────────────────────────────

interface ChatListProps {
  chats?: Chat[];
}

export default function ChatList({ chats = MOCK_CHATS }: ChatListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | undefined>();

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    [chats],
  );

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedChats;

    return sortedChats.filter(({ otherUser, request }) => {
      return (
        otherUser.name.toLowerCase().includes(query) ||
        (request?.title.toLowerCase().includes(query) ?? false)
      );
    });
  }, [sortedChats, search]);

  const handleSelect = useCallback(
    (chat: Chat) => {
      setSelectedId(chat.id);
      navigate(`/chats/${chat.id}`);
    },
    [navigate],
  );

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
        aria-label="רשימת שיחות"
        style={{
          width: '100%',
          maxWidth: 420,
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
            padding: '18px 18px 14px',
            borderBottom: '1px solid rgba(40,37,29,0.08)',
            background: '#fcfbf9',
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#1f3f8c',
              margin: '0 0 14px',
              textAlign: 'center',
            }}
          >
            השיחות שלי
          </h1>

          <div style={{ position: 'relative' }}>
            <SearchIcon />
            <input
              type="search"
              placeholder="חפש לפי שם משתמש או בקשה..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="חיפוש שיחות"
              style={{
                width: '100%',
                padding: '10px 38px 10px 12px',
                border: '1px solid rgba(40,37,29,0.14)',
                borderRadius: 10,
                background: '#f6f3ef',
                fontSize: 14,
                color: '#28251d',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </header>

        <ul
          aria-label="שיחות"
          style={{
            flex: 1,
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            background: '#ffffff',
          }}
        >
          {filteredChats.length === 0 ? (
            <li
              style={{
                textAlign: 'center',
                padding: '56px 20px',
                color: '#7a7974',
                fontSize: 14,
                listStyle: 'none',
              }}
            >
              לא נמצאו שיחות
            </li>
          ) : (
            filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={selectedId === chat.id}
                onClick={() => handleSelect(chat)}
              />
            ))
          )}
        </ul>
      </section>
    </div>
  );
}