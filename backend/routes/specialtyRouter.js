const router = require("express").Router();
const ctrls = require("../controllers/specialtyController");

router.get("/", ctrls.getAllSpecialty);
router.get("/count", ctrls.getCountSpecialty);
router.get("/:id", ctrls.getSpecialty);

module.exports = router;