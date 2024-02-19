const router = require("express").Router();
const ctrls = require("../controllers/userController");
const {
    verifyAccessToken,
    isAdminOrHost,
    isAdmin
} = require("../middlewares/verifyToken");

router.post("/register", ctrls.register);
router.post("/login", ctrls.login);
router.post("/logout", ctrls.logout);

router.get("/current", [verifyAccessToken], ctrls.getCurrent);
router.put("/current", [verifyAccessToken], ctrls.updateUser);
router.post("/refreshAccessToken", ctrls.refreshAccessToken);

router.get("/", [verifyAccessToken, isAdminOrHost], ctrls.getUsers);
router.post("/", [verifyAccessToken, isAdmin], ctrls.addUserByAdmin);

module.exports = router;