import { memo, useCallback, useMemo, useState } from 'react';
import type { Announcement, User } from '@typesLib';

// ─── Types ────────────────────────────────────────────────────────────────────

type CurrentUser = Pick<User, 'id' | 'name' | 'role'>;

// ─── Mock Data (UI only) ──────────────────────────────────────────────────────

const MOCK_CURRENT_USER: CurrentUser = {
  id: 1,
  name: 'מנהל מערכת',
  role: 'area_manager',
};

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: 'ניקיון חדר מדרגות',
    content: 'מחר בשעה 10:00 יבוצע ניקיון בחדר המדרגות. נשמח לשיתוף פעולה של כולם.',
    author: { id: 1, name: 'ועד הבית' },
    createdAt: new Date('2026-04-09T09:30:00'),
  },
  {
    id: 2,
    title: 'הפסקת מים זמנית',
    content: 'ביום ראשון בין השעות 12:00–14:00 תהיה הפסקת מים זמנית לצורך תיקון בצנרת.',
    author: { id: 1, name: 'מנהל אזור' },
    createdAt: new Date('2026-04-08T18:15:00'),
  },
  {
    id: 3,
    title: 'חניה פנויה להשכרה',
    content: 'יש חניה פנויה להשכרה בבניין. מי שמעוניין מוזמן לפנות אליי בפרטי.',
    author: { id: 2, name: 'יוסי לוי' },
    createdAt: new Date('2026-04-07T14:00:00'),
  },
];

// ─── Pure Utilities ───────────────────────────────────────────────────────────

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

// ─── Sub-Components ───────────────────────────────────────────────────────────

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

// ─── AuthorAvatar ─────────────────────────────────────────────────────────────

interface AuthorAvatarProps {
  name: string;
}

function AuthorAvatar({ name }: AuthorAvatarProps) {
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

// ─── AnnouncementCard ─────────────────────────────────────────────────────────

interface AnnouncementCardProps {
  announcement: Announcement;
  currentUser: CurrentUser;
  onDelete: (id: number) => void;
}

const AnnouncementCard = memo(function AnnouncementCard({
  announcement,
  currentUser,
  onDelete
}: AnnouncementCardProps) {
  const { title, content, author, createdAt } = announcement;

  // Check if user can delete this announcement
  const isOwner = announcement.author.id === currentUser.id;
  const isAreaManager = currentUser.role === 'area_manager';
  const canDelete = isAreaManager || (currentUser.role === 'house_committee' && isOwner);

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

      {/* Delete button - shown only to authorized users */}
      {canDelete && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={() => onDelete(announcement.id)}
            style={{
              border: '1px solid rgba(220,38,38,0.3)',
              background: 'transparent',
              color: '#dc2626',
              padding: '8px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              transition: 'all 140ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#dc2626';
            }}
          >
            מחק מודעה
          </button>
        </div>
      )}
    </article>
  );
});

// ─── CreateAnnouncementForm ───────────────────────────────────────────────────

interface CreateAnnouncementFormProps {
  onClose: () => void;
  onPublish: (title: string, content: string) => void;
}

function CreateAnnouncementForm({ onClose, onPublish }: CreateAnnouncementFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const canPublish = title.trim().length > 0 && content.trim().length > 0;

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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="sr-only">כותרת המודעה</span>
          <input
            type="text"
            placeholder="כותרת המודעה"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={fieldStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="sr-only">תוכן המודעה</span>
          <textarea
            placeholder="תוכן המודעה"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            required
            style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </label>

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
              transition: 'background 140ms ease',
            }}
          >
            פרסם
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid rgba(40,37,29,0.14)',
              background: 'transparent',
              color: '#5e5a53',
              padding: '11px 18px',
              borderRadius: 12,
              cursor: 'pointer',
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

// ─── EmptyState ───────────────────────────────────────────────────────────────

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

// ─── AnnouncementsList ────────────────────────────────────────────────────────

interface AnnouncementsListProps {
  announcements?: Announcement[];
  currentUser?: CurrentUser;
}

export default function AnnouncementsList({
  announcements = MOCK_ANNOUNCEMENTS,
  currentUser = MOCK_CURRENT_USER,
}: AnnouncementsListProps) {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Can create announcements: house_committee or area_manager
  const canCreateAnnouncement =
    currentUser.role === 'house_committee' || currentUser.role === 'area_manager';

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

  const handleCloseForm = useCallback(() => setShowCreateForm(false), []);

  // In a real app this would call an API; for now it just closes the form.
  const handlePublish = useCallback((_title: string, _content: string) => {
    setShowCreateForm(false);
  }, []);

  // In a real app this would call DELETE /api/announcements/:id
  const handleDelete = useCallback((id: number) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המודעה?')) {
      console.log('Deleting announcement:', id);
      // API call would go here
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
        {/* ── Page Header ── */}
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

        {/* ── Create Form (house committee & area manager) ── */}
        {canCreateAnnouncement && showCreateForm && (
          <div id="create-announcement-form">
            <CreateAnnouncementForm onClose={handleCloseForm} onPublish={handlePublish} />
          </div>
        )}

        {/* ── Announcements Feed ── */}
        <section aria-label="רשימת מודעות" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredAnnouncements.length === 0 ? (
            <EmptyState />
          ) : (
            filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                currentUser={currentUser}
                onDelete={handleDelete}
              />
            ))
          )}
        </section>
      </section>
    </div>
  );
}
