const router = require("express").Router();
const ctrls = require("../controllers/specialtyController");
const {
    verifyAccessToken,
    isAdmin
} = require("../middlewares/verifyToken")

router.get("/", ctrls.getAllSpecialty);
router.get("/count", ctrls.getCountSpecialty);
router.get("/:id", ctrls.getSpecialty);

//Admin
router.post("/", [verifyAccessToken, isAdmin], ctrls.addSpecialty);
router.put("/:id", [verifyAccessToken, isAdmin], ctrls.updateSpecialty);

module.exports = router;