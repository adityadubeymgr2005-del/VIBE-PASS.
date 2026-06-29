const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const getEventModel = () => db.Event();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, webp, gif) are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET all events (Public)
router.get('/', async (req, res) => {
  try {
    const Event = getEventModel();
    const { search } = req.query;
    let events = await Event.find({});
    
    // Manual filtering for JSON DB fallback, Mongo would normally do this in find()
    if (search) {
      const searchLower = search.toLowerCase();
      events = events.filter(e => 
        e.title.toLowerCase().includes(searchLower) || 
        e.description.toLowerCase().includes(searchLower) ||
        e.venue.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort events by date (upcoming first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// GET single event (Public)
router.get('/:id', async (req, res) => {
  try {
    const Event = getEventModel();
    const event = await Event.findById(req.id || req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error('Fetch event error:', error);
    res.status(500).json({ message: 'Server error fetching event details' });
  }
});

// POST Create Event (Organizer & Admin)
router.post('/', authenticateToken, authorizeRoles('organizer', 'admin'), upload.single('banner'), async (req, res) => {
  try {
    const { title, description, date, time, venue, ticketPrice, seatCapacity } = req.body;

    if (!title || !description || !date || !time || !venue || ticketPrice === undefined || !seatCapacity) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    let bannerUrl = '';
    if (req.file) {
      bannerUrl = `/uploads/${req.file.filename}`;
    }

    const price = parseFloat(ticketPrice);
    const capacity = parseInt(seatCapacity);

    const Event = getEventModel();
    const newEvent = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      ticketPrice: price,
      seatCapacity: capacity,
      seatsAvailable: capacity, // initial availability
      bannerUrl,
      organizer: req.user.id
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error creating event' });
  }
});

// PUT Update Event (Organizer & Admin)
router.put('/:id', authenticateToken, authorizeRoles('organizer', 'admin'), upload.single('banner'), async (req, res) => {
  try {
    const Event = getEventModel();
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && event.organizer !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const { title, description, date, time, venue, ticketPrice, seatCapacity } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (venue) updateData.venue = venue;
    
    if (ticketPrice !== undefined) {
      updateData.ticketPrice = parseFloat(ticketPrice);
    }

    if (seatCapacity !== undefined) {
      const newCapacity = parseInt(seatCapacity);
      const soldTickets = event.seatCapacity - event.seatsAvailable;
      if (newCapacity < soldTickets) {
        return res.status(400).json({ 
          message: `Cannot reduce capacity below already sold tickets count (${soldTickets})` 
        });
      }
      updateData.seatCapacity = newCapacity;
      updateData.seatsAvailable = newCapacity - soldTickets;
    }

    if (req.file) {
      // If old banner exists, try to delete it
      if (event.bannerUrl && event.bannerUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', event.bannerUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.bannerUrl = `/uploads/${req.file.filename}`;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error updating event' });
  }
});

// DELETE Event (Organizer & Admin)
router.delete('/:id', authenticateToken, authorizeRoles('organizer', 'admin'), async (req, res) => {
  try {
    const Event = getEventModel();
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && event.organizer !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Delete image if exists
    if (event.bannerUrl && event.bannerUrl.startsWith('/uploads/')) {
      const bannerPath = path.join(__dirname, '..', event.bannerUrl);
      if (fs.existsSync(bannerPath)) {
        fs.unlinkSync(bannerPath);
      }
    }

    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error deleting event' });
  }
});

module.exports = router;
