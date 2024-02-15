const User = require("../models/user")
const asyncHandler = require('express-async-handler');

const register = asyncHandler(async (req, res) => {
    const { firstName, lastName, password, phone, gender } = req.body;
    if (!firstName || !lastName || !password || !phone || !gender) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng nhập đầy đủ",
        });
    }

    const user = await User.findOne({ phone });
    if (user) {
        throw new Error("Tài khoản đã tồn tại");
    } else {
        const newUser = await User.create(req.body);
        return res.status(400).json({
            success: newUser ? true : false,
            message: newUser ? "Đăng ký thành công" : "Đăng ký thất bại",
        });
    }
});

module.exports = {
    register,
}