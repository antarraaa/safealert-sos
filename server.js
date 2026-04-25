// ============================================================
//  SafeAlert — Backend Server (Node.js + Express)
//  Routes:
//    POST /api/sos          → Send SOS alert
//    GET  /api/alerts       → Get all alerts (admin)
//    PUT  /api/alerts/:id   → Update alert status
//    GET  /api/contacts     → Get emergency contacts
//    POST /api/contacts     → Add emergency contact
//    DELETE /api/contacts/:id → Remove contact
//    GET  /api/stats        → Dashboard stats
// ============================================================

const express = require("express");
const cors    = require("cors");
const { v4: uuidv4 } = require("uuid");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ── In-memory database (replace with MongoDB/PostgreSQL in production) ──
let alerts = [
  {
    id: uuidv4(),
    userId: "demo-user",
    userName: "Demo User",
    initials: "DU",
    latitude: 19.8762,
    longitude: 75.3433,
    address: "Aurangabad, Maharashtra, India",
    accuracy: 15,
    status: "resolved",
    message: "Test alert — system check",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    respondedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    notifiedContacts: ["Mom", "Rahul"]
  }
];

let contacts = [
  { id: uuidv4(), name: "Mom",      phone: "+91-9876543210", relation: "Mother",  active: true },
  { id: uuidv4(), name: "Rahul",    phone: "+91-9123456780", relation: "Friend",  active: true },
  { id: uuidv4(), name: "Priya",    phone: "+91-9988776655", relation: "Sister",  active: true },
  { id: uuidv4(), name: "Hospital", phone: "+91-240-2334455", relation: "Medical", active: true }
];

// ── Helper ──────────────────────────────────────────────────
function formatTimestamp(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

// ── POST /api/sos ────────────────────────────────────────────
// Body: { userId, userName, latitude, longitude, address, accuracy, message }
app.post("/api/sos", (req, res) => {
  const {
    userId    = "anonymous",
    userName  = "Unknown User",
    latitude  = 19.8762,
    longitude = 75.3433,
    address   = "Unknown Location",
    accuracy  = 0,
    message   = ""
  } = req.body;

  // Validate coordinates
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ success: false, error: "Invalid coordinates" });
  }

  const activeContacts = contacts.filter(c => c.active).map(c => c.name);

  const alert = {
    id: uuidv4(),
    userId,
    userName,
    initials: userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
    latitude,
    longitude,
    address,
    accuracy,
    status: "new",           // new | pending | resolved
    message,
    timestamp: new Date().toISOString(),
    respondedAt: null,
    notifiedContacts: activeContacts
  };

  alerts.unshift(alert);   // newest first

  // Simulate notifying contacts (in production: send SMS / push notification)
  console.log(`[SOS] Alert ${alert.id} — Notified: ${activeContacts.join(", ")}`);

  res.status(201).json({
    success: true,
    alertId: alert.id,
    message: `Alert sent to ${activeContacts.length} contacts`,
    notifiedContacts: activeContacts,
    timestamp: alert.timestamp,
    formattedTime: formatTimestamp(alert.timestamp)
  });
});

// ── GET /api/alerts ──────────────────────────────────────────
// Query: ?status=new|pending|resolved&limit=20
app.get("/api/alerts", (req, res) => {
  const { status, limit = 50 } = req.query;
  let result = [...alerts];
  if (status) result = result.filter(a => a.status === status);
  result = result.slice(0, parseInt(limit));

  res.json({
    success: true,
    count: result.length,
    alerts: result.map(a => ({
      ...a,
      formattedTime: formatTimestamp(a.timestamp)
    }))
  });
});

// ── PUT /api/alerts/:id ──────────────────────────────────────
// Body: { status: "pending" | "resolved" }
app.put("/api/alerts/:id", (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ success: false, error: "Alert not found" });

  const { status } = req.body;
  const validStatuses = ["new", "pending", "resolved"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status" });
  }

  alert.status = status;
  if (status === "resolved") alert.respondedAt = new Date().toISOString();

  res.json({ success: true, alert: { ...alert, formattedTime: formatTimestamp(alert.timestamp) } });
});

// ── DELETE /api/alerts/:id ───────────────────────────────────
app.delete("/api/alerts/:id", (req, res) => {
  const idx = alerts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Alert not found" });
  alerts.splice(idx, 1);
  res.json({ success: true, message: "Alert deleted" });
});

// ── GET /api/contacts ────────────────────────────────────────
app.get("/api/contacts", (req, res) => {
  res.json({ success: true, contacts });
});

// ── POST /api/contacts ───────────────────────────────────────
// Body: { name, phone, relation }
app.post("/api/contacts", (req, res) => {
  const { name, phone, relation = "Contact" } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, error: "Name and phone required" });

  const contact = { id: uuidv4(), name, phone, relation, active: true };
  contacts.push(contact);
  res.status(201).json({ success: true, contact });
});

// ── DELETE /api/contacts/:id ─────────────────────────────────
app.delete("/api/contacts/:id", (req, res) => {
  const idx = contacts.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Contact not found" });
  contacts.splice(idx, 1);
  res.json({ success: true, message: "Contact removed" });
});

// ── PATCH /api/contacts/:id/toggle ──────────────────────────
app.patch("/api/contacts/:id/toggle", (req, res) => {
  const contact = contacts.find(c => c.id === req.params.id);
  if (!contact) return res.status(404).json({ success: false, error: "Contact not found" });
  contact.active = !contact.active;
  res.json({ success: true, contact });
});

// ── GET /api/stats ───────────────────────────────────────────
app.get("/api/stats", (req, res) => {
  const total    = alerts.length;
  const newCount = alerts.filter(a => a.status === "new").length;
  const resolved = alerts.filter(a => a.status === "resolved").length;
  const pending  = alerts.filter(a => a.status === "pending").length;
  const activeContacts = contacts.filter(c => c.active).length;

  res.json({
    success: true,
    stats: { total, new: newCount, resolved, pending, activeContacts, totalContacts: contacts.length }
  });
});

// ── Catch-all → serve frontend ───────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🛡  SafeAlert server running at http://localhost:${PORT}`);
  console.log(`   API  → http://localhost:${PORT}/api`);
  console.log(`   App  → http://localhost:${PORT}\n`);
});
