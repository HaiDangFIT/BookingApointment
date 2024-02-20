const router = require("express").Router();
const ctrls = require("../controllers/apointmentController");
const {
    verifyAccessToken,
    checkPermissionBooking,
} = require("../middlewares/verifyToken");

router.post("/patient", verifyAccessToken, ctrls.addBookingByPatient);
router.put("/patient/:id", verifyAccessToken, ctrls.cancelBookingByPatient);

module.exports = router;