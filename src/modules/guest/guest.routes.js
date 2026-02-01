const router = require("express").Router();
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const ctrl = require("./guest.controller");

router.get(
  "/bookings",
  auth,
  authorize("guest", "host", "admin"),
  ctrl.bookings
);

module.exports = router;
