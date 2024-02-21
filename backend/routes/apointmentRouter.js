const router = require("express").Router();
const ctrls = require("../controllers/apointmentController");
const {
    verifyAccessToken,
    checkPermissionBooking,
    checkPermissionDoctor
} = require("../middlewares/verifyToken");

router.post("/patient", [verifyAccessToken], ctrls.addBookingByPatient);
router.put("/patient/:id", [verifyAccessToken], ctrls.cancelBookingByPatient);
router.put("/:id", [verifyAccessToken, checkPermissionDoctor], ctrls.updateApointment);


module.exports = router;