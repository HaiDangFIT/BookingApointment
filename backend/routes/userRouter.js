const router = require("express").Router();
const ctrls = require("../controllers/userController");

router.post("/register", ctrls.register);

module.exports = router;