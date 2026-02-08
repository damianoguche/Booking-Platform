const prisma = require("../../config/db");
const metrics = require("../admin/admin.metrics");
const notificationService = require("../notification/notification.service");

// Payment Service (after gateway verification) triggers
// Payment confirmation
exports.processPayment = async (bookingId, amount, reference, provider) => {
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount,
      reference,
      currency: "NGN",
      status: "PENDING",
      provider
    }
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
    include: {
      property: true,
      user: true
    }
  });

  await notificationService.sendNotification({
    userId: booking.userId,
    type: "Booking Confirmed",
    message: `Your booking for ${booking.property.name} from ${booking.startDate} to ${booking.endDate} has been confirmed.`
  });

  return payment;
};
