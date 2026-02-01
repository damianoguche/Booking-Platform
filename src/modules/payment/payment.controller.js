const { log } = require("../../utils/audit");
const service = require("./payment.service");

exports.pay = async (req, res, next) => {
  try {
    const { bookingId, amount } = req.body;
    const payment = await service.processPayment(bookingId, amount);

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
