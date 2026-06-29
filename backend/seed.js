const bcrypt = require('bcryptjs');
const db = require('./models/db');
const QRCode = require('qrcode');
const crypto = require('crypto');

async function seed() {
  console.log('Starting database seeding...');
  
  // Wait a small moment to allow model initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  const User = db.User();
  const Event = db.Event();
  const Ticket = db.Ticket();

  try {
    // 1. Clear existing data if fallback mode to avoid duplicate keys
    if (db.getDbStatus() === 'JSON_DB') {
      User.write([]);
      Event.write([]);
      Ticket.write([]);
      console.log('Cleared existing local JSON collections.');
    }

    // 2. Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const organizer = await User.create({
      name: 'Sarah Connor',
      email: 'organizer@test.com',
      password: hashedPassword,
      role: 'organizer'
    });

    const attendee = await User.create({
      name: 'John Doe',
      email: 'attendee@test.com',
      password: hashedPassword,
      role: 'user'
    });

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Seeded Users:');
    console.log(`- Organizer: organizer@test.com (password123)`);
    console.log(`- Attendee: attendee@test.com (password123)`);
    console.log(`- Admin: admin@test.com (password123)`);

    // 3. Create Events
    const event1 = await Event.create({
      title: 'Cosmic Techno Night',
      description: 'Experience an interstellar journey with deep synth beats, spectacular lasers, and an immersive soundscape by top celestial DJs.',
      date: '2026-08-15',
      time: '9:00 PM',
      venue: 'Nebula Club, Mumbai',
      ticketPrice: 45,
      seatCapacity: 150,
      seatsAvailable: 148, // 2 tickets booked below
      bannerUrl: '',
      organizer: organizer._id
    });

    const event2 = await Event.create({
      title: 'React Developer Summit 2026',
      description: 'The ultimate gathering of front-end engineers. Join workshops on state machines, Next.js architecture, and React compiler internals.',
      date: '2026-09-10',
      time: '9:00 AM',
      venue: 'Tech Plaza Center, Bengaluru',
      ticketPrice: 199,
      seatCapacity: 500,
      seatsAvailable: 500,
      bannerUrl: '',
      organizer: organizer._id
    });

    console.log('Seeded Events:');
    console.log(`- Cosmic Techno Night (₹45)`);
    console.log(`- React Developer Summit (₹199)`);

    // 4. Create an Initial Booking with QR Code
    const verifyCode = crypto.randomUUID();
    const qrDataUrl = await QRCode.toDataURL(verifyCode);

    const ticket = await Ticket.create({
      event: event1._id,
      attendee: attendee._id,
      ticketQuantity: 2,
      totalAmount: 90,
      paymentStatus: 'paid',
      paymentDetails: { method: 'UPI Simulation', transactionId: 'TXN-SEED-9827361' },
      qrCodeDataUrl: qrDataUrl,
      qrCodeVerifyCode: verifyCode,
      checkedIn: false
    });

    console.log('Seeded Ticket Booking:');
    console.log(`- Attendee booked 2 tickets for Cosmic Techno Night`);
    console.log(`- Verification Code: ${verifyCode}`);

    console.log('\nSeeding completed successfully! Database status:', db.getDbStatus());
    process.exit(0);

  } catch (error) {
    console.error('Seeding encountered an error:', error);
    process.exit(1);
  }
}

seed();
