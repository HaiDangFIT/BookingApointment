const router = require("express").Router();
const ctrls = require("../controllers/doctorController");

router.get("/", ctrls.getAllDoctor);
router.get("/count", ctrls.getCountDoctor);
router.get("/:id", ctrls.getDoctor);

module.exports = router;