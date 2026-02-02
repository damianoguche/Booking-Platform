const prisma = require("../../config/db");
const notificationService = require("../notification/notification.service");

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
