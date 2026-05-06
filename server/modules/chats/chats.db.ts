
export const GET_USER_CHATS_INFO = `
    SELECT 
    chats.id,
    chats.created_at as "createdAt",
    chats.updated_at as "updatedAt",

    -- otherUser
    json_build_object(
        'id', other_user.id,
        'name', other_user.name,
        'avatarUrl', other_user.avatar_url
    ) as "otherUser",

    -- request 
    CASE 
        WHEN requests.id IS NOT NULL THEN json_build_object(
        'id', requests.id,
        'title', requests.title,
        'imageUrl', requests.image_url,
        'status', requests.status
    )
    ELSE NULL
    END as "request"

    FROM chats
    LEFT JOIN requests 
        ON chats.request_id = requests.id

    JOIN users as other_user
    ON other_user.id = CASE 
        WHEN chats.user1_id = $1 THEN chats.user2_id
        ELSE chats.user1_id
    END

    WHERE 
        chats.user1_id = $1 OR chats.user2_id = $1;
`;

export const NEW_CHAT = `
    INSERT INTO chats (request_id, user1_id, user2_id, updated_at) 
    VALUES ($1, $2, $3, NOW()) 
    RETURNING id;
`;

export const GET_CHAT_MESSAGES = `
    SELECT id, chat_id as "chatId", sender_id as "senderId", content, created_at as "createdAt"
    FROM messages
    WHERE chat_id = $1
`;

export const IS_USER_MEMBER_IN_CHAT = `
    SELECT EXISTS (
    SELECT 1
    FROM chats
    WHERE id = $1
      AND (user1_id = $2 OR user2_id = $2)
)`;

export const SEND_MESSAGE = `
    INSERT INTO messages (chat_id, sender_id, content)
    VALUES ($1, $2, $3) 
    RETURNING created_at as "createdAt";
`;

export const UPDATE_CHAT_TIMESTAMP = `
    UPDATE chats
    SET updated_at = $2 
    WHERE id = $1;
`;

export const UPDATE_LAST_READ_TIMESTAMP = `
    UPDATE chats
    SET 
    last_read_at1 = CASE 
        WHEN user1_id = $1 THEN NOW() 
        ELSE last_read_at1 
    END,
    last_read_at2 = CASE 
        WHEN user2_id = $1 THEN NOW() 
        ELSE last_read_at2 
    END
    WHERE id = $2;
`;

export const GET_UNREAD_MESSAGES_AMOUNT = `
    SELECT COUNT(*) AS "unreadMessages"
    FROM messages m
    JOIN chats c ON c.id = m.chat_id
    WHERE c.id = $1
    AND (
        (c.user1_id = $2 AND m.created_at > c.last_read_at1)
        OR
        (c.user2_id = $2 AND m.created_at > c.last_read_at2)
    )
    AND m.sender_id != $2;
`;


