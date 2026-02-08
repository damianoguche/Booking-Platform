const router = require("express").Router();
const auth = require("../../middlewares/auth");
const ctrl = require("./payment.controller");

router.post("/checkout", auth, ctrl.initStripePayment);

module.exports = router;
