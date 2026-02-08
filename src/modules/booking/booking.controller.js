const { log } = require("../../utils/audit");
const service = require("./booking.service");
const metrics = require("../admin/admin.metrics");

exports.create = async (req, res, next) => {
  try {
    const booking = await service.createBooking(req.body, req.user.id);

    // Push metrics AFTER success
    const io = req.app.get("io");
    await metrics.pushMetrics(io);

    // Audit log
    log(req.user.id, "CREATE_BOOKING", "Booking", {
      bookingId: booking.id,
      propertyId: booking.propertyId,
      startDate: booking.startDate,
      endDate: booking.endDate
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (e) {
    next(e);
  }
};

exports.confirm = async (req, res) => {
  try {
    // Security
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { bookingId, paymentRef } = req.body;

    if (!bookingId || !paymentRef) {
      return res.status(400).json({ message: "Missing data" });
    }

    const booking = await service.confirmBooking(bookingId, paymentRef);

    // Push metrics AFTER success
    const io = req.app.get("io");
    await metrics.pushMetrics(io);

    res.json({
      success: true,
      booking
    });
  } catch (err) {
    console.error("Confirm booking error:", err.message);

    if (err.message === "Booking not found") {
      return res.status(404).json({ message: err.message });
    }

    if (err.message === "Booking expired") {
      return res.status(409).json({ message: err.message });
    }

    if (err.message === "Invalid state") {
      return res.status(409).json({ message: err.message });
    }

    res.status(500).json({ message: "Confirm failed" });
  }
};
