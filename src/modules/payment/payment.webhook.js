const crypto = require("crypto");
const prisma = require("../../config/db");
const notificationService = require("../notification/notification.service");
const metrics = require("../admin/admin.metrics");
const Stripe = require("stripe");
const axios = require("axios");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover"
});

const verifyWebhook = (provider, req) => {
  switch (provider) {
    case "stripe":
      const signature = req.headers["stripe-signature"];
      if (!signature) {
        throw new Error("Missing Stripe signature");
      }

      return stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

    case "paystack":
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest("hex");
      return hash === req.headers["x-paystack-signature"] ? req.body : null;

    case "flutterwave":
      return req.headers["verif-hash"] === process.env.FLW_SECRET_HASH
        ? req.body
        : null;

    default:
      return null;
  }
};

// exports.handleWebhook = async (req, res) => {
//   try {
//     if (!verifySignature(req)) {
//       return res.status(401).send("Invalid signature");
//     }

//     const event = req.body;

//     if (event.event !== "payment.success") {
//       return res.status(200).send("Ignored");
//     }

//     const { reference, amount } = event.data;

//     // Idempotency check
//     const existing = await prisma.payment.findUnique({
//       where: { reference }
//     });

//     if (existing?.status === "SUCCESS") {
//       return res.status(200).send("Already processed");
//     }

//     // Update payment
//     const payment = await prisma.payment.update({
//       where: { reference },
//       data: {
//         status: "SUCCESS",
//         confirmed_at: new Date()
//       }
//     });

//     // Confirm booking
//     const booking = await prisma.booking.update({
//       where: { id: payment.bookingId },
//       data: { status: "CONFIRMED" },
//       include: { user: true, property: true }
//     });

//     // Notify guest
//     await notificationService.sendNotification({
//       userId: booking.userId,
//       type: "Payment Confirmed",
//       message: `Your payment for ${booking.property.name} has been confirmed. Booking is now active.`
//     });

//     // Push live metrics
//     await metrics.pushMetrics(req.app.get("io"));

//     res.status(200).send("OK");
//   } catch (err) {
//     console.error("Webhook error:", err);
//     res.status(500).send("Webhook processing failed");
//   }
// };

exports.handleStripeWebhook = async (req, res) => {
  console.log("Webhook received");

  let event;

  try {
    event = verifyWebhook("stripe", req);
  } catch (err) {
    console.error("Signature failed:", err.message);
    return res.status(401).send("Invalid signature");
  }

  const eventId = event.id;

  console.log("Stripe Event:", {
    id: event.id,
    type: event.type
  });

  try {
    if (event.type !== "checkout.session.completed") {
      return res.status(200).send("Ignored");
    }

    // -----------------------------
    // DATABASE TRANSACTION ONLY
    // -----------------------------
    const alreadyProcessed = await prisma.$transaction(async (tx) => {
      const exists = await tx.webhookEvent.findUnique({
        where: { id: eventId }
      });

      if (exists) return true;

      await tx.webhookEvent.create({
        data: {
          id: eventId,
          provider: "stripe"
        }
      });

      return false;
    });

    // Idempotency exit
    if (alreadyProcessed) {
      console.log("Webhook already processed:", eventId);
      return res.status(200).send("OK");
    }

    // -----------------------------
    // BUSINESS LOGIC AFTER COMMIT
    // -----------------------------
    await handleSuccess(event.data.object);

    console.log(`Stripe webhook processed: ${event.id}`);

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Processing failed");
  }
};

async function handleSuccess(session) {
  if (!session.metadata?.paymentRef || !session.metadata?.bookingId) {
    throw new Error("Missing Stripe metadata");
  }

  if (!process.env.BOOKING_URL) {
    throw new Error("BOOKING_URL not configured");
  }

  const reference = session.metadata.paymentRef;
  const bookingId = session.metadata.bookingId;

  console.log(`Processing payment: ${reference}`);
  console.log("metadata:", { reference, bookingId });
  console.log("Stripe amount:", session.amount_total);

  if (session.payment_status !== "paid") {
    throw new Error("Session not paid");
  }

  let payment;

  // -----------------------------
  // DB TRANSACTION + VERIFICATION
  // -----------------------------
  await prisma.$transaction(async (tx) => {
    payment = await tx.payment.findUnique({
      where: { reference }
    });

    if (!payment) {
      throw new Error(`Payment not found: ${reference}`);
    }

    if (payment.status === "SUCCESS") {
      console.log(`Already processed: ${reference}`);
      return;
    }

    // 💡 Amount check HERE
    const stripeAmount = session.amount_total;

    if (payment.amount !== stripeAmount) {
      throw new Error(
        `Amount mismatch: DB=${payment.amount}, Stripe=${stripeAmount}`
      );
    }

    await tx.payment.update({
      where: { reference },
      data: {
        status: "SUCCESS",
        confirmed_at: new Date()
      }
    });

    console.log(`Payment verified: ${reference}`);
  });

  // -----------------------------
  // EXTERNAL CALL AFTER COMMIT
  // -----------------------------
  try {
    await axios.post(
      `${process.env.BOOKING_URL}/api/bookings/internal/confirm`,
      {
        bookingId,
        paymentRef: reference
      },
      {
        timeout: 5000,
        headers: {
          "x-internal-key": process.env.INTERNAL_KEY
        }
      }
    );

    console.log(`Booking confirmed: ${bookingId}`);
  } catch (err) {
    console.error("Booking confirm failed:", err.message);

    await prisma.payment.updateMany({
      where: { reference },
      data: { status: "CONFIRM_PENDING" }
    });

    throw err;
  }
}
