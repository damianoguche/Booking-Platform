const service = require("./report.service");

exports.exportBookingsCSV = async (req, res) => {
  const csv = await service.exportBookingsCSV();
  res.header("Content-Type", "text/csv");
  res.attachment("bookings.csv");
  res.send(csv);
};

exports.exportBookingsExcel = async (req, res) => {
  const workbook = await service.exportBookingsExcel();
  res.header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.attachment("bookings.xlsx");
  await workbook.xlsx.write(res);
  res.end();
};
