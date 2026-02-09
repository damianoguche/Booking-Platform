const { log } = require("../../utils/audit");
const metrics = require("../admin/admin.metrics");
const service = require("./payment.service");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
  maxNetworkRetries: 3,
  timeout: 20000
});
const prisma = require("../../config/db");

exports.initStripePayment = async (req, res, next) => {
  const { bookingId, amount, email } = req.body;

  try {
    // Verify booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // if (booking.userId !== req.user?.id) {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    if (booking.status !== "PENDING") {
      return res.status(409).json({ message: "Invalid booking state" });
    }

    // Prevent duplicate payment
    const existing = await prisma.payment.findUnique({
      where: { bookingId }
    });

    if (existing && existing.status === "SUCCESS") {
      return res.status(400).json({
        message: "Booking already paid"
      });
    }

    // Generate ref
    const reference = `BK_${Date.now()}_${Math.random()}`;
    const provider = "Stripe";

    // Create local payment record
    const payment = await service.processPayment(
      bookingId,
      amount,
      reference,
      provider
    );

    await metrics.pushMetrics(req.app.get("io"));

    // Create Stripe Checkout Session
    // Verify payment later in payment.webhook.js
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: booking.property.name,
              description: booking.property.description
            },
            unit_amount: amount * 100
          },
          quantity: 1
        }
      ],

      metadata: {
        bookingId: booking.id,
        paymentRef: payment.reference
      },

      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html"

      // success_url: `${process.env.FRONTEND_URL}/success?ref=${reference}`,
      // cancel_url: `${process.env.FRONTEND_URL}/cancel`
    });

    // Save Stripe session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeSessionId: session.id
      }
    });

    // Audit log
    log(req.user?.id || "SYSTEM", "MAKE_PAYMENT", "Payment", {
      bookingId,
      amount,
      paymentId: payment.id,
      status: payment.status
    });

    // Send the URL to the frontend
    res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (e) {
    next(e);
  }
};
