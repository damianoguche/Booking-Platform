const prisma = require("../../config/db");

exports.processPayment = async (bookingId, amount) => {
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount,
      status: "SUCCESS",
      provider: "STRIPE"
    }
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" }
  });

  return payment;
};
