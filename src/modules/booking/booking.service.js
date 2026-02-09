const prisma = require("../../config/db");

/**
 * Create booking safely (race-condition proof)
 * Pattern:
 * 1. Lock days (UPDATE status=AVAILABLE → BOOKED)
 * 2. Verify all days locked
 * 3. Create booking
 * 4. Attach bookingId to days
 * 5. Commit
 */
exports.createBooking = async (data, userId) => {
  return prisma.$transaction(async (tx) => {
    const EXPIRY_MINUTES = 20;
    const expires_at = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    /* ----------------------------------
       Validate Property
    ----------------------------------- */
    const property = await tx.property.findUnique({
      where: { id: data.propertyId }
    });

    if (!property) {
      throw new Error("Invalid property");
    }

    /* ----------------------------------
       Normalize Dates
    ----------------------------------- */
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      throw new Error("Invalid date range");
    }

    /* ----------------------------------
       Calculate Number of Days
    ----------------------------------- */
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const days = Math.ceil((endDate - startDate) / MS_PER_DAY);

    /* ----------------------------------
       Lock Days (Atomic Reservation)
    ----------------------------------- */
    const result = await tx.availability.updateMany({
      where: {
        propertyId: data.propertyId,
        date: {
          gte: startDate,
          lt: endDate
        },
        status: "AVAILABLE" // only lock free days
      },
      data: {
        status: "BOOKED"
      }
    });

    // If not all days were locked → fail
    if (result.count !== days) {
      throw new Error("Some dates are no longer available");
    }

    /* ----------------------------------
       Create Booking Record
    ----------------------------------- */
    const booking = await tx.booking.create({
      data: {
        propertyId: data.propertyId,
        userId,
        startDate,
        endDate,
        status: "PENDING",
        expires_at
      }
    });

    /* ----------------------------------
       Attach Booking to Days
    ----------------------------------- */
    await tx.availability.updateMany({
      where: {
        propertyId: data.propertyId,
        date: {
          gte: startDate,
          lt: endDate
        },
        status: "BOOKED",
        bookingId: null
      },
      data: {
        bookingId: booking.id
      }
    });

    /* ----------------------------------
       Return Booking
    ----------------------------------- */
    return booking;
  });
};

exports.cancelBooking = async (bookingId) => {
  return prisma.$transaction(async (tx) => {
    // Free days
    await tx.availability.updateMany({
      where: {
        bookingId
      },
      data: {
        status: "AVAILABLE",
        bookingId: null
      }
    });

    // Cancel booking
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED"
      }
    });
  });
};

exports.confirmBooking = async (bookingId) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        property: true
      }
    });

    if (!booking) {
      console.error("Invalid bookingId:", bookingId);
      throw new Error("Booking not found");
    }

    // Idempotent
    if (booking.status === "CONFIRMED") {
      return booking;
    }

    if (booking.status !== "PENDING") {
      throw new Error("Invalid state");
    }

    if (booking.expires_at && booking.expires_at < new Date()) {
      throw new Error("Booking expired");
    }

    // Update Booking
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        expires_at: null
      },
      include: {
        user: true,
        property: true
      }
    });

    return updated;
  });
};
