const router = require("express").Router();
const ctrl = require("./user.controller");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");

// Public
router.post("/register", ctrl.register);
router.post("/login", ctrl.login);

// Admin-only
router.get("/", auth, authorize("admin"), ctrl.getUsers);
router.patch("/:id/role", auth, authorize("admin"), ctrl.changeRole);

module.exports = router;
