const prisma = require("../../config/db");
const metrics = require("../admin/admin.metrics");

// Payment Service (after gateway verification) triggers
// Payment confirmation
exports.processPayment = async (bookingId, amount, reference, provider) => {
  // Prevent duplicate payments
  const payment = await prisma.payment.upsert({
    where: {
      bookingId // must be unique in schema
    },
    update: {
      bookingId,
      amount,
      reference,
      status: "PENDING",
      provider
    },
    create: {
      bookingId,
      amount,
      reference,
      currency: "usd",
      status: "PENDING",
      provider
    }
  });

  return payment;
};
