import { UserRole } from '@typesLib';
import { useEffect, useState } from 'react';
import api from '../api';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  isBlocked: boolean;
  createdAt: string;
}

// Role display names in Hebrew
const ROLE_NAMES: Record<UserRole, string> = {
  resident: 'דייר',
  house_committee: 'ועד בית',
  area_manager: 'מנהל אזור',
};

// Role badge colors
const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  resident: { bg: '#e0f2fe', text: '#0369a1' },
  house_committee: { bg: '#ddd6fe', text: '#6d28d9' },
  area_manager: { bg: '#fce7f3', text: '#be185d' },
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await api.get('/users');
        const data = response.data;

        // Convert snake_case to camelCase
        const formattedUsers = data.map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatar_url,
          phone: user.phone,
          isBlocked: user.is_blocked,
          createdAt: user.created_at,
        }));

        setUsers(formattedUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Block user
  async function handleBlock(userId: number) {
    if (!confirm('האם אתה בטוח שברצונך לחסום משתמש זה?')) return;

    try {
      await api.patch(`/users/${userId}/block`);

      // Update local state
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, isBlocked: true } : user))
      );
    } catch (err) {
      alert('שגיאה בחסימת המשתמש');
    }
  }

  // Unblock user
  async function handleUnblock(userId: number) {
    try {
      await api.patch(`/users/${userId}/unblock`);

      // Update local state
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, isBlocked: false } : user))
      );
    } catch (err) {
      alert('שגיאה בביטול חסימת המשתמש');
    }
  }

  // Update user role
  async function handleRoleChange(userId: number, newRole: UserRole) {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });

      // Update local state
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );
    } catch (err) {
      alert('שגיאה בעדכון התפקיד');
    }
  }

  // Filter users by search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div dir="rtl" style={{ padding: '40px', textAlign: 'center', color: '#7a7974' }}>
        טוען...
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
        שגיאה: {error}
      </div>
    );
  }

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
        style={{
          width: '100%',
          maxWidth: 1100,
          minHeight: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Header */}
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
            ניהול משתמשים
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
            ניהול וחסימת משתמשים במערכת
          </p>

          {/* Search */}
          <div style={{ marginTop: 18 }}>
            <input
              type="search"
              placeholder="חפש לפי שם או אימייל..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
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
        </header>

        {/* Users Table */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid rgba(40,37,29,0.10)',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 8px 22px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f6f3ef', borderBottom: '1px solid rgba(40,37,29,0.10)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#5e5a53' }}>
                    שם
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#5e5a53' }}>
                    אימייל
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#5e5a53' }}>
                    תפקיד
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#5e5a53' }}>
                    סטטוס
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#5e5a53' }}>
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid rgba(40,37,29,0.06)',
                      transition: 'background 140ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fafaf9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#28251d', fontWeight: 600 }}>
                      {user.name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#5e5a53' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          background: ROLE_COLORS[user.role].bg,
                          color: ROLE_COLORS[user.role].text,
                          border: '1px solid rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="resident">דייר</option>
                        <option value="house_committee">ועד בית</option>
                        <option value="area_manager">מנהל אזור</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {user.isBlocked ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#fee2e2',
                            color: '#dc2626',
                          }}
                        >
                          חסום
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#dcfce7',
                            color: '#16a34a',
                          }}
                        >
                          פעיל
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {user.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(user.id)}
                          style={{
                            border: '1px solid rgba(22,163,74,0.3)',
                            background: 'transparent',
                            color: '#16a34a',
                            padding: '6px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 12,
                            transition: 'all 140ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#16a34a';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#16a34a';
                          }}
                        >
                          בטל חסימה
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(user.id)}
                          style={{
                            border: '1px solid rgba(220,38,38,0.3)',
                            background: 'transparent',
                            color: '#dc2626',
                            padding: '6px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 12,
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
                          חסום משתמש
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#7a7974',
                fontSize: 14,
              }}
            >
              לא נמצאו משתמשים
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(40,37,29,0.10)',
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 12, color: '#7a7974', marginBottom: 4 }}>סך הכל משתמשים</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1f3f8c' }}>{users.length}</div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(40,37,29,0.10)',
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 12, color: '#7a7974', marginBottom: 4 }}>משתמשים חסומים</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>
              {users.filter((u) => u.isBlocked).length}
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(40,37,29,0.10)',
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 12, color: '#7a7974', marginBottom: 4 }}>משתמשים פעילים</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>
              {users.filter((u) => !u.isBlocked).length}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
