
//////////////////////////////////////needs parsing will do after a refactor...
export const GET_BY_ID = `
    SELECT *
    FROM requests
    WHERE id = $1;
`;

export const UPDATE_REQUEST_STATUS = `
    UPDATE requests
    SET status = 'in_progress'
    WHERE id = $1;
`;

