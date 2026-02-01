const prisma = require("../../config/db");

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
