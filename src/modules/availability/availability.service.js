const prisma = require("../../config/db");

exports.isAvailable = async (propertyId, startDate, endDate) => {
  const clash = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: "CONFIRMED",
      startDate: { lte: endDate },
      endDate: { gte: startDate }
    }
  });

  return !clash;
};
