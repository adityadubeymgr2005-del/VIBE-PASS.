import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Ticket, IndianRupee, Trash2, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalTickets: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Fetch users
      const usersRes = await fetch('http://localhost:5000/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!usersRes.ok) throw new Error('Failed to load platform users list');
      const usersData = await usersRes.json();
      setUsersList(usersData);

      // Fetch global platform KPIs
      const kpisRes = await fetch('http://localhost:5000/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (kpisRes.ok) {
        const kpisData = await kpisRes.json();
        setStats({
          totalUsers: usersData.length,
          totalTickets: kpisData.kpis.totalTicketsSold,
          totalRevenue: kpisData.kpis.totalRevenue
        });
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to administrator dashboard services.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.message || 'Error updating user role');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Warning: Deleting this user will remove all their credentials and associated data. Proceed?')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.message || 'Error deleting user');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting user.');
    }
  };

  if (loading && usersList.length === 0) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading moderator systems...</p>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-title-box">
          <ShieldAlert className="admin-icon-red" size={24} />
          <h2>Platform Administration</h2>
        </div>
        <button onClick={fetchAdminData} className="btn btn-ghost btn-refresh">
          <RefreshCw size={14} />
          <span>Refresh List</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {/* Stats KPI Widgets */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Users size={24} /></div>
          <div className="kpi-info">
            <h4>Global Registrants</h4>
            <p>{stats.totalUsers}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Ticket size={24} /></div>
          <div className="kpi-info">
            <h4>Tickets Printed</h4>
            <p>{stats.totalTickets}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><IndianRupee size={24} /></div>
          <div className="kpi-info">
            <h4>Platform Revenue</h4>
            <p>₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* User Management List */}
      <div className="admin-users-table-box glass-panel">
        <h3>User Directory</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Current Role</th>
                <th>Permissions Tool</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((usr) => (
                <tr key={usr._id}>
                  <td className="table-mono-id">{usr._id.substring(0, 8)}...</td>
                  <td className="table-bold-text">{usr.name}</td>
                  <td>{usr.email}</td>
                  <td>
                    <span className={`badge ${
                      usr.role === 'admin' 
                        ? 'badge-danger' 
                        : usr.role === 'organizer' 
                          ? 'badge-success' 
                          : 'badge-warning'
                    }`}>
                      {usr.role}
                    </span>
                  </td>
                  <td>
                    <div className="role-toggles-wrapper">
                      <button 
                        onClick={() => handleUpdateRole(usr._id, 'user')}
                        className={`role-toggle-btn ${usr.role === 'user' ? 'active' : ''}`}
                        disabled={usr.role === 'user'}
                      >
                        Attendee
                      </button>
                      <button 
                        onClick={() => handleUpdateRole(usr._id, 'organizer')}
                        className={`role-toggle-btn ${usr.role === 'organizer' ? 'active' : ''}`}
                        disabled={usr.role === 'organizer'}
                      >
                        Organizer
                      </button>
                      <button 
                        onClick={() => handleUpdateRole(usr._id, 'admin')}
                        className={`role-toggle-btn ${usr.role === 'admin' ? 'active' : ''}`}
                        disabled={usr.role === 'admin'}
                      >
                        Admin
                      </button>
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDeleteUser(usr._id)}
                      className="action-btn delete-btn"
                      title="Terminate Account"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .admin-page-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.75rem;
        }

        .admin-title-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .admin-title-box h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .admin-icon-red {
          color: var(--accent);
        }

        .table-mono-id {
          font-family: monospace;
          color: var(--text-muted);
        }

        .table-bold-text {
          font-weight: 600;
          color: #fff;
        }

        /* Role Toggles buttons inside cells */
        .role-toggles-wrapper {
          display: flex;
          gap: 0.35rem;
          background: rgba(0,0,0,0.3);
          padding: 0.2rem;
          border-radius: 6px;
          width: fit-content;
        }

        .role-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: var(--font-family);
          border-radius: 4px;
          cursor: pointer;
          transition: var(--transition);
        }

        .role-toggle-btn:hover:not(:disabled) {
          color: #fff;
        }

        .role-toggle-btn.active {
          background: var(--bg-secondary);
          color: var(--secondary);
        }

        .role-toggle-btn:disabled {
          cursor: not-allowed;
        }

        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8rem 2rem;
          text-align: center;
          gap: 1rem;
        }
      `}} />
    </div>
  );
}
