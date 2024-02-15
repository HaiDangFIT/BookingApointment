const User = require("../models/user")
const asyncHandler = require('express-async-handler');
const {
    generateAccessToken,
    generateRefreshToken,
} = require("../middlewares/jwt");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcrypt");

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

const login = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng nhập đầy đủ",
        });
    }
    const response = await User.findOne({ phone });
    if (response && (await response.isCorrectPassword(password))) {
        const { password, isBlocked, refreshToken, ...userData } = response.toObject();
        const accessToken = generateAccessToken(response._id, response.role);
        // Create refreshToken
        const newRefreshToken = generateRefreshToken(response._id);
        // Save refreshToken to database
        await User.findByIdAndUpdate(
            response._id,
            { refreshToken: newRefreshToken },
            { new: true }
        );
        // Save refreshToken to cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.setHeader("Authorization", `Bearer ${accessToken}`);
        return res.status(200).json({
            success: true,
            accessToken,
            data: userData,
        });
    } else {
        throw new Error("Tài khoản hoặc mật khẩu không trùng khớp!");
    }
});

module.exports = {
    register,
    login,
}