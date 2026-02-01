const { log } = require("../../utils/audit");
const service = require("./booking.service");

exports.create = async (req, res, next) => {
  try {
    const booking = await service.createBooking(req.body, req.user.id);

    // Audit log
    log(req.user.id, "CREATE_BOOKING", "Booking", {
      bookingId: booking.id,
      propertyId: booking.propertyId,
      startDate: booking.startDate,
      endDate: booking.endDate
    });

    res.json(booking);
  } catch (e) {
    next(e);
  }
};
