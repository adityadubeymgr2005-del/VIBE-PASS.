import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Views/Pages
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import LoginRegister from './pages/LoginRegister';
import MyBookings from './pages/MyBookings';
import Dashboard from './pages/Dashboard';
import ScannerPage from './pages/ScannerPage';
import AdminPanel from './pages/AdminPanel';
import PaymentSuccess from './pages/PaymentSuccess';

// Import Components
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';

export default function App() {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Read user from localStorage on boot
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setInitialized(true);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const token = localStorage.getItem('token');
  const isAuthenticated = Boolean(user && token);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!initialized) {
    return (
      <div className="app-init-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // --- ROUTE GUARDS ---
  const UserRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user.role !== 'user') return <Navigate to="/dashboard" replace />;
    return children;
  };

  const OrganizerRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user.role !== 'organizer' && user.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return children;
  };

  return (
    <Router>
      <div className="app-container">
        {/* Stellar Background glow blooms & Animated Constellation canvas */}
        <AnimatedBackground />

        {/* Global sticky Header Navigation */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Views Router */}
        <main className="main-content">
          <Routes>
            {/* Public Access */}
            <Route path="/" element={<Home />} />
            <Route path="/events/:id" element={<EventDetails user={user} />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <LoginRegister type="login" onLoginSuccess={handleLoginSuccess} />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/" replace /> : <LoginRegister type="register" onLoginSuccess={handleLoginSuccess} />} 
            />

            {/* Attendee Restricted Access */}
            <Route path="/my-bookings" element={
              <UserRoute>
                <MyBookings />
              </UserRoute>
            } />

            {/* Organizer & Admin Restricted Access */}
            <Route path="/dashboard" element={
              <OrganizerRoute>
                <Dashboard user={user} />
              </OrganizerRoute>
            } />
            <Route path="/scanner" element={
              <OrganizerRoute>
                <ScannerPage />
              </OrganizerRoute>
            } />

            {/* Payment Confirmation */}
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* Admin Exclusive Access */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .app-init-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* Loading spinner */
        .loading-spinner {
          width: 45px;
          height: 45px;
          border: 3px solid rgba(131, 56, 236, 0.1);
          border-top: 3px solid var(--secondary);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </Router>
  );
}
