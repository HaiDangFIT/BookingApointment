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

//USER
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    // Lấy token từ cookies
    const cookie = req.cookies;
    // Check xem có token hay không
    if (!cookie && !cookie.refreshToken)
        throw new Error("Không tìm thấy Refresh token trên cookies");
    // Check token có hợp lệ hay không
    const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);
    const response = await User.findOne({
        _id: rs._id,
        refreshToken: cookie.refreshToken,
    });
    if (!response) {
        throw new Error("RefreshToken không trùng khớp");
    }
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    return res.status(200).json({
        success: true,
        accessToken,

    });
});

//ADMIN 
const getUsers = asyncHandler(async (req, res) => {
    const queries = { ...req.query };
    const exludeFields = ["limit", "sort", "page", "fields"];
    exludeFields.forEach((el) => delete queries[el]);
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(
        /\b(gte|gt|lt|lte)\b/g,
        (macthedEl) => `$${macthedEl}`
    );
    const formatedQueries = JSON.parse(queryString);

    if (queries?.lastName) {
        formatedQueries.lastName = { $regex: queries.lastName, $option: "i" };
    }
    if (queries?.role) {
        formatedQueries.role = queries.role;
    }
    if (queries?.phone) {
        formatedQueries.phone = queries.phone;
    }

    let queryCommand = User.find(formatedQueries);

    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        queryCommand = queryCommand.sort(sortBy);
    }
    if (req.query.fields) {
        const fields = req.query.fields.split(",").join(" ");
        queryCommand = queryCommand.select(fields);
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    const response = await queryCommand.exec();
    const counts = await User.find(formatedQueries).countDocuments();
    if (formatedQueries?.role === "3") {
        let usersWithoutDoctor = [];

        for (const user of response) {
            const doctorInfo = await Doctor.findOne({ _id: user._id }).exec();

            if (!doctorInfo) {
                usersWithoutDoctor.push(user);
            }
        }
        return res.status(200).json({
            success: usersWithoutDoctor.length > 0 ? true : false,
            data:
                usersWithoutDoctor.length > 0
                    ? usersWithoutDoctor
                    : "Lấy danh sách người dùng thất bại",
            counts,
        });
    }
    return res.status(200).json({
        success: response.length > 0 ? true : false,
        data: response.length > 0 ? response : "Lấy danh sách người dùng thất bại",
        counts,
    });
});

const addUserByAdmin = asyncHandler(async (req, res) => {
    const { firstName, lastName, password, phone, gender } = req.body;
    if (!firstName || !lastName || !password || !phone || !gender)
        return res.status(400).json({
            success: false,
            message: "Vui lòng nhập đầy đủ",
        });
    const user = await User.findOne({ phone });
    if (user) {
        throw new Error("Tài khoản đã tồn tại");
    } else {
        const newUser = await User.create(req.body);
        return res.status(200).json({
            success: newUser ? true : false,
            message: newUser
                ? "Thêm người dùng thành công"
                : "Thêm người dùng thất bại",
        });
    }
});


module.exports = {
    register,
    login,
    logout,
    getCurrent,
    updateUser,
    refreshAccessToken,
    getUsers,
    addUserByAdmin,
}