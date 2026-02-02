const router = require("express").Router();
const ctrl = require("./notification.controller");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");

router.post("/", auth, authorize("admin"), ctrl.send);

module.exports = router;
