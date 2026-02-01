const router = require("express").Router();
const auth = require("../../middlewares/auth");
const ctrl = require("./payment.controller");

router.post("/", auth, ctrl.pay);

module.exports = router;
