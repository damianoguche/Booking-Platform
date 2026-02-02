const { log } = require("../../utils/audit");
const metrics = require("../admin/admin.metrics");
const service = require("./payment.service");

exports.pay = async (req, res, next) => {
  try {
    const { bookingId, amount } = req.body;
    const payment = await service.processPayment(bookingId, amount);
    await metrics.pushMetrics(req.app.get("io"));

    // Audit log
    log(req.user.id, "MAKE_PAYMENT", "Payment", {
      bookingId,
      amount,
      paymentId: payment.id,
      status: payment.status
    });

    res.json(payment);
  } catch (e) {
    next(e);
  }
};
