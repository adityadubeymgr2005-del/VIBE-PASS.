console.log("Testing module imports...");
try {
  console.log("1. Loading db.js...");
  const db = require('./models/db');
  console.log("   Db status:", db.getDbStatus());
  
  console.log("2. Loading authMiddleware.js...");
  require('./middleware/authMiddleware');
  
  console.log("3. Loading route: auth.js...");
  require('./routes/auth');
  
  console.log("4. Loading route: events.js...");
  require('./routes/events');
  
  console.log("5. Loading route: bookings.js...");
  require('./routes/bookings');
  
  console.log("6. Loading route: checkin.js...");
  require('./routes/checkin');
  
  console.log("7. Loading route: analytics.js...");
  require('./routes/analytics');
  
  console.log("All modules imported successfully!");
  process.exit(0);
} catch (e) {
  console.error("Diagnostic failure:", e);
  process.exit(1);
}
