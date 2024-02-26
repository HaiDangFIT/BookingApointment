const router = require("express").Router();
const ctrls = require("../controllers/apointmentController");
const {
    verifyAccessToken,
    checkPermissionBooking
} = require("../middlewares/verifyToken");

router.get("/", verifyAccessToken, ctrls.getApointment);
router.post("/patient", [verifyAccessToken], ctrls.addBookingByPatient);
router.put("/patient/:id", [verifyAccessToken], ctrls.cancelBookingByPatient);
router.put("/:id", [verifyAccessToken, checkPermissionBooking], ctrls.updateApointment);


module.exports = router;