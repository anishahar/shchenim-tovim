import { RequestStatus, RequestUrgency } from "../types/requests.js";

export const STATUS_LABELS: Record<RequestStatus, string> = {
    open: 'פתוחה',
    in_progress: 'בטיפול',
    completed: 'הושלמה',
};

export const REQUEST_STATUS_OPTIONS: RequestStatus[] = ['open', 'in_progress', 'completed'];

export const URGENCY_LABELS: Record<RequestUrgency, string> = {
    high: 'דחיפות גבוהה',
    medium: 'דחיפות בינונית',
    low: 'דחיפות נמוכה',
};