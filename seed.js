require("dotenv").config();
const prisma = require("./src/config/db");

async function main() {
  console.log("Seeding test data...");

  // USER
  const user = await prisma.user.upsert({
    where: { email: "testuser@example.com" },
    update: {},
    create: {
      id: "USER456",
      email: "testuser@example.com",
      name: "Test User",
      password: "hashedpassword"
    }
  });

  console.log("User:", user.id);

  // PROPERTY
  const property = await prisma.property.upsert({
    where: { id: "PROP123" },
    update: {},
    create: {
      id: "PROP123",
      hostId: user.id,
      name: "Test Apartment",
      description: "Test property for Stripe webhook flow",
      basePrice: 5000,
      city: "Lagos",
      country: "Nigeria",
      address: "23 Glover Str, Ebute Metta"
    }
  });

  console.log("Property:", property.id);

  // BOOKING
  const booking = await prisma.booking.upsert({
    where: { id: "BOOK98765" },
    update: {
      expires_at: new Date(Date.now() + 60 * 60 * 1000)
    },
    create: {
      id: "BOOK98765",
      userId: user.id,
      propertyId: property.id,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-05"),
      status: "PENDING",
      expires_at: new Date(Date.now() + 60 * 60 * 1000)
    }
  });

  console.log("Booking:", booking.id);

  // PAYMENT
  // const payment = await prisma.payment.upsert({
  //   where: { reference: "PAY12345" },
  //   update: {
  //     amount: 3000
  //   },
  //   create: {
  //     reference: "PAY12345",
  //     bookingId: booking.id,
  //     amount: 3000,
  //     status: "PENDING",
  //     currency: "usd",
  //     provider: "Stripe"
  //   }
  // });

  // console.log("Payment:", payment.reference);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
