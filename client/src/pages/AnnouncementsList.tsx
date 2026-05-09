import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { Announcement } from '@typesLib';
import api from '../api';
import { useAuth } from '../AuthContext';

type AnnouncementApiResponse = Omit<Announcement, 'createdAt'> & {
  createdAt?: string;
  created_at?: string;
};

type CreateAnnouncementResponse = {
  id: number;
  title: string;
  content: string;
  createdAt?: string;
  created_at?: string;
};

function normalizeAnnouncement(announcement: AnnouncementApiResponse): Announcement {
  return {
    ...announcement,
    createdAt: new Date(announcement.createdAt ?? announcement.created_at ?? Date.now()),
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7a7974"
      strokeWidth="2"
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
      }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function AuthorAvatar({ name }: { name: string }) {
  return (
    <div
      aria-hidden
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: '#1f3f8c',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

interface AnnouncementCardProps {
  announcement: Announcement;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: (id: number) => void;
}

const AnnouncementCard = memo(function AnnouncementCard({
  announcement,
  canDelete,
  isDeleting,
  onDelete,
}: AnnouncementCardProps) {
  const { title, content, author, createdAt } = announcement;

  return (
    <article
      aria-labelledby={`announcement-title-${announcement.id}`}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(40,37,29,0.10)',
        borderRadius: 16,
        padding: 18,
        boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            id={`announcement-title-${announcement.id}`}
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: '#1f3f8c',
              lineHeight: 1.4,
            }}
          >
            {title}
          </h2>

          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
              fontSize: 12,
              color: '#7a7974',
            }}
          >
            <span>מאת: {author.name}</span>
            <span aria-hidden>•</span>
            <time dateTime={createdAt.toISOString()}>
              {formatDate(createdAt)}&nbsp;•&nbsp;{formatTime(createdAt)}
            </time>
          </div>
        </div>

        <AuthorAvatar name={author.name} />
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.8,
          color: '#2f2c26',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </p>

      {canDelete && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={() => onDelete(announcement.id)}
            disabled={isDeleting}
            style={{
              border: '1px solid rgba(220,38,38,0.3)',
              background: 'transparent',
              color: '#dc2626',
              padding: '8px 14px',
              borderRadius: 10,
              cursor: isDeleting ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {isDeleting ? 'מוחק...' : 'מחק מודעה'}
          </button>
        </div>
      )}
    </article>
  );
});

interface CreateAnnouncementFormProps {
  isPublishing: boolean;
  onClose: () => void;
  onPublish: (title: string, content: string) => void;
}

function CreateAnnouncementForm({ isPublishing, onClose, onPublish }: CreateAnnouncementFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const canPublish = title.trim().length > 0 && content.trim().length > 0 && !isPublishing;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPublish) return;
    onPublish(title.trim(), content.trim());
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(40,37,29,0.14)',
    borderRadius: 12,
    background: '#f6f3ef',
    fontSize: 14,
    color: '#28251d',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <section
      aria-labelledby="create-form-heading"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(40,37,29,0.10)',
        borderRadius: 18,
        padding: 20,
        boxShadow: '0 8px 22px rgba(0,0,0,0.04)',
      }}
    >
      <h2
        id="create-form-heading"
        style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 800, color: '#1f3f8c' }}
      >
        פרסום מודעה חדשה
      </h2>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="כותרת המודעה"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={fieldStyle}
        />

        <textarea
          placeholder="תוכן המודעה"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          required
          style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
          <button
            type="submit"
            disabled={!canPublish}
            style={{
              border: 'none',
              background: canPublish ? '#1f3f8c' : '#b8c2df',
              color: '#ffffff',
              padding: '11px 18px',
              borderRadius: 12,
              cursor: canPublish ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {isPublishing ? 'מפרסם...' : 'פרסם'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            style={{
              border: '1px solid rgba(40,37,29,0.14)',
              background: 'transparent',
              color: '#5e5a53',
              padding: '11px 18px',
              borderRadius: 12,
              cursor: isPublishing ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            ביטול
          </button>
        </div>
      </form>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      role="status"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(40,37,29,0.10)',
        borderRadius: 18,
        padding: '50px 20px',
        textAlign: 'center',
        color: '#7a7974',
        fontSize: 14,
        boxShadow: '0 8px 22px rgba(0,0,0,0.04)',
      }}
    >
      לא נמצאו מודעות
    </div>
  );
}

export default function AnnouncementsList() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreateAnnouncement = !!user;

  const fetchAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<AnnouncementApiResponse[]>('/announcements');
      setAnnouncements(response.data.map(normalizeAnnouncement));
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('לא הצלחנו לטעון את המודעות');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const sortedAnnouncements = useMemo(
    () => [...announcements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [announcements],
  );

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedAnnouncements;

    return sortedAnnouncements.filter(
      ({ title, content, author }) =>
        title.toLowerCase().includes(query) ||
        content.toLowerCase().includes(query) ||
        author.name.toLowerCase().includes(query),
    );
  }, [sortedAnnouncements, search]);

  const handlePublish = useCallback(
    async (title: string, content: string) => {
      if (!user) return;

      try {
        setIsPublishing(true);
        setError(null);
        const response = await api.post<CreateAnnouncementResponse>('/announcements', {
          title,
          content,
        });

        const created = response.data;
        setAnnouncements((prev) => [
          {
            id: created.id,
            title: created.title,
            content: created.content,
            author: { id: user.id, name: user.name },
            createdAt: new Date(created.createdAt ?? created.created_at ?? Date.now()),
          },
          ...prev,
        ]);
        setShowCreateForm(false);
      } catch (err) {
        console.error('Failed to publish announcement:', err);
        const responseError = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
        if (responseError === 'house_committee access or higher required') {
          setError(
            user.role === 'area_manager' || user.role === 'house_committee'
              ? 'ההרשאה בטוקן לא מעודכנת. התנתק והתחבר שוב ואז נסה לפרסם מודעה.'
              : 'רק וועד הבית יכול לפרסם מודעה חדשה'
          );
        } else if (responseError) {
          setError(responseError);
        } else {
          setError('לא הצלחנו לפרסם את המודעה');
        }
      } finally {
        setIsPublishing(false);
      }
    },
    [user],
  );

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המודעה?')) return;

    try {
      setDeletingId(id);
      setError(null);
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setError('לא הצלחנו למחוק את המודעה');
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <div
      dir="rtl"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <section
        aria-label="לוח מודעות"
        style={{
          width: '100%',
          maxWidth: 860,
          minHeight: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <header
          style={{
            background: '#ffffff',
            border: '1px solid rgba(40,37,29,0.10)',
            borderRadius: 18,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 800,
              color: '#1f3f8c',
              textAlign: 'center',
            }}
          >
            לוח מודעות
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 14,
              color: '#5e5a53',
              textAlign: 'center',
              lineHeight: 1.7,
            }}
          >
            עדכונים, הודעות ומידע חשוב לדיירי הבניין
          </p>

          <div
            style={{
              marginTop: 18,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <SearchIcon />
              <input
                type="search"
                placeholder="חפש לפי כותרת, תוכן או מפרסם..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="חיפוש מודעות"
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 12px',
                  border: '1px solid rgba(40,37,29,0.14)',
                  borderRadius: 12,
                  background: '#f6f3ef',
                  fontSize: 14,
                  color: '#28251d',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {canCreateAnnouncement && (
              <button
                onClick={() => setShowCreateForm((prev) => !prev)}
                aria-expanded={showCreateForm}
                aria-controls="create-announcement-form"
                style={{
                  border: 'none',
                  background: '#1f3f8c',
                  color: '#ffffff',
                  padding: '11px 16px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                }}
              >
                {showCreateForm ? 'סגור' : 'פרסם מודעה'}
              </button>
            )}
          </div>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              background: '#fff4e5',
              color: '#8a4b00',
              border: '1px solid rgba(138,75,0,0.15)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {canCreateAnnouncement && showCreateForm && (
          <div id="create-announcement-form">
            <CreateAnnouncementForm
              isPublishing={isPublishing}
              onClose={() => setShowCreateForm(false)}
              onPublish={handlePublish}
            />
          </div>
        )}

        <section aria-label="רשימת מודעות" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#7a7974' }}>טוען מודעות...</div>
          ) : filteredAnnouncements.length === 0 ? (
            <EmptyState />
          ) : (
            filteredAnnouncements.map((announcement) => {
              const canDelete =
                user?.role === 'area_manager' ||
                (user?.role === 'house_committee' && announcement.author.id === user.id);

              return (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  canDelete={canDelete}
                  isDeleting={deletingId === announcement.id}
                  onDelete={handleDelete}
                />
              );
            })
          )}
        </section>
      </section>
    </div>
  );
}
