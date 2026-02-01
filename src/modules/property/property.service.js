const prisma = require("../../config/db");

exports.createProperty = (data, hostId) => {
  return prisma.property.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      hostId
    }
  });
};

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
