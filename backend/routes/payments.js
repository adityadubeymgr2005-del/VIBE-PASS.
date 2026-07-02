const express = require('express');
const db = require('../models/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const QRCode = require('qrcode');
const crypto = require('crypto');

function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('Stripe secret key is not configured. Set STRIPE_SECRET_KEY in backend/.env.');
  }
  return require('stripe')(apiKey);
}

const router = express.Router();

const getEventModel = () => db.Event();
const getTicketModel = () => db.Ticket();

function parseQuantity(quantity) {
  const parsed = Number(quantity);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ message: 'Stripe secret key is not configured. Set STRIPE_SECRET_KEY in backend/.env.' });
  }

  try {
    const { eventId, ticketQuantity } = req.body;
    const quantity = parseQuantity(ticketQuantity);

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required to start checkout.' });
    }

    const Event = getEventModel();
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.seatsAvailable < quantity) {
      return res.status(400).json({ message: `Only ${event.seatsAvailable} tickets available. Please reduce quantity.` });
    }

    const totalAmount = Math.round(event.ticketPrice * quantity * 100);
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${eventId}`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: event.title,
              description: event.description.substring(0, 150)
            },
            unit_amount: totalAmount > 0 ? totalAmount / quantity : 0
          },
          quantity: quantity
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: req.user.id,
        eventId,
        quantity: String(quantity),
        totalAmount: String(totalAmount)
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout create error:', error);
    res.status(500).json({ message: 'Could not create Stripe checkout session.' });
  }
});

router.post('/confirm-booking', authenticateToken, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ message: 'Stripe secret key is not configured. Set STRIPE_SECRET_KEY in backend/.env.' });
  }

  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Checkout session ID is required.' });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment has not completed yet. Please complete checkout first.' });
    }

    if (session.metadata.userId !== req.user.id) {
      return res.status(403).json({ message: 'Session does not belong to the authenticated user.' });
    }

    const Ticket = getTicketModel();
    let existingBooking;
    if (db.getDbStatus() === 'JSON_DB') {
      const allTickets = await Ticket.find({});
      existingBooking = allTickets.find(t => t.paymentDetails && t.paymentDetails.sessionId === sessionId);
    } else {
      existingBooking = await Ticket.findOne({ 'paymentDetails.sessionId': sessionId });
    }

    if (existingBooking) {
      return res.status(200).json({ message: 'Booking already confirmed.', ticket: existingBooking });
    }

    const eventId = session.metadata.eventId;
    const quantity = parseQuantity(session.metadata.quantity);

    const Event = getEventModel();
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Related event not found.' });
    }

    if (event.seatsAvailable < quantity) {
      return res.status(400).json({ message: 'Not enough seats left for this event.' });
    }

    await Event.findByIdAndUpdate(eventId, {
      seatsAvailable: event.seatsAvailable - quantity
    });

    const qrCodeVerifyCode = crypto.randomUUID();
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeVerifyCode);
    const totalAmount = Number(session.metadata.totalAmount) / 100;

    const newTicket = await Ticket.create({
      event: eventId,
      attendee: req.user.id,
      ticketQuantity: quantity,
      totalAmount,
      paymentStatus: 'paid',
      paymentDetails: {
        method: 'stripe',
        sessionId: session.id,
        paymentIntentId: session.payment_intent ? session.payment_intent.id : null,
        amountReceived: session.amount_total,
        currency: session.currency
      },
      qrCodeDataUrl,
      qrCodeVerifyCode,
      checkedIn: false
    });

    res.status(201).json({
      message: 'Booking confirmed successfully via Stripe.',
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
    console.error('Stripe confirm booking error:', error);
    res.status(500).json({ message: 'Could not confirm booking after payment.' });
  }
});

module.exports = router;
