const router = require("express").Router();
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");
const ctrl = require("./booking.controller");

router.post("/create", auth, authorize("guest"), ctrl.create);
router.post("/cancel", auth, authorize("guest"), ctrl.cancel);
router.post("/confirm", ctrl.confirm);

module.exports = router;
