const router = require("express").Router();
const ctrls = require("../controllers/hospitalController");

router.get("/", ctrls.getAllHospitals);
router.get("/:id", ctrls.getHospital);

module.exports = router;