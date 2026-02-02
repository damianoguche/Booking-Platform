const nodemailer = require("nodemailer");
const axios = require("axios");
const prisma = require("../../config/db");

const transporter = nodemailer.createTransport({
  host: "smtp.google.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send email
const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text
  });
};

// Send SMS via generic API
const sendSMS = async (phone, message) => {
  await axios.post(process.env.SMS_API_URL, {
    to: phone,
    message
  });
};

// Unified send notification
exports.sendNotification = async ({ userId, type, message }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // Send email
  if (user.email) {
    await sendEmail(
      user.email,
      `Booking Platform Notification: ${type}`,
      message
    );
  }

  // Send SMS
  if (user.phone) {
    await sendSMS(user.phone, message);
  }

  // Log notification
  return prisma.notification.create({
    data: { userId, type, message }
  });
};
