const prisma = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async ({ name, email, password, role = "guest" }) => {
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role }
  });

  return user;
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  if (user.role === "suspended") {
    throw new Error("Account is suspended");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token };
};

exports.getAllUsers = () =>
  prisma.user.findMany({
    select: { id: true, email: true, role: true, created_at: true }
  });

exports.updateRole = (id, role) =>
  prisma.user.update({
    where: { id },
    data: { role }
  });
