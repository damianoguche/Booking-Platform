const router = require("express").Router();
const ctrl = require("./admin.controller");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");

router.use(auth, authorize("admin"));

router.get("/dashboard", ctrl.dashboard);
router.get("/bookings", ctrl.bookings);
router.get("/payments", ctrl.payments);
router.get("/activity", ctrl.activity);

module.exports = router;
