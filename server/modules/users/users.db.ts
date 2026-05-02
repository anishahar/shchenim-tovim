
export const GET_USER_BY_ID = `
    SELECT id, email, name, role, avatar_url, phone, address_text, 
    latitude, longitude, city, street, street_number, apartment, created_at 
    FROM users WHERE id = $1
` 
