const crypto = require("crypto");
const prisma = require("../../config/db");
const notificationService = require("../notification/notification.service");
const metrics = require("../admin/admin.metrics");

const verifySignature = (req) => {
  const signature = req.headers["x-payment-signature"];
  const expected = crypto
    .createHmac("sha512", process.env.PAYMENT_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  return signature === expected;
};

exports.handleWebhook = async (req, res) => {
  try {
    if (!verifySignature(req)) {
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    if (event.event !== "payment.success") {
      return res.status(200).send("Ignored");
    }

    const { reference, amount } = event.data;

    // Idempotency check
    const existing = await prisma.payment.findUnique({
      where: { reference }
    });

    if (existing?.status === "SUCCESS") {
      return res.status(200).send("Already processed");
    }

    // Update payment
    const payment = await prisma.payment.update({
      where: { reference },
      data: {
        status: "SUCCESS",
        confirmed_at: new Date()
      }
    });

    // Confirm booking
    const booking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED" },
      include: { user: true, property: true }
    });

    // Notify guest
    await notificationService.sendNotification({
      userId: booking.userId,
      type: "Payment Confirmed",
      message: `Your payment for ${booking.property.name} has been confirmed. Booking is now active.`
    });

    // Push live metrics
    await metrics.pushMetrics(req.app.get("io"));

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook processing failed");
  }
};
