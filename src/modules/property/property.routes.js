const router = require("express").Router();
const ctrl = require("./property.controller");
const auth = require("../../middlewares/auth");
const authorize = require("../../middlewares/authorize");

// Host actions
router.post("/", auth, authorize("host", "admin"), ctrl.create);
router.get("/me", auth, authorize("host", "admin"), ctrl.myProperties);
router.put("/:id", auth, authorize("host", "admin"), ctrl.update);
router.delete("/:id", auth, authorize("host", "admin"), ctrl.remove);

// Admin-only
router.get("/", auth, authorize("admin"), ctrl.all);

module.exports = router;
