const router = require("express").Router();
const ctrls = require("../controllers/scheduleController");

router.get("/", ctrls.getAllSchedule);
router.get("/:id", ctrls.getSchedule);

module.exports = router;