import type { Chat, ChatWithLastMessage, Message, RequestStatus } from '@typesLib';
import { memo, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../AuthContext';
import { Avatar } from '../../components/Avatar';
import { socket } from '../../socket';
import { STATUS_LABELS } from '@constantsLib';
import { ChatItem } from './ChatListItem';

const CHAT_REFRESH_INTERVAL_MS = 5000;

type ChatApiResponse = Omit<Chat, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type MessageApiResponse = Omit<Message, 'createdAt'> & {
  createdAt: string;
};

type NewMessagePayload = {
  chatId: number;
  senderId?: number;
  content: string;
  createdAt: string | Date;
};

function normalizeChat(chat: ChatApiResponse): ChatWithLastMessage {
  return {
    ...chat,
    unreadMessagesAmount: Number(chat.unreadMessagesAmount) || 0,
    createdAt: new Date(chat.createdAt),
    updatedAt: new Date(chat.updatedAt),
  };
}

function getLastMessage(messages: MessageApiResponse[]): Message | undefined {
  const lastMesage = messages
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  return { ...lastMesage, createdAt: new Date(lastMesage.createdAt) }
}

async function markChatAsRead(chatId: number) {
  await api.patch(`/chats/${chatId}/mark-as-read`);
}

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

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [chats, setChats] = useState<ChatWithLastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClosedChats, setShowClosedChats] = useState(false);

  useEffect(() => {
    async function fetchChats() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get<ChatApiResponse[]>('/chats');
        const normalizedChats = response.data.map(normalizeChat);
        setChats(normalizedChats);
        setIsLoading(false);

        const chatsWithLastMessages = await Promise.all(
          normalizedChats.map(async (chat) => {
            if (chat.lastMessage) return chat;

            try {
              const messagesResponse = await api.get<MessageApiResponse[]>(
                `/chats/${chat.id}/messages`
              );

              return {
                ...chat,
                lastMessage: getLastMessage(messagesResponse.data),
              };
            } catch (err) {
              console.error(`Failed to fetch last message for chat ${chat.id}:`, err);
              return chat;
            }
          })
        );

        setChats(chatsWithLastMessages);
      } catch (err) {
        console.error('Failed to fetch chats:', err);
        setError('לא הצלחנו לטעון את השיחות');
      } finally {
        setIsLoading(false);
      }
    }

    fetchChats();
  }, []);

  useEffect(() => {
    function handleNewMessage(message: Message) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === message.chatId
            ? {
              ...chat,
              lastMessage: message,
              updatedAt: new Date(message.createdAt),
              unreadMessagesAmount:
                message.senderId === user?.id || chat.id === selectedId
                  ? chat.unreadMessagesAmount
                  : chat.unreadMessagesAmount + 1,
            }
            : chat
        )
      );
    }

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [selectedId, user?.id]);

  useEffect(() => {
    async function refreshChatStatuses() {
      try {
        const response = await api.get<ChatApiResponse[]>('/chats');
        const refreshedChats = response.data.map(normalizeChat);
        const chatById = new Map(refreshedChats.map((chat) => [chat.id, chat]));

        setChats((prev) =>
          prev.map((chat) => {
            const refreshed = chatById.get(chat.id);
            if (!refreshed) return chat;

            return {
              ...chat,
              unreadMessagesAmount: refreshed.unreadMessagesAmount,
              request:
                chat.request && refreshed.request
                  ? {
                    ...chat.request,
                    status: refreshed.request.status,
                  }
                  : chat.request,
            };
          })
        );
      } catch (err) {
        console.error('Failed to refresh chat statuses:', err);
      }
    }

    const intervalId = window.setInterval(refreshChatStatuses, CHAT_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    [chats],
  );

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedChats;

    return sortedChats.filter(({ otherUser, request, lastMessage }) => {
      return (
        otherUser.name.toLowerCase().includes(query) ||
        (request?.title.toLowerCase().includes(query) ?? false) ||
        (lastMessage?.content.toLowerCase().includes(query) ?? false)
      );
    });
  }, [sortedChats, search]);

  const filteredOpenChats = filteredChats.filter((chat) => !chat.refusedHelpAt && chat.request?.status !== 'completed')
  const filteredClosedChats = filteredChats.filter((chat) => chat.refusedHelpAt || chat.request?.status === 'completed')
  const closedUnreadCount = filteredClosedChats.reduce(
    (sum, chat) => sum + chat.unreadMessagesAmount,
    0
  );

  const handleSelect = useCallback(
    (chat: ChatWithLastMessage) => {
      setSelectedId(chat.id);
      setChats((prev) =>
        prev.map((item) =>
          item.id === chat.id ? { ...item, unreadMessagesAmount: 0 } : item
        )
      );

      markChatAsRead(chat.id).catch((err) =>
        console.error(`Failed to mark chat ${chat.id} as read:`, err)
      );

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

        {isLoading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#7a7974' }}>
            טוען שיחות...
          </div>
        ) : error && chats.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a13544' }}>
            {error}
          </div>
        ) : (
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
            {filteredOpenChats.length === 0 ? (
              <li
                style={{
                  textAlign: 'center',
                  padding: '56px 20px',
                  color: '#7a7974',
                  fontSize: 14,
                  listStyle: 'none',
                }}
              >
                לא נמצאו שיחות פתוחות
              </li>
            ) : (
              filteredOpenChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedId === chat.id}
                  onClick={() => handleSelect(chat)}
                  sentByMe={chat.lastMessage ? chat.lastMessage.senderId === user?.id : false}
                />
              ))
            )}
            {filteredClosedChats.length > 0 && (
              <li
                onClick={() => setShowClosedChats((prev) => !prev)}
                style={{
                  listStyle: 'none',
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderTop: '1px solid #e5e5e5',
                  borderBottom: '1px solid #e5e5e5',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    gap: 8,
                    color: '#7a7974',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span>{showClosedChats ? 'V ' : '>'}</span>
                  <span>{`שיחות שנסגרו: ${filteredClosedChats.length}, הודעות שלא נקראו: ${closedUnreadCount}`}</span>
                </div>

                {showClosedChats &&
                  filteredClosedChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedId === chat.id}
                      onClick={() => handleSelect(chat)}
                      sentByMe={chat.lastMessage ? chat.lastMessage.senderId === user?.id : false}
                    />
                  ))}
              </li>)}
          </ul>

        )}

      </section>
    </div>
  );
}
