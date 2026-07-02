import React from 'react';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { getImageUrl } from '../api';

export default function EventCard({ event, onClick, actionText = 'Get Tickets', isOrganizer = false }) {
  const { title, description, date, time, venue, ticketPrice, seatCapacity, seatsAvailable, bannerUrl } = event;
  
  // Calculate percentage of seats sold
  const soldSeats = seatCapacity - seatsAvailable;
  const selloutPercentage = Math.min(Math.round((soldSeats / seatCapacity) * 100), 100);
  const isSoldOut = seatsAvailable <= 0;

  // Format date nicely
  const formatDate = (dateStr) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch (e) {
      return dateStr;
    }
  };

  const getFullBannerUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop';
    return getImageUrl(url);
  };

  return (
    <div className="event-card" onClick={onClick}>
      <div className="event-banner-container">
        <img 
          src={getFullBannerUrl(bannerUrl)} 
          alt={title} 
          className="event-banner-img"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop';
          }}
        />
        <div className="event-price-badge">
          {ticketPrice === 0 ? 'FREE' : `₹${ticketPrice.toFixed(2)}`}
        </div>
      </div>

      <div className="event-card-content">
        <div className="event-card-date">
          <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {formatDate(date)} • {time}
        </div>
        
        <h3 className="event-card-title">{title}</h3>
        
        <p className="event-card-desc">{description}</p>
        
        <div className="event-card-info">
          <div className="event-card-info-item">
            <MapPin size={14} className="brand-accent" />
            <span>{venue.length > 25 ? venue.substring(0, 25) + '...' : venue}</span>
          </div>
        </div>

        <div className="capacity-tracker">
          <div className="capacity-label">
            <span>{isSoldOut ? 'Sold Out' : `${seatsAvailable} seats left`}</span>
            <span>{selloutPercentage}% Booked</span>
          </div>
          <div className="capacity-bar-container">
            <div 
              className="capacity-bar-fill" 
              style={{ 
                width: `${selloutPercentage}%`,
                background: isSoldOut 
                  ? 'var(--danger)' 
                  : 'linear-gradient(90deg, var(--primary), var(--secondary))'
              }} 
            />
          </div>
        </div>

        <button 
          className={`btn btn-full ${isSoldOut ? 'btn-ghost' : 'btn-primary'}`}
          disabled={isSoldOut}
          onClick={(e) => {
            e.stopPropagation(); // prevent card click
            if (!isSoldOut) onClick();
          }}
        >
          <Ticket size={16} />
          {isSoldOut ? 'Sold Out' : actionText}
        </button>
      </div>
    </div>
  );
}
