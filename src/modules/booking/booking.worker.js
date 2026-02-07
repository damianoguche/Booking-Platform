const cron = require("node-cron");
const prisma = require("../config/db");

// Run every minute
cron.schedule("* * * * *", async () => {
  console.log("Running booking expiry job...");

  const now = new Date();

  const expired = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expires_at: {
        lt: now
      }
    }
  });

  // Use the below instead of looping
  for (const booking of expired) {
    await prisma.$transaction(async (tx) => {
      // Free days
      await tx.availability.updateMany({
        where: {
          bookingId: booking.id
        },
        data: {
          status: "AVAILABLE",
          bookingId: null
        }
      });

      // Expire booking
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "EXPIRED"
        }
      });
    });
  }
});

// In stead of looping
// await prisma.$transaction(async (tx) => {

//   const expired = await tx.booking.findMany({ ... });

//   await tx.availability.updateMany({
//     where: {
//       bookingId: { in: expired.map(b => b.id) }
//     },
//     data: {
//       status: "AVAILABLE",
//       bookingId: null
//     }
//   });

//   await tx.booking.updateMany({
//     where: {
//       id: { in: expired.map(b => b.id) }
//     },
//     data: {
//       status: "EXPIRED"
//     }
//   });

// });
