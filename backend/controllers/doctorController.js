const asyncHandler = require('express-async-handler');
const ObjectID = require("mongodb").ObjectId;
const Doctor = require("../models/doctor");
const User = require("../models/user");
const Hospital = require("../models/hospital");
const Specialty = require("../models/specialty");
const Schedule = require("../models/schedule");
const moment = require("moment-timezone");

const getAllDoctor = asyncHandler(async (req, res) => {
    let users = [];
    let lastNameQueries;
    let nameSpecialty;
    let nameHospital;
    const queries = { ...req.query };
    const exludeFields = ["limit", "sort", "page", "fields"];
    exludeFields.forEach((el) => delete queries[el]);
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(
        /\b(gte|gt|lt|lte)\b/g,
        (macthedEl) => `$${macthedEl}`
    );
    const formatedQueries = JSON.parse(queryString);
    if (queries?.specialtyID) {
        formatedQueries.specialtyID = new ObjectID(queries.specialtyID);
    }

    //Tìm theo tên bác sĩ
    if (queries?.lastName) {
        users = await User.find({
            lastName: { $regex: queries.lastName, $options: "i" },
            role: 3,
        });
        users?.forEach((item, index, array) => {
            array[index] = {
                _id: new ObjectID(item._id),
            };
        });
        if (users?.length < 1) {
            throw new Error("Không tìm thấy bác sĩ!!!");
        }
        lastNameQueries = { $or: users };
    }
    delete formatedQueries?.lastName;

    if (queries?.nameSpecialty) {
        nameSpecialty = queries?.nameSpecialty;
        delete formatedQueries?.nameSpecialty;
    }

    if (queries?.nameHospital) {
        nameHospital = queries?.nameHospital;
        delete formatedQueries?.nameHospital;
    }

    q = {
        ...formatedQueries,
        ...lastNameQueries,
    };
    let queryCommand = Doctor.find(q).populate({
        path: "_id",
    });

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

    const response = await queryCommand
        .select("-ratings")
        .populate({
            path: "specialtyID",
            select: "name description image",
            match: nameSpecialty
                ? { name: { $regex: nameSpecialty, $options: "i" } }
                : {},
        })
        .populate({
            path: "hospitalID",
            select: "name address description image",
            match: nameHospital ? { name: { $regex: nameHospital, $options: "i" } } : {},
        })
        .exec();
    const counts = await Doctor.find(q).countDocuments();
    let newResponse1 = response.filter(
        (el) => el?.specialtyID !== null && el?.hospitalID !== null
    );

    //Get Days
    let currentDate = moment();
    let startDate = currentDate.clone().startOf("isoweek");
    let endDate = currentDate.clone().endOf("isoweek");
    const newResponse = [];

    for (const doctor of newResponse1) {
        const schedules = await Schedule.find({
            doctorID: doctor?._id,
            date: { $gte: startDate, $lte: endDate },
        });

        const days = schedules.map((schedule) => {
            const day = schedule.date.getDay();
            return day;
        });

        const { _doc } = doctor;
        newResponse.push({
            ..._doc,
            ...{ schedules: days },
        });
    }

    return res.status(200).json({
        success: newResponse ? true : false,
        data: newResponse ? newResponse : "Lấy danh sách bác sĩ không thành công",
        counts,
    });
});

const getDoctor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await Doctor.findById(id)
        .populate("_id")
        .populate("specialtyID")
        .populate({
            path: "hospitalID",
            select: "name address description",
        })
        .populate({
            path: "ratings",
            populate: {
                path: "postedBy",
                select: "firstName lastName",
            },
        });
    return res.status(200).json({
        success: response ? true : false,
        data: response ? response : "Bác sĩ không được tìm thấy",
    });
});


const getCountDoctor = asyncHandler(async (req, res) => {
    const totalCount = await Doctor.find().countDocuments();
    return res.status(200).json({
        success: totalCount ? true : false,
        data: totalCount,
    });
});


module.exports = {
    getAllDoctor,
    getDoctor,
    getCountDoctor,
}