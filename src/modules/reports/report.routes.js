const router = require("express").Router();
const ctrl = require("./report.controller");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");

router.get("/bookings/csv", auth, authorize("admin"), ctrl.exportBookingsCSV);
router.get(
  "/bookings/excel",
  auth,
  authorize("admin"),
  ctrl.exportBookingsExcel
);

module.exports = router;
