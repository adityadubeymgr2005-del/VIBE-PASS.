import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, Users, ArrowLeft, Plus, Minus, Ticket, AlertCircle } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

export default function EventDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/events/${id}`);
      if (!res.ok) throw new Error('Event not found');
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      console.error(err);
      setError('The event details could not be found or the server is offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (type) => {
    if (!event) return;
    if (type === 'inc') {
      if (ticketQuantity < event.seatsAvailable) {
        setTicketQuantity(ticketQuantity + 1);
      }
    } else {
      if (ticketQuantity > 1) {
        setTicketQuantity(ticketQuantity - 1);
      }
    }
  };

  const handleBookClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'user') {
      alert('Only Attendees can book event tickets.');
      return;
    }
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    setIsPaymentOpen(false);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventId: event._id,
          ticketQuantity: ticketQuantity,
          paymentDetails
        })
      });

      const data = await res.json();

      if (res.ok) {
        setBookingSuccessMsg('Tickets booked successfully! Redirecting to your tickets dashboard...');
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      } else {
        alert(data.message || 'Error completing your ticket reservation.');
        fetchEventDetails(); // refresh details (like seats)
      }
    } catch (err) {
      console.error(err);
      alert('Network error registering booking details.');
    } finally {
      setLoading(false);
    }
  };

  const getFullBannerUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200&auto=format&fit=crop';
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  if (loading && !event) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading event information...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="error-container glass-panel">
        <AlertCircle size={48} className="error-icon" />
        <h2>Failed to load event</h2>
        <p>{error || 'Event details unavailable'}</p>
        <Link to="/" className="btn btn-secondary mt-1">Back to Home</Link>
      </div>
    );
  }

  const isSoldOut = event.seatsAvailable <= 0;
  const totalPrice = event.ticketPrice * ticketQuantity;

  return (
    <div className="details-page-container">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to Events</span>
      </Link>

      {bookingSuccessMsg && (
        <div className="alert alert-success success-booking-alert">
          <span>{bookingSuccessMsg}</span>
        </div>
      )}

      <div className="details-layout">
        {/* Main Details Panel */}
        <div className="details-main glass-panel">
          <div className="details-banner-box">
            <img 
              src={getFullBannerUrl(event.bannerUrl)} 
              alt={event.title} 
              className="details-banner-img"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200&auto=format&fit=crop';
              }}
            />
          </div>

          <div className="details-header-info">
            <h1 className="details-title">{event.title}</h1>
            
            <div className="details-meta-grid">
              <div className="details-meta-item">
                <Calendar className="meta-icon" size={18} />
                <div>
                  <h4>Date</h4>
                  <p>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="details-meta-item">
                <Clock className="meta-icon" size={18} />
                <div>
                  <h4>Time</h4>
                  <p>{event.time}</p>
                </div>
              </div>

              <div className="details-meta-item">
                <MapPin className="meta-icon" size={18} />
                <div>
                  <h4>Venue</h4>
                  <p>{event.venue}</p>
                </div>
              </div>

              <div className="details-meta-item">
                <Users className="meta-icon" size={18} />
                <div>
                  <h4>Availability</h4>
                  <p>{isSoldOut ? 'Sold Out' : `${event.seatsAvailable} of ${event.seatCapacity} seats left`}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="details-description">
            <h3>Event Description</h3>
            <p>{event.description}</p>
          </div>
        </div>

        {/* Sidebar Booking Card */}
        <div className="details-sidebar glass-panel">
          <h3>Ticket Reservation</h3>
          
          <div className="ticket-pricing-row">
            <span className="price-label">Ticket Price:</span>
            <span className="price-value">{event.ticketPrice === 0 ? 'FREE' : `₹${event.ticketPrice.toFixed(2)}`}</span>
          </div>

          {!isSoldOut && (
            <div className="quantity-selector-box">
              <span className="quantity-label">Quantity:</span>
              <div className="quantity-controls">
                <button 
                  className="control-btn" 
                  onClick={() => handleQuantityChange('dec')}
                  disabled={ticketQuantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className="quantity-number">{ticketQuantity}</span>
                <button 
                  className="control-btn" 
                  onClick={() => handleQuantityChange('inc')}
                  disabled={ticketQuantity >= event.seatsAvailable}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="total-calculation-row">
            <span className="total-label">Total Cost:</span>
            <span className="total-value">₹{totalPrice.toFixed(2)}</span>
          </div>

          {isSoldOut ? (
            <button className="btn btn-ghost btn-full" disabled>
              Sold Out
            </button>
          ) : user && user.role !== 'user' ? (
            <div className="role-warning-booking">
              <p>You are logged in as an <strong>{user.role}</strong>. Bookings are only available for Attendees.</p>
            </div>
          ) : (
            <button onClick={handleBookClick} className="btn btn-primary btn-full btn-book-details">
              <Ticket size={18} />
              <span>{user ? 'Book Tickets Now' : 'Login to Book Tickets'}</span>
            </button>
          )}
          
          <div className="booking-perks">
            <p>✓ Instant email check-in receipt</p>
            <p>✓ Secure unique verification QR code</p>
            <p>✓ Fast check-in scanner entrance gate</p>
          </div>
        </div>
      </div>

      {/* Dynamic Payment Simulator Overlay */}
      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={totalPrice}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .details-page-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: var(--transition);
          width: fit-content;
        }

        .back-link:hover {
          color: #fff;
          transform: translateX(-4px);
        }

        .success-booking-alert {
          border-color: rgba(0, 245, 212, 0.3) !important;
          animation: scalePulse 0.3s ease;
        }

        .details-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
        }

        .details-main {
          padding: 1.5rem !important;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .details-banner-box {
          height: 380px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #171330;
        }

        .details-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .details-title {
          font-size: 2.2rem;
          line-height: 1.3;
          margin-bottom: 1.5rem;
          color: #fff;
        }

        .details-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .details-meta-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .meta-icon {
          color: var(--secondary);
          margin-top: 0.25rem;
        }

        .details-meta-item h4 {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 0.15rem;
          letter-spacing: 0.5px;
        }

        .details-meta-item p {
          font-size: 0.95rem;
          color: #fff;
          font-weight: 500;
        }

        .details-description h3 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          color: #fff;
        }

        .details-description p {
          color: var(--text-muted);
          line-height: 1.8;
          white-space: pre-line;
        }

        /* Sidebar container */
        .details-sidebar {
          height: fit-content;
          position: sticky;
          top: 90px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border-color: var(--border-glass-hover) !important;
        }

        .details-sidebar h3 {
          font-size: 1.2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.5rem;
          margin-bottom: 0;
          color: #fff;
        }

        .ticket-pricing-row, .total-calculation-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-label, .total-label {
          color: var(--text-muted);
          font-weight: 500;
        }

        .price-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--secondary);
        }

        .total-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--secondary);
        }

        .quantity-selector-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
        }

        .quantity-label {
          color: var(--text-muted);
          font-weight: 500;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .control-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          color: #fff;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .control-btn:hover:not(:disabled) {
          background: var(--primary);
          border-color: var(--primary-hover);
        }

        .control-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .quantity-number {
          font-weight: 700;
          font-size: 1.1rem;
          min-width: 20px;
          text-align: center;
        }

        .btn-book-details {
          padding: 0.9rem !important;
          font-size: 1.05rem;
        }

        .role-warning-booking {
          background: rgba(254, 228, 64, 0.05);
          border: 1px solid rgba(254, 228, 64, 0.15);
          color: var(--warning);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          text-align: center;
          line-height: 1.4;
        }

        .booking-perks {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .booking-perks p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          text-align: center;
          gap: 1rem;
        }

        @media (max-width: 900px) {
          .details-layout {
            grid-template-columns: 1fr;
          }
          .details-sidebar {
            position: relative;
            top: 0;
          }
        }
      `}} />
    </div>
  );
}
