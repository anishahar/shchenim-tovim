import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-l from-blue-700 to-blue-600 shadow-lg" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title - Right side */}
          <Link to="/" className="text-2xl font-extrabold text-white hover:text-blue-100 transition-colors">
            שכנים טובים
          </Link>

          {/* Navigation Links - Left side */}
          <div className="flex items-center gap-6">
            <Link
              to="/requests"
              className="text-blue-100 hover:text-white font-medium transition-colors"
            >
              בקשות
            </Link>
            <Link
              to="/chats"
              className="text-blue-100 hover:text-white font-medium transition-colors"
            >
              צ'אטים
            </Link>
            <Link
              to="/announcements"
              className="text-blue-100 hover:text-white font-medium transition-colors"
            >
              מודעות
            </Link>

            {/* Admin Panel Link - Area Manager only */}
            {user?.role === 'area_manager' && (
              <Link
                to="/admin"
                className="text-blue-100 hover:text-white font-medium transition-colors"
              >
                ניהול
              </Link>
            )}

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-4 mr-4 border-r border-blue-400 pr-4">
                <Link
                  to="/profile"
                  className="text-blue-100 hover:text-white font-medium transition-colors"
                >
                  👤 {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                >
                  התנתק
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mr-4 border-r border-blue-400 pr-4">
                <Link
                  to="/login"
                  className="text-blue-100 hover:text-white font-medium transition-colors"
                >
                  התחבר
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                >
                  הירשם
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
