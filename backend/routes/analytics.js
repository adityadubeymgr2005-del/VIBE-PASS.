const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const getEventModel = () => db.Event();
const getTicketModel = () => db.Ticket();

// GET Analytics Dashboard (Organizer & Admin Only)
router.get('/', authenticateToken, authorizeRoles('organizer', 'admin'), async (req, res) => {
  try {
    const Event = getEventModel();
    const Ticket = getTicketModel();

    // 1. Fetch events
    let events = [];
    if (req.user.role === 'admin') {
      events = await Event.find({});
    } else {
      events = await Event.find({ organizer: req.user.id });
    }

    const eventIds = events.map(e => e._id);

    // 2. Fetch tickets/bookings for these events
    let tickets = [];
    if (eventIds.length > 0) {
      // Find all tickets corresponding to these event IDs
      // Using manual matching because in JSON model, we need to verify match
      const allTickets = await Ticket.find({});
      tickets = allTickets.filter(t => {
        const id = t.event._id || t.event;
        return eventIds.includes(id);
      });
    }

    // 3. Compute KPI metrics
    const totalEvents = events.length;
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let totalCheckedIn = 0;

    tickets.forEach(ticket => {
      totalTicketsSold += ticket.ticketQuantity;
      totalRevenue += ticket.totalAmount;
      if (ticket.checkedIn) {
        totalCheckedIn += ticket.ticketQuantity;
      }
    });

    const attendanceRate = totalTicketsSold > 0 
      ? Math.round((totalCheckedIn / totalTicketsSold) * 100) 
      : 0;

    // 4. Per-event breakdown
    const eventStats = events.map(event => {
      const eventTickets = tickets.filter(t => {
        const id = t.event._id || t.event;
        return id === event._id;
      });

      let sold = 0;
      let rev = 0;
      let scanned = 0;

      eventTickets.forEach(t => {
        sold += t.ticketQuantity;
        rev += t.totalAmount;
        if (t.checkedIn) {
          scanned += t.ticketQuantity;
        }
      });

      const rate = sold > 0 ? Math.round((scanned / sold) * 100) : 0;

      return {
        id: event._id,
        title: event.title,
        date: event.date,
        ticketPrice: event.ticketPrice,
        seatCapacity: event.seatCapacity,
        seatsAvailable: event.seatsAvailable,
        ticketsSold: sold,
        revenue: rev,
        attendanceRate: rate
      };
    });

    // Sort by tickets sold to get popular events
    const popularEvents = [...eventStats]
      .sort((a, b) => b.ticketsSold - a.ticketsSold)
      .slice(0, 5);

    res.status(200).json({
      kpis: {
        totalEvents,
        totalTicketsSold,
        totalRevenue,
        attendanceRate,
        totalCheckedIn
      },
      eventStats,
      popularEvents,
      // Provide time-based registration trend for plotting
      trendData: eventStats.map(e => ({
        label: e.title.length > 15 ? e.title.substring(0, 15) + '...' : e.title,
        ticketsSold: e.ticketsSold,
        revenue: e.revenue
      }))
    });

  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ message: 'Server error generating dashboard analytics' });
  }
});

module.exports = router;
