const express = require("express");
const errorHandler = require("./middlewares/error");

const bookingRoutes = require("./modules/booking/booking.routes");
const availabilityRoutes = require("./modules/availability/availability.routes");
const paymentRoutes = require("./modules/payment/payment.routes");
const guestRoutes = require("./modules/guest/guest.routes");
const userRoutes = require("./modules/user/user.routes");
const propertyRoutes = require("./modules/property/property.routes");

const app = express();
app.use(express.json());

app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

module.exports = app;
