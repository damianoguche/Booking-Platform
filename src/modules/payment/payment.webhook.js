const crypto = require("crypto");
const prisma = require("../../config/db");
const notificationService = require("../notification/notification.service");
const metrics = require("../admin/admin.metrics");
const Stripe = require("stripe");

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
        process.env.WEBHOOK_SECRET
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

exports.handleWebhook = async (req, res) => {
  // const provider = req.params.provider;
  let event;

  try {
    event = verifyWebhook("stripe", req);
  } catch (err) {
    console.error("Signature verification failed:", err.message);
    return res.status(401).send("Invalid Stripe signature");
  }

  if (event.type !== "payment_intent.succeeded") {
    return res.status(200).send("Ignored");
  }

  const intent = event.data.object;
  const reference = intent.id;
  const amount = intent.amount_received;

  const eventId = event.id;

  // Check if already processed
  const processed = await prisma.webhookEvent.findUnique({
    where: { id: eventId }
  });

  if (processed) {
    return res.status(200).send("Already processed");
  }

  // Save event
  await prisma.webhookEvent.create({
    data: {
      id: eventId,
      provider: "stripe"
    }
  });

  // try {
  //   // Idempotency check
  //   const existing = await prisma.payment.findUnique({
  //     where: { reference }
  //   });

  //   if (existing?.status === "SUCCESS") {
  //     return res.status(200).send("Already processed");
  //   }

  //   // Continue your business logic (booking, notification, metrics)
  //   res.status(200).send("OK");
  // } catch (err) {
  //   return res.status(400).send(`Webhook Error: ${err.message}`);
  // }

  return res.status(200).send("OK");
};
