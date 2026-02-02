const router = require("express").Router();
const auth = require("../../middlewares/auth");
const ctrl = require("./payment.controller");

// WEBHOOK ROUTE (NO AUTH, IP-RESTRICTED)
const webhook = require("./payment.webhook");

// Webhook endpoint (NO auth middleware)
router.post("/webhook", webhook.handleWebhook);

router.post("/", auth, ctrl.pay);

module.exports = router;
