const User = require("../models/user");
const Apointment = require("../models/apointment");
const Schedule = require("../models/schedule");
const asyncHandler = require("express-async-handler");
const ObjectID = require("mongodb").ObjectId;

const getApointment = asyncHandler(async (req, res) => {
    const { _id, role } = req.user;
    const queries = { ...req.query };
    const exludeFields = ["limit", "sort", "page", "fields"];
    exludeFields.forEach((el) => delete queries[el]);
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(
        /\b(gte|gt|lt|lte)\b/g,
        (macthedEl) => `$${macthedEl}`
    );
    const formatedQueries = JSON.parse(queryString);
    if (queries?.status) {
        formatedQueries.status = { $regex: queries.status, $options: "i" };
    }
    if (role === 4) {
        formatedQueries.patientID = _id;
    }

    const queryCommand = Apointment.find(formatedQueries)
        .populate({
            path: "scheduleID",
            populate: {
                path: "doctorID",
                model: "Doctor",
                select: { rating: 0 },
                populate: [
                    {
                        path: "hospitalID",
                        model: "Hospital",
                        select: { specialtyID: 0, rating: 0 },
                        match: role == 2 ? { hostID: new ObjectID(_id) } : {},
                    },
                    {
                        path: "specialtyID",
                        model: "Specialty",
                    },
                    {
                        path: "_id",
                        model: "User",
                        match: role === 3 ? { _id: new ObjectID(_id) } : {},
                    }
                ]
            }
        })
        .populate("patientID");
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

    let newResponse = response.filter((el) => el?.scheduleID?.doctorID !== null);
    const counts = newResponse?.length;
    return res.status(200).json({
        success: newResponse.length > 0 ? true : false,
        data:
            newResponse.length > 0
                ? newResponse
                : "Lấy danh sách lịch khám bệnh thất bại",
        counts,
    });
});

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

const addApointmentByAd = asyncHandler(async (req, res) => {
    const { scheduleID, time, patientID } = req.body;
    if (!scheduleID || !time || !patientID) {
        throw new Error("Vui lòng nhập đầy đủ");
    }
    const alreadyUser = await User.findById(patientID);
    if (!alreadyUser) {
        throw new Error("Người dùng không tồn tại");
    }
    const alreadySchedule = await Schedule.findById(scheduleID);
    if (!alreadySchedule) {
        throw new Error("Lịch khám không tồn tại");
    }
});

module.exports = {
    getApointment,
    addBookingByPatient,
    cancelBookingByPatient,
    updateApointment,
    addApointmentByAd,
}