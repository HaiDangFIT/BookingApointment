const User = require("../models/user");
const Apointment = require("../models/apointment");
const Schedule = require("../models/schedule");
const asyncHandler = require("express-async-handler");
const ObjectID = require("mongodb").ObjectId;

const addBookingByPatient = asyncHandler(async (req, res) => {
    const { _id, role } = req.user;
    if (role === 4) {
        const { scheduleID, time } = req.body;
        if (!scheduleID || !time) {
            throw new Error("Vui lòng nhập đầy đủ thông tin");
        }
        const alreadySchedule = await Schedule.findById(scheduleID);
        if (!alreadySchedule) {
            throw new Error("Lịch khám bệnh không tồn tại");
        }
        const alreadyTime = alreadySchedule.timeType.find(
            (el) => el.time === time && el.status !== true
        );
        if (!alreadyTime) {
            throw new Error("Thời gian khám bệnh không tồn tại hoặc đã kín lịch");
        }
        const alreadyApointment = await Apointment.find({
            patientID: _id,
            time,
        }).populate({
            path: "scheduleID",
            select: "date",
        });
        if (alreadyApointment.length > 0) {
            alreadyApointment?.forEach(
                (el) => {
                    if (new Date(+alreadySchedule.date).getTime() === new Date(+el?.scheduleID?.date).getTime()) {
                        throw new Error("Bạn đã đặt lịch khám thời gian này rồi");
                    }
                }
            )
        }

        const response = await Apointment.create({
            patientID: _id,
            scheduleID,
            time,
        });

        const apointment = await Apointment.find({
            scheduleID,
            time,
            status: { $ne: "Đã hủy" },
        });

        if (apointment.length === alreadyTime.slot) {
            await Schedule.updateOne(
                {
                    _id: scheduleID,
                    timeType: { $elemMatch: alreadyTime },
                },
                {
                    $set: {
                        "timeType.$.status": true,
                    }
                },
                { new: true }
            );
        }
        return res.status(200).json({
            success: response ? true : false,
            message: response ? "Đặt lịch thành công" : "Đặt lịch thất bại",
        });
    } else {
        return res.status(401).json({
            success: false,
            message: "Không có quyền truy cập",
        });
    }
});

const cancelBookingByPatient = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { id } = req.params;

    const apointment = await Apointment.find({
        _id: id,
        status: "Đang xử lý",
        patientID: _id,
    });

    if (apointment?.length > 0) {
        await Apointment.findByIdAndUpdate(
            id,
            { status: "Đã hủy" },
            { new: true }
        );
        await Schedule.updateOne(
            {
                _id: apointment.scheduleID,
                timeType: { $elemMatch: { time: apointment.time } }
            },
            {
                $set: {
                    "timeType.$.status": false,
                },
            },
            { new: true }
        );
        return res.status(200).json({
            success: true,
            message: `Hủy lịch khám thành công`,
        });
    }
    return res.status(200).json({
        success: false,
        message: `Không thể hủy lịch khám do bạn không có quyền hoặc bác sĩ đã xác nhận!!!`,
    });
});

const updateApointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const apointment = await Apointment.findById(id);
    if (apointment.status === "Đã hủy" || apointment.status === "Bỏ khám" || apointment.status === "Đã khám") {
        throw new Error(`Không thể sửa trạng thái của lịch ${apointment.status.toLowerCase()}`);
    }
    const response = await Apointment.findByIdAndUpdate(
        id,
        req.body,
        {
            new: true,
        }
    );
    return res.status(200).json({
        success: response ? true : false,
        message: response
            ? "Cập nhật trạng thái lịch khám thành công"
            : "Cập nhật trạng thái lịch khám thất bại",
    });
});

module.exports = {
    addBookingByPatient,
    cancelBookingByPatient,
    updateApointment,
}