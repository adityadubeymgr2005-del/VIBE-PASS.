const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const getEventModel = () => db.Event();
const getTicketModel = () => db.Ticket();

// POST Verify QR Code Check-in (Organizer & Admin Only)
router.post('/verify', authenticateToken, authorizeRoles('organizer', 'admin'), async (req, res) => {
  try {
    const { qrCodeVerifyCode } = req.body;

    if (!qrCodeVerifyCode) {
      return res.status(400).json({ message: 'QR verification code is required' });
    }

    const Ticket = getTicketModel();
    const Event = getEventModel();
    const User = db.User();

    // Find the ticket by verify code
    const ticket = await Ticket.findOne({ qrCodeVerifyCode });
    if (!ticket) {
      return res.status(404).json({ message: 'Invalid ticket. QR code not recognized.' });
    }

    // Find event to check ownership and details
    // Note: ticket.event can be an ID or populated object depending on database state
    const eventId = ticket.event._id || ticket.event;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Associated event not found' });
    }

    // Verify organizer owns the event or is admin
    if (req.user.role !== 'admin' && event.organizer !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You are not the organizer of this event' });
    }

    // Prevent duplicate entries
    if (ticket.checkedIn) {
      // Find attendee details to show in response
      const attendeeId = ticket.attendee._id || ticket.attendee;
      const attendee = await User.findById(attendeeId);
      const attendeeName = attendee ? attendee.name : 'Unknown Guest';

      return res.status(400).json({ 
        message: 'Duplicate entry detected! This ticket has already been scanned.',
        checkedInAt: ticket.checkedInAt,
        attendeeName,
        eventTitle: event.title,
        ticketQuantity: ticket.ticketQuantity
      });
    }

    // Update ticket state to checked in
    const checkinTime = new Date().toISOString();
    await Ticket.findByIdAndUpdate(ticket._id, {
      checkedIn: true,
      checkedInAt: checkinTime
    });

    // Fetch attendee details for response
    const attendeeId = ticket.attendee._id || ticket.attendee;
    const attendee = await User.findById(attendeeId);
    const attendeeName = attendee ? attendee.name : 'Guest';

    res.status(200).json({
      message: 'Check-in successful! Access granted.',
      attendeeName,
      eventTitle: event.title,
      ticketQuantity: ticket.ticketQuantity,
      checkedInAt: checkinTime
    });

  } catch (error) {
    console.error('QR checkin verification error:', error);
    res.status(500).json({ message: 'Server error processing check-in' });
  }
});

module.exports = router;
