const router = require("express").Router();
const ctrl = require("./admin.controller");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");

router.use(auth, authorize("admin"));

router.get("/dashboard", ctrl.dashboard);
router.get("/bookings", ctrl.bookings);
router.get("/payments", ctrl.payments);
router.get("/activity", ctrl.activity);

router.patch("/users/:id/suspend", ctrl.suspendUser);
router.patch("/bookings/:id/cancel", ctrl.cancelBooking);
router.patch("/payments/:id/adjust", ctrl.adjustPayment);
router.patch("/properties/:id/suspend", ctrl.suspendProperty);

module.exports = router;
