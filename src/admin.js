require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

/* ===========================
   STATIC FILES (IMPORTANT)
=========================== */

app.use(express.static(path.join(__dirname, "..", "public")));

/* ===========================
   MOCK AUTH
=========================== */

function auth(req, res, next) {
  req.user = {
    id: "ADM001",
    role: "admin",
    name: "Damian"
  };
  next();
}

app.use(auth);

/* ===========================
   API ROUTES
=========================== */

app.get("/api/dashboard", (req, res) => {
  res.json({
    user: req.user,

    kpis: {
      bookings: 1284,
      revenue: 4200000,
      users: 612,
      fraud: 3,
      pendings: 12,
      properties: 3240,
      guests: 345,
      hosts: 230
    },

    recentBookings: [
      { id: "B221", user: "Ada", property: "Lekki", status: "confirmed" },
      { id: "B220", user: "James", property: "VI Flat", status: "pending" }
    ],

    system: {
      api: true,
      payments: true,
      webhooks: true,
      uptime: "3d 12h"
    }
  });
});

/* ===========================
   ADMIN ACTIONS
=========================== */

app.post("/api/admin/suspend-user", (req, res) => {
  res.json({ success: true });
});

app.post("/api/admin/cancel-booking", (req, res) => {
  res.json({ success: true });
});

/* ===========================
   START SERVER
=========================== */

app.listen(3000, () => {
  console.log("Admin running → http://localhost:3000");
});
