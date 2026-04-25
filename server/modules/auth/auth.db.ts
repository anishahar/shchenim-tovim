

export const FIND_USER_BY_EMAIL = `
    SELECT id, name, email, password_hash, role, is_blocked 
    FROM users 
    WHERE email = $1
`;

export const INSERT_USER = `
    INSERT INTO users (name, email, password_hash, role, phone, address_text, latitude, longitude, city, street, street_number, apartment)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, name, email, role
`;




