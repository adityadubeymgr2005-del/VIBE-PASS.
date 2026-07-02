import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, IndianRupee, Calendar, Ticket, Plus, Trash2, Edit3, X, Image, Loader2, ArrowUpRight } from 'lucide-react';
import DashboardChart from '../components/DashboardChart';
import { apiUrl } from '../api';

export default function Dashboard({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('tickets'); // tickets, revenue

  // Event builder states
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null); // null if creating, ID if editing

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [ticketPrice, setTicketPrice] = useState('0');
  const [seatCapacity, setSeatCapacity] = useState('100');
  const [bannerFile, setBannerFile] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token missing');
      const res = await fetch(apiUrl('/api/analytics'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to retrieve analytical summary');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch analytics. Verify backend endpoint and organizer token.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setVenue('');
    setTicketPrice('0');
    setSeatCapacity('100');
    setBannerFile(null);
    setIsBuilderOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEventId(event.id || event._id || null);
    setTitle(event.title);
    setDescription(event.description || '');
    setDate(event.date);
    setTime(event.time);
    setVenue(event.venue);
    setTicketPrice(event.ticketPrice?.toString() || '0');
    setSeatCapacity(event.seatCapacity?.toString() || '100');
    setBannerFile(null); // reset file upload input
    setIsBuilderOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this event? This will erase all tickets and bookings.')) return;
    
    try {
      const res = await fetch(apiUrl(`/api/events/${eventId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        fetchAnalytics();
      } else {
        const data = await res.json();
        alert(data.message || 'Error deleting event');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting event.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setBuilderLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('venue', venue);
    formData.append('ticketPrice', ticketPrice);
    formData.append('seatCapacity', seatCapacity);
    if (bannerFile) {
      formData.append('banner', bannerFile);
    }

    const url = editingEventId 
      ? apiUrl(`/api/events/${editingEventId}`) 
      : apiUrl('/api/events');
      
    const method = editingEventId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (res.ok) {
        setIsBuilderOpen(false);
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setVenue('');
        setTicketPrice('0');
        setSeatCapacity('100');
        setBannerFile(null);
        fetchAnalytics();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save event information.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to Event API.');
    } finally {
      setBuilderLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Structuring dashboard statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error glass-panel">
        <h3>Analytics Dashboard Offline</h3>
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="btn btn-secondary mt-1">Retry Connecting</button>
      </div>
    );
  }

  const { kpis, eventStats, trendData } = analytics;

  return (
    <div className="dashboard-page-container">
      {/* Page Header */}
      <div className="dashboard-header-row">
        <div>
          <h2>Organizer Analytics</h2>
          <p className="welcome-subtext">Manage your events, analyze registrations, and view performance insights.</p>
        </div>
        <button type="button" onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={16} />
          <span>Create New Event</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Calendar size={24} /></div>
          <div className="kpi-info">
            <h4>Total Events</h4>
            <p>{kpis.totalEvents}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Ticket size={24} /></div>
          <div className="kpi-info">
            <h4>Tickets Sold</h4>
            <p>{kpis.totalTicketsSold}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><IndianRupee size={24} /></div>
          <div className="kpi-info">
            <h4>Total Revenue</h4>
            <p>₹{kpis.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Users size={24} /></div>
          <div className="kpi-info">
            <h4>Attendance Rate</h4>
            <p>{kpis.attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Analytics Graph Widget */}
      <div className="dashboard-analytics-box glass-panel">
        <div className="box-header-tabs">
          <h3>Performance Insights</h3>
          <div className="graph-selector-tabs">
            <button 
              className={`graph-tab ${chartType === 'tickets' ? 'active' : ''}`}
              onClick={() => setChartType('tickets')}
            >
              Tickets Sold
            </button>
            <button 
              className={`graph-tab ${chartType === 'revenue' ? 'active' : ''}`}
              onClick={() => setChartType('revenue')}
            >
              Revenue
            </button>
          </div>
        </div>
        
        <DashboardChart data={trendData} type={chartType} />
      </div>

      {/* Events Manager list */}
      <div className="dashboard-events-table-box glass-panel">
        <h3>Events Inventory</h3>
        
        {eventStats.length === 0 ? (
          <div className="table-empty-state">
            <p>You haven't listed any events yet. Click "Create New Event" to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date / Time</th>
                  <th>Price</th>
                  <th>Bookings Ratio</th>
                  <th>Revenue</th>
                  <th>Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventStats.map((item) => {
                  const attendanceString = item.ticketsSold > 0 
                    ? `${item.attendanceRate}% checked-in` 
                    : 'N/A';
                    
                  return (
                    <tr key={item.id || item._id}>
                      <td className="table-title-cell">{item.title}</td>
                      <td>
                        <div className="table-time-cell">
                          <span>{item.date}</span>
                          <span className="time-subtext">{item.time}</span>
                        </div>
                      </td>
                      <td>{item.ticketPrice === 0 ? 'Free' : `₹${item.ticketPrice}`}</td>
                      <td>
                        <div className="table-progress-cell">
                          <span>{item.ticketsSold} / {item.seatCapacity} sold</span>
                          <div className="table-bar-container">
                            <div 
                              className="table-bar-fill" 
                              style={{ width: `${Math.round((item.ticketsSold/item.seatCapacity)*100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="table-revenue-cell">₹{item.revenue}</td>
                      <td>
                        <span className={`badge ${item.attendanceRate > 70 ? 'badge-success' : 'badge-warning'}`}>
                          {attendanceString}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-cell">
                          <button 
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="action-btn edit-btn" 
                            title="Edit Event"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteEvent(item.id || item._id)}
                            className="action-btn delete-btn" 
                            title="Delete Event"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Builder Dialog Modal (New & Edit) */}
      {isBuilderOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel builder-modal-box">
            <div className="builder-modal-header">
              <h3>{editingEventId ? 'Modify Event Details' : 'Create Event Listing'}</h3>
              <button type="button" onClick={() => setIsBuilderOpen(false)} className="close-builder-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="builder-form">
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Summer Music Festival" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-input form-textarea" 
                  placeholder="Summarize event highlights, guidelines, schedules..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label className="form-label">Time</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 7:00 PM" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Venue Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Pragati Maidan, New Delhi" 
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Ticket Price (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="0 for Free" 
                    min="0"
                    step="0.01"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label className="form-label">Seat Capacity</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 200" 
                    min="1"
                    value={seatCapacity}
                    onChange={(e) => setSeatCapacity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Event Banner (Optional)</label>
                <div className="banner-upload-wrapper">
                  <input 
                    type="file" 
                    id="banner-file-input"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="banner-file-input" className="banner-file-label">
                    <Image size={18} />
                    <span>{bannerFile ? bannerFile.name : 'Select Banner Image...'}</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={builderLoading}>
                {builderLoading ? (
                  <>
                    <Loader2 size={16} className="spinner-icon-inline" />
                    <span>Publishing details...</span>
                  </>
                ) : (
                  editingEventId ? 'Apply Modifications' : 'Publish Event Listing'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .dashboard-page-container {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .dashboard-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-subtext {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .box-header-tabs {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.75rem;
          margin-bottom: 1rem;
        }

        .box-header-tabs h3 {
          margin: 0;
          color: #fff;
        }

        .graph-selector-tabs {
          display: flex;
          gap: 0.4rem;
          background: rgba(0,0,0,0.3);
          padding: 0.2rem;
          border-radius: var(--radius-sm);
        }

        .graph-tab {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-family: var(--font-family);
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          transition: var(--transition);
        }

        .graph-tab.active {
          background: var(--bg-secondary);
          color: var(--secondary);
        }

        /* Table extensions */
        .table-empty-state {
          padding: 3rem 0;
          text-align: center;
          color: var(--text-muted);
        }

        .table-title-cell {
          font-weight: 600;
          color: #fff;
        }

        .table-time-cell {
          display: flex;
          flex-direction: column;
        }

        .time-subtext {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .table-progress-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8rem;
          min-width: 120px;
        }

        .table-bar-container {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }

        .table-bar-fill {
          height: 100%;
          background: var(--secondary);
          border-radius: 2px;
        }

        .table-revenue-cell {
          font-weight: 700;
          color: var(--secondary);
        }

        .table-actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .edit-btn:hover {
          color: var(--secondary);
          border-color: rgba(0, 245, 212, 0.3);
          background: rgba(0, 245, 212, 0.05);
        }

        .delete-btn:hover {
          color: var(--danger);
          border-color: rgba(255, 0, 84, 0.3);
          background: rgba(255, 0, 84, 0.05);
        }

        /* Builder Modal details */
        .builder-modal-box {
          max-width: 580px !important;
          padding: 1.5rem 2rem !important;
        }

        .builder-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .builder-modal-header h3 {
          margin: 0;
          color: #fff;
        }

        .close-builder-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
        }

        .close-builder-btn:hover {
          color: var(--accent);
        }

        .banner-upload-wrapper {
          width: 100%;
        }

        .banner-file-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px dashed var(--border-glass-hover);
          padding: 0.85rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          color: var(--text-muted);
          font-weight: 500;
          font-size: 0.9rem;
          transition: var(--transition);
          text-align: center;
        }

        .banner-file-label:hover {
          border-color: var(--secondary);
          color: var(--secondary);
          background: rgba(0, 245, 212, 0.02);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.55);
          z-index: 1000;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .modal-content {
          width: 100%;
          max-width: 680px;
          background: rgba(16, 18, 34, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
          border-radius: 24px;
          padding: 1.5rem;
        }

        .builder-form {
          display: grid;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          border-radius: 14px;
          padding: 0.95rem 1rem;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          border-color: rgba(0, 245, 212, 0.5);
          box-shadow: 0 0 0 4px rgba(0, 245, 212, 0.08);
        }

        .form-textarea {
          min-height: 140px;
          resize: vertical;
        }

        .btn-full {
          width: 100%;
          padding: 0.95rem 1.25rem;
          border-radius: 14px;
        }

        .spinner-icon-inline {
          margin-right: 0.5rem;
          animation: spin 1s linear infinite;
        }

        .dashboard-loading {
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
