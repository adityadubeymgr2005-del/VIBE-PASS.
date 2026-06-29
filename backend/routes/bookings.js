const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../models/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const getEventModel = () => db.Event();
const getTicketModel = () => db.Ticket();

// POST Book Ticket (Authenticated User)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { eventId, ticketQuantity, paymentDetails } = req.body;

    if (!eventId || !ticketQuantity || ticketQuantity <= 0) {
      return res.status(400).json({ message: 'Invalid event ID or ticket quantity' });
    }

    const Event = getEventModel();
    const Ticket = getTicketModel();

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check seat availability
    const quantity = parseInt(ticketQuantity);
    if (event.seatsAvailable < quantity) {
      return res.status(400).json({ 
        message: `Only ${event.seatsAvailable} tickets available. Cannot book ${quantity} tickets.` 
      });
    }

    // Calculate total amount
    const totalAmount = event.ticketPrice * quantity;

    // Generate unique verification code
    const qrCodeVerifyCode = crypto.randomUUID();

    // Generate QR Code data URL containing the verify code
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeVerifyCode);

    // Update seat capacity
    await Event.findByIdAndUpdate(eventId, {
      seatsAvailable: event.seatsAvailable - quantity
    });

    // Create the ticket booking (default status to paid to simulate successful payment gateway check)
    const newTicket = await Ticket.create({
      event: eventId,
      attendee: req.user.id,
      ticketQuantity: quantity,
      totalAmount,
      paymentStatus: 'paid',
      paymentDetails: paymentDetails || { method: 'Simulated Gateway' },
      qrCodeDataUrl,
      qrCodeVerifyCode,
      checkedIn: false
    });

    // Send back fully detailed ticket including event details
    res.status(201).json({
      message: 'Booking confirmed successfully!',
      ticket: {
        ...newTicket,
        event: {
          title: event.title,
          date: event.date,
          time: event.time,
          venue: event.venue,
          ticketPrice: event.ticketPrice
        }
      }
    });
  } catch (error) {
    console.error('Book ticket error:', error);
    res.status(500).json({ message: 'Server error booking ticket' });
  }
});

// GET My Bookings (Authenticated User)
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const Ticket = getTicketModel();
    const User = db.User();
    const Event = db.Event();

    // Fetch all bookings for logged-in user
    let bookings = await Ticket.find({ attendee: req.user.id });

    // Handle manual populates in mock DB
    if (db.getDbStatus() === 'JSON_DB') {
      const allEvents = await Event.find({});
      bookings = bookings.map(ticket => {
        const ev = allEvents.find(e => e._id === ticket.event);
        return {
          ...ticket,
          event: ev ? {
            _id: ev._id,
            title: ev.title,
            date: ev.date,
            time: ev.time,
            venue: ev.venue,
            ticketPrice: ev.ticketPrice,
            bannerUrl: ev.bannerUrl
          } : ticket.event
        };
      });
    } else {
      // Mongoose populate
      bookings = await Ticket.find({ attendee: req.user.id })
        .populate('event', 'title date time venue ticketPrice bannerUrl')
        .exec();
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Server error retrieving your bookings' });
  }
});

// GET Event Bookings (Organizer & Admin)
router.get('/event/:eventId', authenticateToken, authorizeRoles('organizer', 'admin'), async (req, res) => {
  try {
    const Event = getEventModel();
    const Ticket = getTicketModel();
    const User = db.User();

    // Verify ownership
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role !== 'admin' && event.organizer !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view bookings for this event' });
    }

    let bookings = await Ticket.find({ event: req.params.eventId });

    // Handle manual populates in mock DB
    if (db.getDbStatus() === 'JSON_DB') {
      const allUsers = await User.find({});
      bookings = bookings.map(ticket => {
        const usr = allUsers.find(u => u._id === ticket.attendee);
        return {
          ...ticket,
          attendee: usr ? {
            _id: usr._id,
            name: usr.name,
            email: usr.email
          } : ticket.attendee
        };
      });
    } else {
      // Mongoose populate
      bookings = await Ticket.find({ event: req.params.eventId })
        .populate('attendee', 'name email')
        .exec();
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get event bookings error:', error);
    res.status(500).json({ message: 'Server error retrieving event registrations' });
  }
});

module.exports = router;
