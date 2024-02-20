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

const addDoctor = asyncHandler(async (req, res) => {
    const { id, hospitalID, specialtyID, description, position } = req.body;
    const user = await User.findById(id);
    const alreadyDoctor = await Doctor.findById(id);
    if (user?.role !== 3) {
        throw new Error("Người dùng không có quyền bác sĩ")
    }
    if (!user) {
        throw new Error("Không tìm thấy người dùng")
    }
    if (alreadyDoctor) {
        throw new Error("Bác sĩ này đã tồn tại")
    }
    if (!description || !position || !specialtyID || !hospitalID) {
        return res.status(200).json({
            success: false,
            message: "Vui lòng nhập đầy đủ"
        });
    }
    const alreadySpecialty = await Specialty.findById(specialtyID);
    const alreadyHospital = await Hospital.findById(hospitalID);
    if (alreadyHospital && alreadySpecialty) {
        const specialty = alreadyHospital?.specialtyID?.find(
            (el) => el.toString() === specialtyID
        );
        if (!specialty) {
            throw new Error("Bệnh viện không tồn tại chuyên khoa này");
        }
        const response = await Doctor.create({
            _id: id,
            specialtyID,
            position,
            hospitalID,
            description,
        });
        return res.status(200).json({
            success: response ? true : false,
            message: respone
                ? "Thêm thông tin bác sĩ thành công"
                : "Thêm thông tin bác sĩ thất bại",
        })
    }
    return res.status(200).json({
        success: false,
        mesage: "Bệnh viện hoặc Chuyên khoa không tồn tại",
    });
});

const deleteDoctor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await Doctor.findByIdAndDelete(id);
    return res.status(200).json({
        success: response ? true : false,
        message: response ? "Xóa thành công" : "Xóa thất bại"
    });
});

const updateDoctor = asyncHandler(async (req, res) => {
    const id = req.params;
    const { specialtyID, hospitalID, avatar } = req.body;
    if (Object.keys(req.body).length === 0) {
        throw new Error("Vui lòng nhập đầy đủ!!!");
    }
    const Doctor = await Doctor.findById(id).populate("hospitalID");
    if (specialtyID) {
        if (hospitalID) {
            const hospital = await Hospital.findById(hospitalID);
            const alreadySpecialty = hospital?.specialtyID?.find(
                (el) => el.toString() === specialtyID
            );
            if (!alreadySpecialty) {
                throw new Error("Bệnh viện không tồn tại chuyên khoa này")
            }
        } else {
            const specialty = doctor?.hospitalID?.specialtyID?.find(
                (el) => el.toString() === specialtyID
            )
            if (!specialty) {
                throw new Error("Bệnh viện không tồn tại chuyên khoa này")
            }
        }
    }
});

const ratingsDoctor = asyncHandler(async (req, res) => {
    const { _id } = req.params;
    const { star, postedBy, comment, updatedAt, doctorID } = req.body;
    if (!star || !doctorID) {
        throw new Error("Vui lòng nhập đánh giá đầy đủ");
    }
    const ratingDoctor = await Doctor.findById(doctorID);
    const alreadyDoctor = ratingDoctor?.ratings?.find(
        (el) => el.postedBy.toString() === _id
    );

    if (alreadyDoctor) {
        await Doctor.updateOne(
            {
                _id: doctorID,
                ratings: { $elemMatch: alreadyDoctor },
            },
            {
                $set: {
                    "ratings.$.star": star,
                    "ratings.$.comment": comment,
                    "ratings.$.updatedAt": updatedAt,
                }
            },
            { new: true }
        )
    } else {
        await Doctor.findByIdAndUpdate(
            doctorID,
            {
                $push: { ratings: { star, comment, postedBy: _id, updatedAt } }
            },
            { new: true }
        )
    }

    const updateDoctor = await Doctor.findById(doctorID);
    const ratingCount = updateDoctor.ratings.length;
    const sum = updatedDoctor.ratings.reduce((sum, el) => sum + +el.star, 0);

    updatedDoctor.totalRatings = Math.round((sum * 10) / ratingCount) / 10;
    await updatedDoctor.save();
    return res.status(200).json({
        success: true,
        data: `Đánh giá thành công`,
    });
});
module.exports = {
    getAllDoctor,
    getDoctor,
    getCountDoctor,
    addDoctor,
    deleteDoctor,
    updateDoctor,
    ratingsDoctor,
}