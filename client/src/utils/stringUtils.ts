export function getInitials(name: string): string {
    return name
        .trim()
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export function formatRelativeDate(date: Date): string {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);

    if (diffDays === 0) {
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) {
        return 'אתמול';
    }
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export function formatMessageTime(date: Date): string {
    return date.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
