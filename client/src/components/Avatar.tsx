import { getInitials } from "../utils/stringUtils";

const AVATAR_COLORS = ['#01696f', '#437a22', '#7a39bb', '#da7101', '#006494', '#a13544'] as const;

function getAvatarColor(id: number): string {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
}


interface AvatarProps {
    name: string;
    url?: string;
    userId: number;
    size?: number;
}
export function Avatar({
    name,
    url,
    userId,
    size = 50,
}: AvatarProps) {
    if (url) {
        return (
            <img
                src={url}
                alt={name}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                }}
            />
        );
    }

    return (
        <div
            aria-hidden
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: getAvatarColor(userId),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                userSelect: 'none',
                flexShrink: 0,
            }}
        >
            {getInitials(name)}
        </div>
    );
}