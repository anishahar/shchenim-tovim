
export const GET_USER_CHATS_INFO = `
    SELECT 
    chats.id,
    chats.created_at as "createdAt",
    chats.updated_at as "updatedAt",

    -- otherUser
    json_build_object(
        'id', other_user.id,
        'name', other_user.name,
        'avatarUrl', other_user.avatarUrl
    ) as "otherUser",

    -- request (יכול להיות null)
    CASE 
        WHEN requests.id IS NOT NULL THEN json_build_object(
        'id', requests.id,
        'title', requests.title,
        'imageUrl', requests.imageUrl,
        'status', requests.status
    )
    ELSE NULL
    END as "request"

    FROM chats
    LEFT JOIN requests 
        ON chats."requestId" = requests.id

    JOIN users as other_user
    ON other_user.id = CASE 
        WHEN chats.user1_id = $1 THEN chats.user2_id
        ELSE chats.user1_id
    END

    WHERE 
        $1 IN (chats.user1_id, chats.user2_id);
`;

export const NEW_CHAT = `
    INSERT INTO chats (request_id, user1_id, user2_id, updated_at) 
    VALUES ($1, $2, $3, NOW()) 
    RETURNING id;
`;