import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Shield, Eye, EyeOff, Calendar } from 'lucide-react';
import { apiUrl } from '../api';

export default function LoginRegister({ type = 'login', onLoginSuccess }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(type === 'login');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // user, organizer, admin
  const [showPassword, setShowPassword] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const endpoint = isLogin ? 'login' : 'register';
    const payload = isLogin 
      ? { email, password } 
      : { name, email, password, role };

    try {
      const response = await fetch(apiUrl(`/api/auth/${endpoint}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        // Save to local storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Callback to App component state
        onLoginSuccess(data.user);
        
        // Redirect based on role
        if (data.user.role === 'organizer' || data.user.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg(data.message || 'An error occurred during authentication.');
      }
    } catch (err) {
      setErrorMsg('Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-box glass-panel">
        <div className="auth-header">
          <Calendar size={36} className="auth-logo-icon" />
          <h2 className="gradient-text">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Enter credentials to manage or book events' : 'Join us to start planning or attending events'}</p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="form-input auth-input" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="form-input auth-input" 
                placeholder="yourname@domain.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input auth-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="btn-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Register As</label>
              <div className="input-with-icon">
                <Shield size={18} className="input-icon" />
                <select 
                  className="form-select auth-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">Attendee (Browse & Book)</option>
                  <option value="organizer">Organizer (Manage & Scan)</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-auth" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button className="auth-toggle-btn" onClick={handleToggleMode}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .auth-page-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 170px);
        }

        .auth-box {
          max-width: 450px;
          width: 100%;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo-icon {
          color: var(--primary);
          margin-bottom: 0.5rem;
        }

        .auth-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .auth-input {
          padding-left: 2.75rem !important;
        }

        .btn-password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-password-toggle:hover {
          color: var(--text-main);
        }

        .btn-auth {
          margin-top: 1.5rem;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1rem;
        }

        .auth-footer p {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .auth-toggle-btn {
          background: transparent;
          border: none;
          color: var(--secondary);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .auth-toggle-btn:hover {
          color: var(--secondary-hover);
          text-decoration: underline;
        }
      `}} />
    </div>
  );
}
