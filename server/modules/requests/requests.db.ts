
const distanceSql = (
    fromLat: string,
    fromLng: string,
    toLat: string,
    toLng: string,
) => {
    return `
                (
                    6371 * 2 * asin(
                        sqrt(
                        pow(sin(radians((${fromLat} - ${toLat}) / 2)), 2) +
                        cos(radians(${toLat})) *
                        cos(radians(${fromLat})) *
                        pow(sin(radians((${fromLng} - ${toLng}) / 2)), 2)
                        )
                    )
                )
            `;
}

export const GET_REQUESTS = `
    SELECT *
    FROM (
        SELECT
            r.id,
            r.title,
            r.description,
            r.category,
            r.urgency,
            r.status,
            r.location_text as "locationText",
            r.latitude,
            r.longitude,
            r.image_url as "imageUrl",
            r.created_at as "createdAt",
            r.updated_at as "updatedAt",

            json_build_object(
                'id', u.id,
                'name', u.name,
                'avatarUrl', u.avatar_url
            ) as user,

            (
            ${distanceSql("$1", "$2", "r.latitude", "r.longitude")}
            ) AS distance

        FROM requests r
        JOIN users u ON r.user_id = u.id
        WHERE r.status != 'completed'
        AND NOT u.is_blocked
    ) t
`;

export const GET_BY_ID = GET_REQUESTS + `
    WHERE t.id = $3
`;

export const UPDATE_REQUEST_STATUS = `
    UPDATE requests
    SET status = 'in_progress'
    WHERE id = $1;
`;

