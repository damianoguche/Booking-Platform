const { log } = require("../../utils/audit");
const service = require("./guest.service");

exports.bookings = async (req, res, next) => {
  try {
    const data = await service.getBookings(req.user.id);

    // Audit log
    log(req.user.id, "VIEW_BOOKINGS", "Guest", { count: data.length });

    res.json(data);
  } catch (e) {
    next(e);
  }
};
