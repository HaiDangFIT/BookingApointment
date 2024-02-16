const Schedule = require("../models/schedule");
const Doctor = require("../models/doctor");
const asyncHandler = require("express-async-handler");
const ObjectID = require("mongodb").ObjectId;

const getAllSchedule = asyncHandler(async (req, res) => {
    let nameSpecialty;
    let nameHospital;
    const queries = { ...req.query };
    const exludeFields = ["limit", "sort", "page", "fields"];
    exludeFields.forEach((e1) => delete queries[e1]);
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(
        /\b(gte|gt|lt|lte)\b/g,
        (macthedE1) => `$${macthedE1}`
    );
    const formatedQueries = JSON.parse(queryString);

    if (queries?.doctorID) {
        formatedQueries.doctorID = new ObjectID(queries.doctorID);
    }

    if (queries?.nameSpecialty) {
        nameSpecialty = queries?.nameSpecialty;
        delete formatedQueries?.nameSpecialty;
    }

    if (queries?.nameHospital) {
        nameHospital = queries?.nameHospital;
        delete formatedQueries?.nameHospital;
    }

    if (queries?.startDate && queries?.endDate) {
        const start = new Date(+queries?.startDate);
        const end = new Date(+queries?.endDate);
        formatedQueries.date = {
            $gte: start,
            $lte: end,
        };
        delete formatedQueries?.startDate;
        delete formatedQueries?.endDate;
    }
    if (queries?.date) {
        formatedQueries.date = new Date(+queries.date);
    }
    if (queries?.timeType) {
        const timeArr = queries?.timeType.split(",");
        timeArr?.forEach((item, index, array) => {
            array[index] = {
                "timeType.time": item,
            };
        });
        formatedQueries.timeType = { $or: timeArr };
    }
    const fields = req?.query?.fields?.split(",").join(" ");

    let queryCommand = Schedule.find(formatedQueries).populate({
        path: "doctorID",
        model: "Doctor",
        select: `${fields ? fields : ""}`,
        populate: [
            {
                path: "_id",
                model: "User",
                select: { __v: 0, password: 0, role: 0 },
            },
            {
                path: "specialID",
                model: "Special",
                match: nameSpecialty ? { name: { $regex: nameSpecialty, $option: "i" } } : {},
            },
            {
                path: "hospitalID",
                model: "Hospital",
                match: nameHospital ? { name: { $regex: nameHospital, $option: "i" } } : {},
                select: {
                    specialtyID: 0,
                    address: 0,
                    image: 0,
                    __v: 0,
                },
            },
        ]
    });
    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        queryCommand = queryCommand.sort(sortBy);
    }

    if (req.query.fields) {
        const fields = req.query.sort.split(",").join(" ");
        queryCommand = queryCommand.select(fields);
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || process.env.LIMIT;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    let response = await queryCommand.exec();
    const count = await Schedule.find(formatedQueries).countDocuments();
    let newResponse = response.filter(
        (e1) => e1?.doctorID?.specialtyID !== null && e1?.doctorID?.hospitalID !== null
    );

    return res.status(200).json({
        success: newResponse.length > 0 ? true : false,
        data: newResponse.length > 0 ? newResponse : "Lấy danh sách lịch khám bệnh của các bác sĩ thất bại",
        count,
    });
});

const getSchedule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await Schedule.findById(id).populate("doctorID");
    return res.status(200).json({
        success: response ? true : false,
        data: response ? response : "Lấy danh sách lịch khám bệnh của các bác sĩ thất bại",
    });
});


module.exports = {
    getAllSchedule,
    getSchedule,
}