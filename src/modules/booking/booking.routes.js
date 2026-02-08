const router = require("express").Router();
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const ctrl = require("./booking.controller");

router.post("/", auth, authorize("guest"), ctrl.create);
router.post("/internal/confirm", ctrl.confirm);

module.exports = router;
