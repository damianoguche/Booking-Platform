const express = require("express");
const errorHandler = require("./middlewares/error");
const rawBody = require("./middlewares/rawBody");

const bookingRoutes = require("./modules/booking/booking.routes");
const availabilityRoutes = require("./modules/availability/availability.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const guestRoutes = require("./modules/guest/guest.routes");
const userRoutes = require("./modules/user/user.routes");
const propertyRoutes = require("./modules/property/property.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const notificationRoutes = require("./modules/notification/notification.routes");

const app = express();

// Without this → signature verification WILL FAIL
app.use(express.json({ verify: rawBody }));

app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", require("./modules/reports/report.routes"));

app.use(errorHandler);

module.exports = app;
