const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = 5000;

// ========================================
// DATABASE
// ========================================

const db = new Database("vnl.db");

// Create bookings table if it does not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    event TEXT NOT NULL,
    hall TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT DEFAULT 'Atmakur, Nellore',
    advance_amount INTEGER NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_id TEXT DEFAULT '',
    razorpay_order_id TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    confirmed_at TEXT DEFAULT ''
  )
`);
  
// ========================================
// EXPRESS
// ========================================

app.use(express.json());

// ========================================
// CORS
// ========================================

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "http://localhost:5173"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );

  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ========================================
// VNL DECORATIONS
// ========================================

const halls = [
  "Sri Trikoteswara Raghavendra Function Hall",
  "TKR Function Hall",
  "Sreedhar Gardens"
];

const eventTypes = [
  "Haldi",
  "Reception",
  "Marriage Dinner",
  "Engagement",
  "Birthday Function",
  "Half Saree Function"
];

// ========================================
// HELPER
// ========================================

function isSlotBlocked(hall, date, time) {
  const booking = db.prepare(`
    SELECT id
    FROM bookings
    WHERE hall = ?
      AND date = ?
      AND time = ?
      AND (
        status = 'CONFIRMED'
        OR (
          status = 'PENDING'
          AND datetime(created_at) > datetime('now', '-15 minutes')
        )
      )
    LIMIT 1
  `).get(hall, date, time);

  return !!booking;
}

// ========================================
// HEALTH
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VNL Decorations server is working!"
  });
});

// ========================================
// GET HALLS
// ========================================

app.get("/api/halls", (req, res) => {
  res.json(halls);
});

// ========================================
// GET EVENT TYPES
// ========================================

app.get("/api/event-types", (req, res) => {
  res.json(eventTypes);
});

// ========================================
// GET ALL BOOKINGS
// ========================================

app.get("/api/bookings", (req, res) => {
  const bookings = db.prepare(`
    SELECT *
    FROM bookings
    ORDER BY id DESC
  `).all();

  res.json(bookings);
});

// ========================================
// CHECK AVAILABILITY
// ========================================

app.post("/api/check-availability", (req, res) => {
  const { hall, date, time } = req.body;

  if (!hall || !date || !time) {
    return res.status(400).json({
      available: false,
      message: "Hall, date and time are required."
    });
  }

  const blocked = isSlotBlocked(hall, date, time);

  if (blocked) {
    return res.json({
      available: false,
      message: "This slot is already booked."
    });
  }

  return res.json({
    available: true,
    message: "This slot is available."
  });
});

// ========================================
// CREATE PENDING BOOKING
// ========================================
//
// This happens BEFORE payment.
//
// PENDING booking:
// - temporarily holds the slot
// - does NOT appear on receiver calendar
//
// After successful Razorpay payment:
// PENDING → CONFIRMED
//
// ========================================

app.post("/api/bookings/pending", (req, res) => {
  const {
    customer,
    phone,
    email,
    event,
    hall,
    date,
    time,
    advanceAmount
  } = req.body;

  // ----------------------------------------
  // VALIDATION
  // ----------------------------------------

  if (
    !customer ||
    !phone ||
    !event ||
    !hall ||
    !date ||
    !time ||
    !advanceAmount
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Customer, phone, event, hall, date, time and advance amount are required."
    });
  }

  // ----------------------------------------
  // CHECK HALL
  // ----------------------------------------

  if (!halls.includes(hall)) {
    return res.status(400).json({
      success: false,
      message: "Invalid function hall."
    });
  }

  // ----------------------------------------
  // CHECK EVENT
  // ----------------------------------------

  if (!eventTypes.includes(event)) {
    return res.status(400).json({
      success: false,
      message: "Invalid event type."
    });
  }

  // ----------------------------------------
  // CHECK ADVANCE
  // ----------------------------------------

  const allowedAdvanceAmounts = [30000, 40000, 50000];
  const amount = Number(advanceAmount);

  if (!allowedAdvanceAmounts.includes(amount)) {
    return res.status(400).json({
      success: false,
      message:
        "Advance amount must be ₹30,000, ₹40,000 or ₹50,000."
    });
  }

  // ----------------------------------------
  // CHECK SLOT AGAIN
  // ----------------------------------------

  if (isSlotBlocked(hall, date, time)) {
    return res.status(409).json({
      success: false,
      message: "This slot is no longer available."
    });
  }

  // ----------------------------------------
  // CREATE PENDING BOOKING
  // ----------------------------------------

  const createdAt = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO bookings (
      customer,
      phone,
      email,
      event,
      hall,
      date,
      time,
      location,
      advance_amount,
      payment_status,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer,
    phone,
    email || "",
    event,
    hall,
    date,
    time,
    "Atmakur, Nellore",
    amount,
    "PENDING",
    "PENDING",
    createdAt
  );

  const booking = db.prepare(`
    SELECT *
    FROM bookings
    WHERE id = ?
  `).get(result.lastInsertRowid);

  console.log("");
  console.log("========================================");
  console.log("NEW PENDING BOOKING");
  console.log("========================================");
  console.log(booking);
  console.log("========================================");
  console.log("");

  return res.status(201).json({
    success: true,
    message: "Pending booking created.",
    booking
  });
});

// ========================================
// GET ONE BOOKING
// ========================================

app.get("/api/bookings/:id", (req, res) => {
  const id = Number(req.params.id);

  const booking = db.prepare(`
    SELECT *
    FROM bookings
    WHERE id = ?
  `).get(id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found."
    });
  }

  return res.json({
    success: true,
    booking
  });
});

// ========================================
// CONFIRM BOOKING
// ========================================
//
// TEMPORARY TEST ENDPOINT.
//
// Later Razorpay verification will call the
// same confirmation logic.
//
// ========================================

app.post("/api/bookings/:id/confirm", (req, res) => {
  const id = Number(req.params.id);

  const booking = db.prepare(`
    SELECT *
    FROM bookings
    WHERE id = ?
  `).get(id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found."
    });
  }

  if (booking.status === "CONFIRMED") {
    return res.json({
      success: true,
      message: "Booking is already confirmed.",
      booking
    });
  }

  // Make sure another confirmed booking did not
  // take this slot.
  const conflict = db.prepare(`
    SELECT id
    FROM bookings
    WHERE hall = ?
      AND date = ?
      AND time = ?
      AND status = 'CONFIRMED'
      AND id != ?
    LIMIT 1
  `).get(
    booking.hall,
    booking.date,
    booking.time,
    id
  );

  if (conflict) {
    return res.status(409).json({
      success: false,
      message: "This slot has already been confirmed by another booking."
    });
  }

  db.prepare(`
    UPDATE bookings
    SET
      status = 'CONFIRMED',
      payment_status = 'PAID',
      confirmed_at = ?
    WHERE id = ?
  `).run(
    new Date().toISOString(),
    id
  );

  const updatedBooking = db.prepare(`
    SELECT *
    FROM bookings
    WHERE id = ?
  `).get(id);

  console.log("");
  console.log("========================================");
  console.log("BOOKING CONFIRMED");
  console.log("========================================");
  console.log(updatedBooking);
  console.log("========================================");
  console.log("");

  return res.json({
    success: true,
    message: "Booking confirmed successfully.",
    booking: updatedBooking
  });
});

// ========================================
// RECEIVER DASHBOARD
// GET CONFIRMED BOOKINGS
// ========================================

app.get("/api/admin/bookings", (req, res) => {
  const { hall, month } = req.query;

  let sql = `
    SELECT *
    FROM bookings
    WHERE status = 'CONFIRMED'
  `;

  const params = [];

  if (hall) {
    sql += ` AND hall = ?`;
    params.push(hall);
  }

  if (month) {
    sql += ` AND date LIKE ?`;
    params.push(`${month}%`);
  }

  sql += ` ORDER BY date ASC, time ASC`;

  const bookings = db.prepare(sql).all(...params);

  return res.json({
    success: true,
    bookings
  });
});

// ========================================
// RECEIVER - GET ONE BOOKING
// ========================================

app.get("/api/admin/bookings/:id", (req, res) => {
  const id = Number(req.params.id);

  const booking = db.prepare(`
    SELECT *
    FROM bookings
    WHERE id = ?
  `).get(id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found."
    });
  }

  return res.json({
    success: true,
    booking
  });
});

// ========================================
// CANCEL BOOKING
// ========================================

app.delete("/api/admin/bookings/:id", (req, res) => {
  const id = Number(req.params.id);

  const booking = db.prepare(`
    SELECT *
    FROM bookings
    WHERE id = ?
  `).get(id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found."
    });
  }

  db.prepare(`
    DELETE FROM bookings
    WHERE id = ?
  `).run(id);

  console.log("BOOKING CANCELLED:", booking);

  return res.json({
    success: true,
    message: "Booking cancelled successfully.",
    booking
  });
});

// ========================================
// OLD CREATE BOOKING ENDPOINT
// ========================================
//
// Kept for compatibility.
// New customer flow should use:
// POST /api/bookings/pending
//
// ========================================

app.post("/api/bookings", (req, res) => {
  const {
    customer,
    phone,
    email,
    event,
    hall,
    date,
    time
  } = req.body;

  if (
    !customer ||
    !phone ||
    !event ||
    !hall ||
    !date ||
    !time
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Customer, phone, event, hall, date and time are required."
    });
  }

  if (isSlotBlocked(hall, date, time)) {
    return res.status(409).json({
      success: false,
      message: "This slot is already booked."
    });
  }

  const createdAt = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO bookings (
      customer,
      phone,
      email,
      event,
      hall,
      date,
      time,
      location,
      advance_amount,
      payment_status,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer,
    phone,
    email || "",
    event,
    hall,
    date,
    time,
    "Atmakur, Nellore",
    0,
    "NOT_REQUIRED",
    "CONFIRMED",
    createdAt
  );

  const booking = db.prepare(`
    SELECT *
    FROM bookings
    WHERE id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json({
    success: true,
    message: "Booking confirmed successfully!",
    booking
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("       VNL DECORATIONS SERVER");
  console.log("========================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Bookings: http://localhost:${PORT}/api/bookings`);
  console.log(`Admin: http://localhost:${PORT}/api/admin/bookings`);
  console.log("SQLite database: vnl.db");
  console.log("========================================");
  console.log("");
});