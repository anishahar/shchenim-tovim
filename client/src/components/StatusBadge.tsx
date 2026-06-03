import { STATUS_LABELS } from "@constantsLib";
import { RequestStatus } from "@typesLib";
import { CSSProperties } from "react";

const STATUS_STYLES: Record<RequestStatus, CSSProperties> = {
    open: { background: 'rgba(218,113,1,0.12)', color: '#da7101' },
    in_progress: { background: 'rgba(1,105,111,0.10)', color: '#01696f' },
    completed: { background: 'rgba(67,122,34,0.12)', color: '#437a22' },
};

interface StatusBadgeProps {
    status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <span
            style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 999,
                letterSpacing: '0.2px',
                ...STATUS_STYLES[status],
            }}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}