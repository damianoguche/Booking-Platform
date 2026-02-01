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

exports.suspendUser = async (req, res, next) => {
  try {
    const user = await service.suspendUser(req.params.id);
    res.json({ message: "User suspended", user });
  } catch (e) {
    next(e);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await service.cancelBooking(req.params.id);
    res.json({ message: "Booking cancelled", booking });
  } catch (e) {
    next(e);
  }
};

exports.adjustPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const payment = await service.adjustPayment(req.params.id, amount);
    res.json({ message: "Payment adjusted", payment });
  } catch (e) {
    next(e);
  }
};

exports.suspendProperty = async (req, res, next) => {
  try {
    const property = await service.suspendProperty(req.params.id);
    res.json({ message: "Property suspended", property });
  } catch (e) {
    next(e);
  }
};
