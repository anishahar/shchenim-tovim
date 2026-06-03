import { useState } from "react";

export function RatingModal({
    helperName,
    onSubmit,
    isSubmitting,
}: {
    helperName: string;
    onSubmit: (score: number) => void;
    isSubmitting: boolean;
}) {
    const [hovered, setHovered] = useState(0);
    const [selected, setSelected] = useState(0);
    const display = hovered || selected;

    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
        >
            <div dir="rtl" style={{
                background: '#fff', borderRadius: 18, padding: '32px 28px',
                maxWidth: 360, width: '90%', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1f3f8c', marginBottom: 8 }}>
                    דרג את {helperName}
                </h2>
                <p style={{ fontSize: 14, color: '#7a7974', marginBottom: 24 }}>
                    כיצד הייתה חוויית העזרה שלך?
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setSelected(star)}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            style={{
                                background: 'none', border: 'none',
                                cursor: isSubmitting ? 'wait' : 'pointer', fontSize: 36,
                                color: star <= display ? '#f5a623' : '#d1cfc9',
                                transition: 'color 0.1s', padding: 0,
                            }}
                        >★</button>
                    ))}
                </div>
                <button
                    type="button"
                    disabled={selected === 0 || isSubmitting}
                    onClick={() => onSubmit(selected)}
                    style={{
                        width: '100%', background: selected > 0 ? '#1f3f8c' : '#d1cfc9',
                        color: '#fff', border: 'none', borderRadius: 999, padding: '12px 0',
                        fontSize: 15, fontWeight: 800,
                        cursor: selected > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                        marginBottom: 10,
                    }}
                >
                    {isSubmitting ? 'שומר...' : 'שמור דירוג'}
                </button>
                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onSubmit(0)}
                    style={{
                        background: 'none', border: 'none', color: '#7a7974',
                        fontSize: 13, cursor: isSubmitting ? 'wait' : 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    דלג, לא עכשיו
                </button>
            </div>
        </div>
    );
}