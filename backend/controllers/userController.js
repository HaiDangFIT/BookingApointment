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

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie || !cookie.refreshToken)
        throw new Error("Không tìm thấy RefreshToken trên cookies");
    // Xóa refresh token ở db
    await User.findOneAndUpdate(
        { refreshToken: cookie.refreshToken },
        { refreshToken: "" },
        { new: true }
    );
    // Xóa refresh token ở cookie trình duyệt
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    return res.status(200).json({
        success: true,
        mes: "Đăng xuất thành công",
    });
});

const getCurrent = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const response = await User.findById(_id).select(
        "-password -isBlocked -refreshToken"
    );
    return res.status(200).json({
        success: response ? true : false,
        data: response ? response : "Không tìm thấy người dùng",
    });
});

const updateUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (!_id || Object.keys(req.body).length === 0)
        throw new Error("Vui lòng nhập đầy đủ");
    const { password } = req.body;
    if (password) {
        const salt = bcryptjs.genSaltSync(10);
        req.body.password = await bcryptjs.hash(password, salt);
    }
    const response = await User.findByIdAndUpdate(
        _id,
        req.body,
        { new: true }).select("-password -role -isBlocked -refreshToken");
    return res.status(200).json({
        success: response ? true : false,
        message: response
            ? "Cập nhật thông tin người dùng thành công"
            : "Cập nhật thông tin người dùng thất bại",
    });
});

module.exports = {
    register,
    login,
    logout,
    getCurrent,
    updateUser,
}