const router = require("express").Router();
const auth = require("../../middlewares/auth");
const ctrl = require("./payment.controller");
const webhook = require("./payment.webhook");

// router.post("/webhooks/stripe", webhook.handleWebhook);
router.post("/", auth, ctrl.pay);

module.exports = router;
