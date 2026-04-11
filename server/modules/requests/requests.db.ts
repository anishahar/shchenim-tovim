

export const GET_REQUESTER_ID = `
    SELECT user_id 
    FROM requests
    WHERE id = $1;
`;