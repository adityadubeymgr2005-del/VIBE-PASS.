import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, Sparkles, Filter, AlertCircle } from 'lucide-react';
import EventCard from '../components/EventCard';
import { apiUrl } from '../api';

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // List of mock categories for filtering
  const categories = ['All', 'Music', 'Tech', 'Conference', 'Workshop', 'Business', 'Sports'];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/api/events'));
      if (!res.ok) throw new Error('Failed to load events data');
      const data = await res.ok ? await res.json() : [];
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load events list from the server.');
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on search query and category
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedCategory === 'All' || 
      event.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      event.description.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const handleCardClick = (id) => {
    navigate(`/events/${id}`);
  };

  return (
    <div className="home-page-container">
      {/* Hero Banner Section */}
      <header className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Discover Unforgettable Moments</span>
          </div>
          <h1 className="hero-title">
            Unlock Next-Level <span className="gradient-text">Event Experiences</span>
          </h1>
          <p className="hero-subtitle">
            Secure tickets instantly, get unique QR passes, and enjoy seamless access verification.
          </p>
        </div>
      </header>

      {/* Control Panel: Search & Filters */}
      <section className="search-filter-section glass-panel">
        <div className="search-bar-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            className="form-input search-input" 
            placeholder="Search events by name, description, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filter-wrapper">
          <div className="filter-label-icon">
            <Filter size={16} />
            <span>Categories:</span>
          </div>
          <div className="categories-list">
            {categories.map((category) => (
              <button 
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events Listing */}
      <section className="events-listing-section">
        <div className="listing-header">
          <div className="listing-title">
            <Flame className="flame-icon" size={20} />
            <h2>Upcoming Events</h2>
          </div>
          <span className="listing-count">{filteredEvents.length} events found</span>
        </div>

        {loading ? (
          <div className="listing-loading">
            <div className="loading-spinner"></div>
            <p>Loading upcoming experiences...</p>
          </div>
        ) : error ? (
          <div className="listing-error glass-panel">
            <AlertCircle className="error-icon" size={32} />
            <h3>Oops, something went wrong</h3>
            <p>{error}</p>
            <button onClick={fetchEvents} className="btn btn-secondary mt-1">Retry Loading</button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="listing-empty glass-panel">
            <h3>No Events Found</h3>
            <p>Try resetting your search filters or check back later for new event listings.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} 
              className="btn btn-ghost"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard 
                key={event._id} 
                event={event} 
                onClick={() => handleCardClick(event._id)}
              />
            ))}
          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .home-page-container {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .hero-banner {
          text-align: center;
          padding: 3.5rem 1.5rem;
          position: relative;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(131, 56, 236, 0.1);
          border: 1px solid var(--border-glass-hover);
          color: var(--secondary);
          font-weight: 600;
          font-size: 0.85rem;
          padding: 0.4rem 1rem;
          border-radius: 30px;
          letter-spacing: 0.5px;
        }

        .sparkle-icon {
          animation: spin 3s infinite linear;
        }

        .hero-title {
          font-size: 3.2rem;
          line-height: 1.2;
          font-weight: 800;
        }

        .hero-subtitle {
          color: var(--text-muted);
          font-size: 1.15rem;
          max-width: 600px;
        }

        /* Search Filter Styling */
        .search-filter-section {
          padding: 1.5rem 2rem !important;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .search-bar-wrapper {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          padding: 1rem 1rem 1rem 3rem !important;
          background: rgba(0, 0, 0, 0.3) !important;
          font-size: 1.05rem;
        }

        .category-filter-wrapper {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-label-icon {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .categories-list {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .category-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          padding: 0.45rem 1.1rem;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.85rem;
          font-family: var(--font-family);
          transition: var(--transition);
        }

        .category-btn:hover {
          color: #fff;
          border-color: var(--border-glass-hover);
        }

        .category-btn.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary-hover);
          box-shadow: 0 4px 12px var(--primary-glow);
        }

        /* Listing Section styling */
        .events-listing-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .listing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.75rem;
        }

        .listing-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .listing-title h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .flame-icon {
          color: var(--accent);
        }

        .listing-count {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Listing Empty/Loading/Error */
        .listing-loading, .listing-empty, .listing-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(131, 56, 236, 0.1);
          border-top: 3px solid var(--secondary);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        .listing-loading p {
          color: var(--text-muted);
          font-weight: 500;
        }

        .listing-error {
          border-color: rgba(255, 0, 84, 0.2);
        }

        .error-icon {
          color: var(--danger);
        }

        .mt-1 {
          margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.2rem;
          }
          .category-filter-wrapper {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}} />
    </div>
  );
}
