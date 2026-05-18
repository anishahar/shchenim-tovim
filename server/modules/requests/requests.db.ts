

export const GET_REQUESTER_ID = `
    SELECT user_id
    FROM requests
    WHERE id = $1;
`;

export const UPDATE_REQUEST_STATUS = `
    UPDATE requests
    SET status = 'in_progress'
    WHERE id = $1;
`;

