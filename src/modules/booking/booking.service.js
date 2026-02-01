const prisma = require("../../config/db");
const availability = require("../availability/availability.service");

exports.createBooking = async (data, userId) => {
  // Validate property exists
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId }
  });

  if (!property) {
    throw new Error("Invalid property");
  }

  // Check availability
  const available = await availability.isAvailable(
    data.propertyId,
    new Date(data.startDate),
    new Date(data.endDate)
  );

  if (!available) {
    throw new Error("Property unavailable");
  }

  // Create booking
  return prisma.booking.create({
    data: {
      ...data,
      userId,
      status: "PENDING"
    }
  });
};
