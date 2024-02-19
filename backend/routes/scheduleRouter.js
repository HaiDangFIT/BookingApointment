const router = require("express").Router();
const ctrls = require("../controllers/scheduleController");
const {
    verifyAccessToken,
    isAdminOrHost,
} = require("../middlewares/verifyToken");

router.get("/", ctrls.getAllSchedule);
router.get("/:id", ctrls.getSchedule);

router.get("/doctor/:id", [verifyAccessToken], ctrls.getSchedulesByDoctorID);

//ADMIN
router.post("/", [verifyAccessToken, isAdminOrHost], ctrls.addSchedule);

module.exports = router;