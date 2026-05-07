

export const GET_REQUESTER_ID = `
    SELECT user_id as "requesterId"
    FROM requests
    WHERE id = $1;
`;