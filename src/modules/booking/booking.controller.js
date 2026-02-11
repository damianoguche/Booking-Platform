const { log } = require("../../utils/audit");
const service = require("./booking.service");
const metrics = require("../admin/admin.metrics");
const notificationService = require("../notification/notification.service");

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

exports.cancel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        message: "Missing bookingId"
      });
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Authorization(Ownership check)
    if (booking.userId !== userId) {
      return res.status(403).json({
        message: "Not allowed"
      });
    }

    // Idempotency
    if (booking.status === "CANCELLED") {
      return res.json({
        success: true,
        message: "Already cancelled"
      });
    }

    // Prevent cancel after confirmation (optional policy)
    if (booking.status === "CONFIRMED") {
      return res.status(409).json({
        success: false,
        message: "Confirmed bookings cannot be cancelled"
      });
    }

    // Atomic cancel
    await prisma.$transaction(async (tx) => {
      // Free availability
      await tx.availability.updateMany({
        where: {
          bookingId
        },
        data: {
          status: "AVAILABLE",
          bookingId: null
        }
      });

      // Update booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          expires_at: null
        }
      });
    });

    // Send notification (after commit)
    await notificationService.sendNotification({
      userId,
      type: "Booking Cancelled",
      message: `Your booking at ${booking.property.name} has been cancelled.`
    });

    // Metrics
    const io = req.app.get("io");
    await metrics.pushMetrics(io);

    // Audit
    log(userId, "CANCEL_BOOKING", "Booking", {
      bookingId,
      propertyId: booking.propertyId
    });

    return res.json({
      success: true,
      message: "Booking cancelled"
    });
  } catch (err) {
    console.error("Cancel booking error:", err);

    return res.status(500).json({
      message: "Cancel failed"
    });
  }
};

exports.confirm = async (req, res) => {
  try {
    // Security
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Missing data"
      });
    }

    // ----------------------------
    // ATOMIC DB CONFIRMATION
    // ----------------------------
    const booking = await service.confirmBooking(bookingId);

    // ----------------------------
    // ASYNC SIDE EFFECTS (NO FAIL)
    // ----------------------------
    Promise.allSettled([
      notificationService.sendNotification({
        userId: booking.userId,
        type: "Booking Confirmed",
        message: `Your booking for ${
          booking.property.name
        } from ${booking.startDate.toDateString()} 
        to ${booking.endDate.toDateString()} has been confirmed.`
      }),

      metrics.pushMetrics(req.app.get("io"))
    ]).catch((err) => {
      console.error("Post-confirm side effect failed:", err);
    });

    // ----------------------------
    // RESPONSE IMMEDIATELY
    // ----------------------------
    return res.json({
      success: true,
      booking
    });
  } catch (err) {
    if (err.message === "Booking not found") {
      return res.status(404).json({ message: err.message });
    }

    if (err.message === "Booking expired") {
      return res.status(409).json({ message: err.message });
    }

    if (err.message === "Invalid state") {
      return res.status(409).json({ message: err.message });
    }

    return res.status(500).json({ message: "Confirm failed" });
  }
};
