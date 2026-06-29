import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, LogOut, LayoutDashboard, QrCode, Ticket, ShieldAlert } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <Calendar className="brand-icon" size={24} />
          <span>Vibe<span className="brand-accent">Pass</span></span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">Browse Events</Link>
          
          {user && user.role === 'user' && (
            <Link to="/my-bookings" className="nav-link">
              <Ticket size={18} />
              <span>My Tickets</span>
            </Link>
          )}

          {user && (user.role === 'organizer' || user.role === 'admin') && (
            <>
              <Link to="/dashboard" className="nav-link">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/scanner" className="nav-link">
                <QrCode size={18} />
                <span>Check-in Scanner</span>
              </Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin" className="nav-link text-admin">
              <ShieldAlert size={18} />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>

        <div className="navbar-user-actions">
          {user ? (
            <div className="user-profile-menu">
              <div className="user-info">
                <User size={16} className="user-avatar-icon" />
                <span className="user-name">{user.name}</span>
                <span className="user-role-badge">{user.role}</span>
              </div>
              <button onClick={handleLogoutClick} className="btn-logout" title="Log Out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-login-nav">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Styles local to the navbar for easier compartmentalization */}
      <style dangerouslySetInnerHTML={{__html: `
        .navbar-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(7, 5, 15, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(131, 56, 236, 0.15);
          z-index: 999;
          display: flex;
          align-items: center;
        }

        .navbar-content {
          max-width: 1300px;
          width: 100%;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 800;
          font-size: 1.5rem;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .brand-icon {
          color: var(--primary);
        }

        .brand-accent {
          color: var(--secondary);
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .nav-link:hover {
          color: #fff;
          text-shadow: 0 0 10px rgba(131, 56, 236, 0.3);
        }

        .text-admin {
          color: var(--accent);
        }
        
        .text-admin:hover {
          color: #ff3385;
          text-shadow: 0 0 10px rgba(255, 0, 127, 0.3);
        }

        .navbar-user-actions {
          display: flex;
          align-items: center;
        }

        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          padding: 0.4rem 0.8rem 0.4rem 0.6rem;
          border-radius: 30px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-avatar-icon {
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 50%;
          box-sizing: content-box;
        }

        .user-name {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .user-role-badge {
          background: rgba(131, 56, 236, 0.15);
          color: var(--primary-hover);
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.5rem;
          border-radius: 10px;
        }

        .btn-logout {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
        }

        .btn-logout:hover {
          color: var(--danger);
        }

        .auth-buttons {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-login-nav {
          padding: 0.5rem 1.25rem;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .navbar-links {
            display: none; /* simple responsive hide */
          }
          .navbar-content {
            padding: 0 1rem;
          }
        }
      `}} />
    </nav>
  );
}
