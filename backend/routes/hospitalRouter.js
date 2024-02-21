const router = require("express").Router();
const ctrls = require("../controllers/hospitalController");
const {
    verifyAccessToken,
    isAdmin,
    isAdminOrHost
} = require("../middlewares/verifyToken");

router.get("/", ctrls.getAllHospitals);
router.get("/count", ctrls.getCountHospital);
router.get("/:id", ctrls.getHospital);

//Admin
router.post("/", [verifyAccessToken, isAdmin], ctrls.addHospital);
router.delete("/:id", [verifyAccessToken, isAdmin], ctrls.deleteHospital);
router.put("/:id", [verifyAccessToken, isAdmin], ctrls.updateHospital);
router.put("/specialtys-add/:id", [verifyAccessToken, isAdminOrHost], ctrls.addSpecialtyToHospital);
router.put("/specialtys-delete/:id", [verifyAccessToken, isAdminOrHost], ctrls.deleteSpecialtyHospital);

module.exports = router;