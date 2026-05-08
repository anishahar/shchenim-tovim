import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title - Right side */}
          <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
            שכנים טובים
          </Link>

          {/* Navigation Links - Left side */}
          <div className="flex items-center gap-6">
            <Link
              to="/requests"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              בקשות
            </Link>
            <Link
              to="/chats"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              צ'אטים
            </Link>
            <Link
              to="/announcements"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              מודעות
            </Link>

            {/* Admin Panel Link - Area Manager only */}
            {user?.role === 'area_manager' && (
              <Link
                to="/admin"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                ניהול
              </Link>
            )}

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-4 mr-4 border-r border-gray-300 pr-4">
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  👤 {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  התנתק
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mr-4 border-r border-gray-300 pr-4">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  התחבר
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
