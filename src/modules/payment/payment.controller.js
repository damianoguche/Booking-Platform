const { log } = require("../../utils/audit");
const metrics = require("../admin/admin.metrics");
const service = require("./payment.service");

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

    if (booking.status !== "PENDING") {
      return res.status(409).json({ message: "Invalid booking state" });
    }

    // Generate ref
    const reference = `BK_${Date.now()}_${Math.random()}`;

    // Create local payment record
    const payment = await service.processPayment(
      bookingId,
      amount,
      reference,
      provider
    );

    await metrics.pushMetrics(req.app.get("io"));

    // Create Stripe Checkout Session
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
            unit_amount: booking.property.basePrice * 100
          },
          quantity: 1
        }
      ],

      metadata: {
        bookingId: booking.id,
        paymentRef: payment.reference
      },

      success_url: `${process.env.FRONTEND_URL}/success?ref=${reference}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`
    });

    // Save Stripe session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeSessionId: session.id
      }
    });

    // Audit log
    log(req.user.id, "MAKE_PAYMENT", "Payment", {
      bookingId,
      amount,
      paymentId: payment.id,
      status: payment.status
    });

    // Return Checkout URL
    res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (e) {
    next(e);
  }
};
