const prisma = require("../../config/db");

exports.createProperty = async (data, hostId) => {
  return prisma.$transaction(async (tx) => {
    // 1. Create property
    const property = await tx.property.create({
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.price,
        city: data.city,
        country: data.country,
        address: data.address,
        hostId
      }
    });

    // 2. Generate availability (per day)
    const today = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 2);

    const days = [];

    for (let d = new Date(today); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        propertyId: property.id,
        date: new Date(d),
        status: "AVAILABLE"
      });
    }

    await tx.availability.createMany({
      data: days,
      skipDuplicates: true
    });

    return property;
  });
};

// For range-based availability
// async function generateAvailability(propertyId) {
//   const today = new Date();
//   const end = new Date();
//   end.setFullYear(end.getFullYear() + 2);

//   const days = [];

//   for (let d = new Date(today); d <= end; d.setDate(d.getDate() + 1)) {
//     days.push({
//       propertyId,
//       date: new Date(d),
//       status: "AVAILABLE"
//     });
//   }

//   await prisma.availability.createMany({
//     data: days,
//     skipDuplicates: true
//   });
// }

// exports.createProperty = (data, hostId) => {
//   return prisma.property.create({
//     data: {
//       name: data.name,
//       description: data.description,
//       basePrice: data.price,
//       city: data.city,
//       country: data.country,
//       address: data.address
//     }
//   });
// };

exports.getHostProperties = (hostId) => {
  return prisma.property.findMany({
    where: { hostId }
  });
};

exports.updateProperty = async (id, data, hostId) => {
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property || property.hostId !== hostId) {
    throw new Error("Unauthorized or property not found");
  }

  return prisma.property.update({
    where: { id },
    data
  });
};

exports.deleteProperty = async (id, hostId) => {
  const property = await prisma.property.findUnique({ where: { id } });

  if (!property || property.hostId !== hostId) {
    throw new Error("Unauthorized or property not found");
  }

  return prisma.property.delete({ where: { id } });
};

exports.getAllProperties = () =>
  prisma.property.findMany({ include: { host: true } });
