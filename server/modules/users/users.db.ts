
export const GET_USER_BY_ID = `
    SELECT id,
    email,
    name,
    role,
    avatar_url as "avatarUrl",
    phone, 
    address_text as "addressText", 
    latitude, 
    longitude, 
    city, 
    street, 
    street_number as "streetNumber", 
    apartment, 
    created_at as "createdAt",
    updated_at as "updatedAt"

    FROM users WHERE id = $1
` 
