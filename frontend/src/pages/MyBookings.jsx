import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, MapPin, QrCode, CheckCircle2, XCircle, ArrowRight, Download, RefreshCw } from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selected ticket for modal QR pass view
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5000/api/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to retrieve ticket history');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve tickets list. Ensure backend service is online.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPass = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleClosePass = () => {
    setSelectedTicket(null);
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getFullBannerUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop';
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  return (
    <div className="bookings-page-container">
      <div className="bookings-header">
        <div className="bookings-title-box">
          <Ticket size={24} className="ticket-icon-purple" />
          <h2>My Event Passes</h2>
        </div>
        <button onClick={fetchBookings} className="btn btn-ghost btn-refresh">
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="bookings-loading">
          <div className="loading-spinner"></div>
          <p>Retransmitting booking logs...</p>
        </div>
      ) : error ? (
        <div className="bookings-error glass-panel">
          <h3>Failed to sync tickets</h3>
          <p>{error}</p>
          <button onClick={fetchBookings} className="btn btn-secondary mt-1">Re-authenticate & Sync</button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bookings-empty glass-panel">
          <h3>No Active Tickets</h3>
          <p>You haven't reserved any tickets yet. Explore upcoming experiences on the browse tab.</p>
          <a href="/" className="btn btn-primary mt-1">Browse Events</a>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => {
            const ev = booking.event || {};
            const isCheckedIn = booking.checkedIn;
            
            return (
              <div key={booking._id} className="booking-ticket-card glass-panel">
                <div className="ticket-visual-header">
                  <img 
                    src={getFullBannerUrl(ev.bannerUrl)} 
                    alt={ev.title} 
                    className="ticket-header-img"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop';
                    }}
                  />
                  <div className={`ticket-status-overlay ${isCheckedIn ? 'status-scanned' : 'status-valid'}`}>
                    {isCheckedIn ? 'CHECKED IN' : 'VALID PASS'}
                  </div>
                </div>

                <div className="ticket-body">
                  <div className="ticket-date-time">
                    <Calendar size={12} />
                    <span>{formatDate(ev.date)} • {ev.time}</span>
                  </div>

                  <h3 className="ticket-title">{ev.title || 'Event Pass'}</h3>

                  <div className="ticket-venue-info">
                    <MapPin size={14} className="venue-map-pin" />
                    <span>{ev.venue || 'TBA'}</span>
                  </div>

                  <div className="ticket-split-details">
                    <div className="split-col">
                      <span className="split-label">Quantity</span>
                      <span className="split-value">{booking.ticketQuantity} Pass(es)</span>
                    </div>
                    <div className="split-col">
                      <span className="split-label">Total Price</span>
                      <span className="split-value">₹{booking.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleOpenPass(booking)}
                    className={`btn btn-full ${isCheckedIn ? 'btn-ghost' : 'btn-primary'} btn-view-pass`}
                  >
                    <QrCode size={16} />
                    <span>{isCheckedIn ? 'View Checked-in Pass' : 'View Access QR Pass'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Ticket Pass Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={handleClosePass}>
          <div className="modal-content glass-panel qr-pass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-pass-header">
              <h3>Admission Pass</h3>
              <button className="close-pass-btn" onClick={handleClosePass}>&times;</button>
            </div>

            <div className="qr-pass-body">
              <div className="qr-pass-visual">
                <div className="qr-pass-status-badge">
                  {selectedTicket.checkedIn ? (
                    <div className="badge-scanned">
                      <XCircle size={14} />
                      <span>Scanned Entry</span>
                    </div>
                  ) : (
                    <div className="badge-valid">
                      <CheckCircle2 size={14} />
                      <span>Gate Pass Active</span>
                    </div>
                  )}
                </div>
                
                {/* Real-time Base64 QR Code */}
                <div className="qr-code-holder">
                  <img 
                    src={selectedTicket.qrCodeDataUrl} 
                    alt="Ticket QR Code" 
                    className="embedded-qr-code" 
                  />
                  {selectedTicket.checkedIn && <div className="qr-void-overlay">VOID</div>}
                </div>
                
                <div className="manual-verify-string">
                  <span className="code-label">TICKET ID:</span>
                  <span className="code-value">{selectedTicket.qrCodeVerifyCode}</span>
                </div>
              </div>

              <div className="qr-pass-text-info">
                <h2 className="pass-title">{(selectedTicket.event && selectedTicket.event.title) || 'Event Admission'}</h2>
                <p className="pass-venue">
                  <strong>Venue:</strong> {(selectedTicket.event && selectedTicket.event.venue) || 'TBA'}
                </p>
                <p className="pass-date">
                  <strong>Schedule:</strong> {formatDate(selectedTicket.event && selectedTicket.event.date)} at {selectedTicket.event && selectedTicket.event.time}
                </p>
                <p className="pass-quantity">
                  <strong>Quantity:</strong> {selectedTicket.ticketQuantity} Attendee(s)
                </p>
                
                <div className="gate-instructions">
                  <p>Show this QR code at the entrance scanner gate. Ensure screen brightness is high.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .bookings-page-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .bookings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.75rem;
        }

        .bookings-title-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .bookings-title-box h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .ticket-icon-purple {
          color: var(--primary);
        }

        .btn-refresh {
          padding: 0.4rem 1rem !important;
          font-size: 0.85rem !important;
        }

        .bookings-loading, .bookings-empty, .bookings-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          text-align: center;
          gap: 1rem;
        }

        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .booking-ticket-card {
          padding: 0 !important;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-color: rgba(255, 255, 255, 0.05);
        }

        .ticket-visual-header {
          height: 120px;
          position: relative;
          background: #171330;
        }

        .ticket-header-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.65;
        }

        .ticket-status-overlay {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          padding: 0.3rem 0.6rem;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .status-valid {
          background: rgba(0, 245, 212, 0.2);
          color: var(--secondary);
          border: 1px solid rgba(0, 245, 212, 0.4);
        }

        .status-scanned {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-decoration: line-through;
        }

        .ticket-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }

        .ticket-date-time {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--secondary);
          font-weight: 600;
        }

        .ticket-title {
          font-size: 1.15rem;
          color: #fff;
          margin-bottom: 0.25rem;
          line-height: 1.3;
        }

        .ticket-venue-info {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .venue-map-pin {
          color: var(--primary-hover);
        }

        .ticket-split-details {
          display: flex;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
          border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
          padding: 0.75rem 0;
          margin: 0.5rem 0;
        }

        .split-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .split-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .split-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
        }

        .btn-view-pass {
          margin-top: auto;
        }

        /* QR Pass Modal design */
        .qr-pass-modal {
          max-width: 440px !important;
          border-color: var(--secondary) !important;
          padding: 1.5rem !important;
        }

        .qr-pass-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.5rem;
        }

        .qr-pass-header h3 {
          margin: 0;
          color: #fff;
        }

        .close-pass-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.8rem;
          cursor: pointer;
          line-height: 1;
        }

        .close-pass-btn:hover {
          color: var(--accent);
        }

        .qr-pass-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .qr-pass-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .qr-pass-status-badge {
          margin-bottom: 1rem;
        }

        .badge-valid, .badge-scanned {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.25rem 0.65rem;
          border-radius: 20px;
        }

        .badge-valid {
          background: rgba(0, 245, 212, 0.1);
          color: var(--secondary);
          border: 1px solid rgba(0, 245, 212, 0.2);
        }

        .badge-scanned {
          background: rgba(255, 0, 84, 0.1);
          color: var(--danger);
          border: 1px solid rgba(255, 0, 84, 0.2);
        }

        .qr-code-holder {
          background: white;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          position: relative;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        .embedded-qr-code {
          width: 170px;
          height: 170px;
          display: block;
        }

        .qr-void-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(7, 5, 15, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--danger);
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: 2px;
          border-radius: var(--radius-md);
          transform: rotate(-15deg);
          border: 3px dashed var(--danger);
          margin: 1.5rem;
        }

        .manual-verify-string {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
        }

        .code-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .code-value {
          font-family: monospace;
          font-size: 0.8rem;
          color: #fff;
          word-break: break-all;
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .qr-pass-text-info {
          width: 100%;
          text-align: center;
        }

        .pass-title {
          font-size: 1.3rem;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .pass-venue, .pass-date, .pass-quantity {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .gate-instructions {
          margin-top: 1rem;
          background: rgba(131, 56, 236, 0.05);
          border-top: 1px solid rgba(131, 56, 236, 0.1);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
        }

        .gate-instructions p {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
      `}} />
    </div>
  );
}
