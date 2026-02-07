const prisma = require("../../config/db");

function getDatesBetween(start, end) {
  const dates = [];
  let current = new Date(start);

  while (current < new Date(end)) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

exports.isAvailable = async (propertyId, startDate, endDate) => {
  const dates = getDatesBetween(startDate, endDate);

  const blocked = await prisma.availability.findMany({
    where: {
      propertyId,
      date: { in: dates },
      status: { not: "AVAILABLE" }
    }
  });

  // If any date is BOOKED/BLOCKED → reject.
  return blocked.length === 0;
};
