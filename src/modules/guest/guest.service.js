const prisma = require("../../config/db");

exports.getBookings = (userId) =>
  prisma.booking.findMany({ where: { userId } });
