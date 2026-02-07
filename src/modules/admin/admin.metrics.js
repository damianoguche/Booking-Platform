const prisma = require("../../config/db");

exports.pushMetrics = async (io) => {
  if (!io) {
    throw new Error("Socket.IO instance not available");
  }

  const metricsPayload = {
    users: await prisma.user.count(),
    bookings: await prisma.booking.count(),
    properties: await prisma.property.count(),
    revenue: await prisma.payment.aggregate({
      _sum: { amount: true }
    })
  };

  io.emit("metrics:update", metricsPayload);

  return metricsPayload;
};
