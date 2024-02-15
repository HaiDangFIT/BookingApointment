const router = require("express").Router();
const ctrls = require("../controllers/userController");
const {
    verifyAccessToken,
} = require("../middlewares/verifyToken");

router.post("/register", ctrls.register);
router.post("/login", ctrls.login);

router.get("/current", [verifyAccessToken], ctrls.getCurrent);

module.exports = router;