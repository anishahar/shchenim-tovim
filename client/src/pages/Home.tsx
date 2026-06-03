import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { getInitials } from '../utils/stringUtils';

const CATEGORY_COLORS: Record<string, string> = {
  shopping: 'bg-sky-100 text-sky-700',
  elderly_care: 'bg-violet-100 text-violet-700',
  moving: 'bg-amber-100 text-amber-700',
  repairs: 'bg-orange-100 text-orange-700',
  pet_care: 'bg-emerald-100 text-emerald-700',
  other: 'bg-slate-100 text-slate-600',
};

const CATEGORY_LABELS: Record<string, string> = {
  shopping: 'קניות',
  elderly_care: 'סיוע לקשישים',
  moving: 'הובלה',
  repairs: 'תיקונים',
  pet_care: 'טיפול בחיות',
  other: 'אחר',
};

const URGENCY_LABELS: Record<string, string> = {
  high: 'דחיפות גבוהה',
  medium: 'דחיפות בינונית',
  low: 'דחיפות נמוכה',
};

const URGENCY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const AVATAR_COLORS = ['#01696f', '#437a22', '#7a39bb', '#da7101', '#006494', '#a13544'];

type TopUser = {
  id: number;
  name: string;
  avatarUrl?: string;
  average: number;
  count: number;
};

type CityRequest = {
  id: number;
  title: string;
  description: string;
  urgency: string;
  category: string;
  createdAt: string;
  userName: string;
};

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export default function Home() {
  const { user } = useAuth();
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [cityRequests, setCityRequests] = useState<CityRequest[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    api.get('/ratings/top')
      .then((res) => setTopUsers(res.data))
      .catch(() => { })
      .finally(() => setLoadingUsers(false));

    if (user?.city) {
      api.get(`/requests/city?city=${encodeURIComponent(user.city)}`)
        .then((res) => setCityRequests(res.data))
        .catch(() => { })
        .finally(() => setLoadingRequests(false));
    } else {
      setLoadingRequests(false);
    }
  }, [user?.city]);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-600 to-teal-500 text-white px-6 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">שכנים טובים</h1>
          <p className="text-blue-100 text-lg md:text-xl leading-relaxed mb-2">
            פלטפורמה שכונתית לעזרה הדדית בין שכנים.
          </p>
          <p className="text-blue-100 text-base md:text-lg leading-relaxed mb-8">
            כאן שכנים יכולים לפרסם בקשות לעזרה – קניות, תיקונים, סיוע לקשישים ועוד –
            ושכנים אחרים יכולים להציע את עזרתם. כולנו שכנים, כולנו יכולים לעזור.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/requests/new"
              className="bg-white text-blue-700 font-bold px-7 py-3 rounded-lg shadow hover:bg-blue-50 transition-colors"
            >
              פרסם בקשה
            </Link>
            <Link
              to="/requests"
              className="border-2 border-white text-white font-bold px-7 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              צפה בבקשות
            </Link>
          </div>
        </div>
      </div>

      {/* Two-column panel */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Top rated users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
            <h2 className="text-lg font-bold text-gray-800 border-r-4 border-teal-500 pr-3">המשתמשים המובילים</h2>
            <p className="text-xs text-gray-400 mt-0.5">על פי דירוג שכנים</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loadingUsers ? (
              <p className="text-center text-gray-400 py-8 text-sm">טוען...</p>
            ) : topUsers.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">אין מידע על דירוגים עדיין</p>
            ) : (
              topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="text-amber-400 font-bold text-lg w-5 text-center">{i + 1}</span>
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: getAvatarColor(u.id) }}
                    >
                      {getInitials(u.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.count} דירוגים</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-amber-400 text-lg">★</span>
                    <span className="font-bold text-gray-700">{Number(u.average).toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open requests in user's city */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
            <h2 className="text-lg font-bold text-gray-800 border-r-4 border-blue-500 pr-3">בקשות פתוחות בעירך</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user?.city ?? ''}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loadingRequests ? (
              <p className="text-center text-gray-400 py-8 text-sm">טוען...</p>
            ) : cityRequests.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">אין בקשות פתוחות בעירך כרגע</p>
            ) : (
              cityRequests.map((r) => (
                <Link
                  key={r.id}
                  to={`/requests/${r.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-gray-800 truncate">{r.title}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[r.category] ?? 'bg-slate-100 text-slate-600'}`}>
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_COLORS[r.urgency] ?? 'bg-gray-100 text-gray-600'}`}>
                        {URGENCY_LABELS[r.urgency] ?? r.urgency}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm truncate">{r.description}</p>
                  <p className="text-gray-400 text-xs mt-1">פורסם על ידי: {r.userName}</p>
                </Link>
              ))
            )}
          </div>
          {cityRequests.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-50">
              <Link to="/requests" className="text-teal-600 text-sm font-semibold hover:text-teal-700 hover:underline">
                לכל הבקשות ←
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
