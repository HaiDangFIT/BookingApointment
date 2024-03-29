const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Apointment = require("../models/apointment");
const Doctor = require("../models/doctor");
const Hospital = require("../models/hospital");
const { populate } = require("../models/schedule");
const verifyAccessToken = asyncHandler(async (req, res, next) => {
    // Bearer token
    // headers: { authorization: Bearer token}

    if (req?.headers?.authorization?.startsWith("Bearer")) {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    mes: "Token hết hạn",
                });
            }
            req.user = decode;
            next();
        });
    } else {
        return res.status(401).json({
            success: false,
            mes: "Xác thực thất bại!!!",
        });
    }
});

const isAdmin = asyncHandler((req, res, next) => {
    const { role } = req.user;
    if (role !== 1)
        //admin
        return res.status(401).json({
            success: false,
            mes: "Không có quyền truy cập!!!",
        });
    next();
});

const isHost = asyncHandler((req, res, next) => {
    const { role } = req.user;
    if (role !== 2)
        //host
        return res.status(401).json({
            success: false,
            mes: "Không có quyền truy cập!!!",
        });
    next();
});

const isAdminOrHost = asyncHandler((req, res, next) => {
    const { role } = req.user;
    if (role !== 2 && role !== 1)
        //host
        return res.status(401).json({
            success: false,
            mes: "Không có quyền truy cập!!!",
        });
    next();
});

const isDoctor = asyncHandler((req, res, next) => {
    const { role } = req.user;
    if (role !== 3)
        //doctoc
        return res.status(401).json({
            success: false,
            mes: "Không có quyền truy cập!!!",
        });
    next();
});

const checkPermissionDoctor = asyncHandler(async (req, res, next) => {
    const { role, _id } = req.user;
    const { hospitalID } = req.body;
    const { id } = req.params;
    if (role === 3) {
        if (hospitalID) {
            const isHost = await Hospital.find({ _id: hospitalID, host: _id });
            if (!isHost) {
                return res.status(401).json({
                    success: false,
                    message: "Không có quyền truy cập!!!",
                });
            }
        } else {
            const doctor = await Doctor.findById(id).populate("hospitalID");
            if (doctor?.hospitalID?.host?.toString() !== _id.toString()) {
                return res.status(401).json({
                    success: false,
                    message: "Không có quyền truy cập!!!",
                })
            }
        }
    }
    next();
});

const checkPermissionBooking = asyncHandler(async (req, res) => {
    const { role, _id } = req.user;
    const { id } = req.params;
    const apointment = await Apointment.findById(id).populate({
        path: "scheduleID",
        populate: {
            path: "doctorID",
            model: "Doctor",
            select: "hospitalID _id",
            populate: [
                {
                    path: "hospitalID",
                    model: "Hospital",
                    select: "host",
                },
            ],
        },
    });
    if (
        (role === 3 && _id.toString() !== apointment?.scheduleID?.doctorID?._id?.toString()) ||
        (role === 2 && _id.toString() !== apointment?.scheduleID?.doctorID?.clinicID?.host?.toString())
    ) {
        return res.status(401).json({
            success: false,
            message: "Bạn không có quyền!!!",
        });
    }
    next();
});

module.exports = {
    verifyAccessToken,
    isAdmin,
    isHost,
    isDoctor,
    isAdminOrHost,
    checkPermissionDoctor,
    checkPermissionBooking,
}