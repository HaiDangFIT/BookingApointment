const router = require("express").Router();
const ctrls = require("../controllers/hospitalController");

router.get("/", ctrls.getAllHospitals);

module.exports = router;