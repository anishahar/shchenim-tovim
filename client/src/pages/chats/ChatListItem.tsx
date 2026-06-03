import { memo } from "react";
import { Avatar } from "../../components/Avatar";
import { StatusBadge } from "../../components/StatusBadge";
import { formatRelativeDate } from "../../utils/stringUtils";
import { ChatWithLastMessage } from "@typesLib";

const MAX_UNREAD_BADGE_COUNT = 99;

interface ChatItemProps {
    chat: ChatWithLastMessage;
    isSelected: boolean;
    onClick: () => void;
    sentByMe: boolean;
}

export const ChatItem = memo(function ChatItem({ chat, isSelected, onClick, sentByMe }: ChatItemProps) {
    const { otherUser, request, updatedAt, lastMessage, unreadMessagesAmount } = chat;
    const hasUnread = unreadMessagesAmount > 0;

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {hasUnread && (
                            <span
                                aria-label={`${unreadMessagesAmount} הודעות שלא נקראו`}
                                style={{
                                    minWidth: 20,
                                    height: 20,
                                    padding: '0 6px',
                                    borderRadius: 999,
                                    background: '#22c55e',
                                    color: '#ffffff',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    lineHeight: 1,
                                    boxSizing: 'border-box',
                                }}
                            >
                                {unreadMessagesAmount > MAX_UNREAD_BADGE_COUNT
                                    ? `${MAX_UNREAD_BADGE_COUNT}+`
                                    : unreadMessagesAmount}
                            </span>
                        )}
                        <time
                            dateTime={updatedAt.toISOString()}
                            style={{ fontSize: 11, color: hasUnread ? '#16a34a' : '#7a7974' }}
                        >
                            {formatRelativeDate(updatedAt)}
                        </time>
                    </div>
                </div>

                <p
                    style={{
                        marginTop: 6,
                        fontSize: 13,
                        color: hasUnread ? '#28251d' : '#5e5a53',
                        fontWeight: hasUnread ? 700 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {sentByMe ? "אני: " + lastMessage?.content : lastMessage?.content || 'אין הודעות עדיין'}
                </p>

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
