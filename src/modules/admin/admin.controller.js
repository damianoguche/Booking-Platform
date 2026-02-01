const service = require("./admin.service");

exports.dashboard = async (req, res, next) => {
  try {
    const data = await service.getKpis();
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.bookings = async (req, res, next) => {
  try {
    const stats = await service.bookingStats();
    res.json(stats);
  } catch (e) {
    next(e);
  }
};

exports.payments = async (req, res, next) => {
  try {
    const stats = await service.paymentStats();
    res.json(stats);
  } catch (e) {
    next(e);
  }
};

exports.activity = async (req, res, next) => {
  try {
    const data = await service.recentActivity();
    res.json(data);
  } catch (e) {
    next(e);
  }
};
