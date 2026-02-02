const prisma = require("../../config/db");
const ExcelJS = require("exceljs");
const { Parser } = require("json2csv");

exports.exportBookingsCSV = async () => {
  const bookings = await prisma.booking.findMany({
    include: { user: true, property: true }
  });

  const parser = new Parser({
    fields: ["id", "user.email", "property.name", "status", "createdAt"]
  });

  return parser.parse(bookings);
};

exports.exportBookingsExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Bookings");

  sheet.columns = [
    { header: "Booking ID", key: "id" },
    { header: "Guest Email", key: "email" },
    { header: "Property", key: "property" },
    { header: "Status", key: "status" },
    { header: "Created At", key: "created_at" }
  ];

  const bookings = await prisma.booking.findMany({
    include: { user: true, property: true }
  });

  bookings.forEach((b) =>
    sheet.addRow({
      id: b.id,
      email: b.user.email,
      property: b.property.name,
      status: b.status,
      created_at: b.created_at
    })
  );

  return workbook;
};
