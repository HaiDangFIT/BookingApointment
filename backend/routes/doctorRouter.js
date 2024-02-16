const router = require("express").Router();
const ctrls = require("../controllers/doctorController");

router.get("/", ctrls.getAllDoctor);


module.exports = router;