const { log } = require("../../utils/audit");
const service = require("./availability.service");

exports.checkAvailability = async (req, res, next) => {
  try {
    const { propertyId, start, end } = req.query;
    const available = await service.isAvailable(
      propertyId,
      new Date(start),
      new Date(end)
    );

    // Audit log
    log(req.user?.id, "CHECK_AVAILABILITY", "Availability", {
      propertyId,
      startDate: start,
      endDate: end,
      available
    });

    res.json({ available });
  } catch (e) {
    next(e);
  }
};
