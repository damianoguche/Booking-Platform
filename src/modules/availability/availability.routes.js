const router = require("express").Router();
const ctrl = require("./availability.controller");

router.get("/", ctrl.checkAvailability);

module.exports = router;
