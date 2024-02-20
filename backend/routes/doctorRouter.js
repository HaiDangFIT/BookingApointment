const router = require("express").Router();
const ctrls = require("../controllers/doctorController");
const {
    verifyAccessToken,
    isAdminOrHost,
    checkPermissionDoctor
} = require("../middlewares/verifyToken")

router.get("/", ctrls.getAllDoctor);
router.get("/count", ctrls.getCountDoctor);
router.get("/:id", ctrls.getDoctor);
router.put("/rating", [verifyAccessToken], ctrls.ratingsDoctor);

//Admin or Host
router.post("/", [verifyAccessToken, isAdminOrHost, checkPermissionDoctor], ctrls.addDoctor);
router.delete("/:id", [verifyAccessToken, isAdminOrHost], ctrls.deleteDoctor),
    router.put("/", [verifyAccessToken, isAdminOrHost, checkPermissionDoctor], ctrls.updateDoctor);

module.exports = router;