/**
 * Local Stripe Webhook Test Script
 *
 * Requirements:
 * - Stripe CLI installed (`stripe`)
 * - Local booking service running on BOOKING_URL
 * - .env loaded (BOOKING_URL, INTERNAL_KEY, STRIPE_WEBHOOK_SECRET)
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { exec } = require("child_process");

const prisma = new PrismaClient();

const TEST_BOOKING_ID = "BOOK_TEST_001";
const TEST_PAYMENT_REF = "PAY_TEST_001";

async function seedBookingAndPayment() {
  console.log("Seeding booking and payment...");

  // Delete old test records if exist
  await prisma.payment.deleteMany({ where: { reference: TEST_PAYMENT_REF } });
  await prisma.booking.deleteMany({ where: { id: TEST_BOOKING_ID } });

  const booking = await prisma.booking.create({
    data: {
      id: TEST_BOOKING_ID,
      propertyId: "PROP_TEST",
      userId: "USER_TEST",
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "PENDING",
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    }
  });

  const payment = await prisma.payment.create({
    data: {
      reference: TEST_PAYMENT_REF,
      bookingId: booking.id,
      amount: 10000,
      status: "PENDING"
    }
  });

  console.log("Booking created:", booking.id);
  console.log("Payment created:", payment.reference);
}

async function triggerStripeWebhook() {
  console.log("Triggering Stripe webhook...");

  const command = `stripe trigger checkout.session.completed \
--add checkout_session:metadata[paymentRef]=${TEST_PAYMENT_REF} \
--add checkout_session:metadata[bookingId]=${TEST_BOOKING_ID}`;

  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("Error triggering Stripe CLI:", err);
        return reject(err);
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve();
    });
  });
}

async function verifyResults() {
  console.log("Verifying database updates...");

  const payment = await prisma.payment.findUnique({
    where: { reference: TEST_PAYMENT_REF }
  });

  const booking = await prisma.booking.findUnique({
    where: { id: TEST_BOOKING_ID }
  });

  console.log("Payment status:", payment?.status);
  console.log("Booking status:", booking?.status);

  if (payment?.status === "SUCCESS" && booking?.status === "CONFIRMED") {
    console.log("Webhook processed successfully!");
  } else {
    console.log("Webhook processing failed or not finished yet.");
  }
}

async function main() {
  try {
    await seedBookingAndPayment();

    await triggerStripeWebhook();

    // Wait a few seconds for webhook to process
    console.log("Waiting 5 seconds for webhook processing...");
    await new Promise((res) => setTimeout(res, 5000));

    await verifyResults();
  } catch (err) {
    console.error("Test script error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
