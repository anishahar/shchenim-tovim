import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';

// Import all pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RequestsList from './pages/RequestsList';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import AnnouncementsList from './pages/AnnouncementsList';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// Admin Route wrapper (area manager only)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'area_manager' ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/requests" element={<ProtectedRoute><RequestsList /></ProtectedRoute>} />
          <Route path="/requests/new" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
          <Route path="/chats/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><AnnouncementsList /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
