

export const FIND_USER_BY_EMAIL = `
    SELECT id, name, email, password_hash, role, is_blocked 
    FROM users 
    WHERE email = $1
`;

export const INSERT_USER = `
    INSERT INTO users (name, email, password_hash, role) 
    VALUES ($1, $2, $3, $4) 
    RETURNING id, name, email, role
`;




