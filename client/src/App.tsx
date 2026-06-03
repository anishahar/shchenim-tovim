import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';

// Import all pages
import AdminDashboard from './pages/AdminDashboard';
import AnnouncementsList from './pages/announcments/AnnouncementsList';
import ChatList from './pages/chats/ChatList';
import ChatRoom from './pages/chats/ChatRoom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import CreateRequest from './pages/requests/CreateRequest';
import RequestDetail from './pages/requests/RequestDetail';
import RequestsList from './pages/requests/RequestsList';

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
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
