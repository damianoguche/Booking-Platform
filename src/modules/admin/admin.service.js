const prisma = require("../../config/db");
const notificationService = require("../notification/notification.service");

exports.getKpis = async () => {
  const [
    totalUsers,
    totalHosts,
    totalProperties,
    totalBookings,
    confirmedBookings,
    totalRevenue
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "host" } }),
    prisma.property.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS" }
    })
  ]);

  return {
    users: totalUsers,
    hosts: totalHosts,
    properties: totalProperties,
    bookings: totalBookings,
    confirmedBookings,
    revenue: totalRevenue._sum.amount || 0
  };
};

exports.bookingStats = async () => {
  return prisma.booking.groupBy({
    by: ["status"],
    _count: true
  });
};

exports.paymentStats = async () => {
  return prisma.payment.groupBy({
    by: ["status", "provider"],
    _count: true,
    _sum: { amount: true }
  });
};

exports.recentActivity = async () => {
  const [users, bookings, payments] = await Promise.all([
    prisma.user.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: { email: true, role: true, created_at: true }
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { startDate: "desc" }
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { id: "desc" }
    })
  ]);

  return { users, bookings, payments };
};

// Suspend a user (guest or host)
// exports.suspendUser = async (userId) => {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error("User not found");

//   return prisma.user.update({
//     where: { id: userId },
//     data: { role: "suspended" } // soft-block the account
//   });
// };

exports.suspendUser = async (userId) => {
  return prisma.$transaction(async (tx) => {
    // Suspend user (soft block)
    const suspendedUser = await tx.user.update({
      where: { id: userId },
      data: {
        role: "suspended"
      }
    });

    // Send notification AFTER successful update
    await notificationService.sendNotification({
      userId: suspendedUser.id,
      type: "ACCOUNT_SUSPENDED",
      message:
        "Your account has been suspended by an admin due to policy violation."
    });

    return suspendedUser;
  });
};

// Force-cancel a booking
// exports.cancelBooking = async (bookingId) => {
//   const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
//   if (!booking) throw new Error("Booking not found");

//   return prisma.booking.update({
//     where: { id: bookingId },
//     data: { status: "CANCELLED" }
//   });
// };

exports.cancelBooking = async (bookingId) => {
  // Atomically update booking
  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { property: true }
    });

    if (!booking) throw new Error("Booking not found");

    if (booking.status === "CANCELLED") {
      throw new Error("Booking already cancelled");
    }

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" }
    });

    return updatedBooking;
  });

  // Side-effect AFTER transaction commits
  await notificationService.sendNotification({
    userId: result.userId,
    type: "Booking Cancelled",
    message: `Your booking for ${result.property.name} has been cancelled by admin.`
  });

  return result;
};

// Adjust a payment
exports.adjustPayment = async (paymentId, newAmount) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found");

  return prisma.payment.update({
    where: { id: paymentId },
    data: { amount: newAmount }
  });
};

// Suspend property (disable new bookings)
exports.suspendProperty = async (propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });
  if (!property) throw new Error("Property not found");

  return prisma.property.update({
    where: { id: propertyId },
    data: { name: `[SUSPENDED] ${property.name}` }
  });
};
