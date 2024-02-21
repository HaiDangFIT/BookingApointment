const { response } = require("express");
const Hospital = require("../models/hospital");
const Specialty = require("../models/specialty");
const User = require("../models/user");
const asyncHandler = require("express-async-handler");

const getAllHospitals = asyncHandler(async (req, res) => {
    const queries = { ...req.query };
    const exludeFields = ["limit", "sort", "page", "fields"];
    exludeFields.forEach((e1) => delete queries[e1]);
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(
        /\b(gte|gt|lt|lte)\b/g,
        (macthedE1) => `$${macthedE1}`
    );
    const formatedQueries = JSON.parse(queryString);
    if (queries?.name) {
        formatedQueries.name = { $regex: queries.name, $option: "i" };
    };

    if (queries?.hostID) {
        formatedQueries.hostID = new ObjectID(queries.hostID);
    };

    if (queries["address.province"]) {
        formatedQueries["address.province"] = {
            $regex: queries["address.province"],
            $option: "i",
        };
    };

    if (queries["address.district"]) {
        formatedQueries["address.district"] = {
            $regex: queries["address.district"],
            $option: "i",
        };
    };

    if (queries["address.ward"]) {
        formatedQueries["address.ward"] = {
            $regex: queries["address.ward"],
            $option: "i",
        };
    };

    let queryCommand = Hospital.find(formatedQueries)
        .populate("specialtyID")
        .populate({ path: "hostID", select: "firstName lastName phone" });

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

    const response = await queryCommand.select("-ratings").exec();
    const counts = await Hospital.find(formatedQueries).countDocuments();
    return res.status(200).json({
        success: response.length > 0 ? true : false,
        data: response.length > 0 ? response : "Lấy danh sách bệnh viện thất bại",
        counts,
    });
});

const getHospital = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await Hospital.findById(id)
        .populate("specialtyID")
        .populate({ path: "hostID", select: "firstName lastName" });
    return res.status(200).json({
        success: response ? true : false,
        data: response,
    })
});

const getCountHospital = asyncHandler(async (req, res) => {
    const totalCount = await Hospital.find().countDocuments();
    return res.status(200).json({
        success: totalCount ? true : false,
        data: totalCount,
    });
});

const addHospital = asyncHandler(async (req, res) => {
    const { name, address, hostID, description } = req.body;
    if (!name || !address || !hostID || !description) {
        throw new Error("Vui lòng nhập đầy đủ");
    }
    const alreadyHost = await User.findById({ _id: hostID, role: 2 });
    if (!alreadyHost) {
        throw new Error("Người dùng không có quyền!!!");
    }
    const response = await Hospital.create(req.body);
    return res.status(200).json({
        success: response ? true : false,
        message: response ? "Thêm bệnh viện thành công" : "Thêm bệnh viện thất bại",
    });
});

const updateHospital = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (Object.keys(req.body).length === 0) {
        throw new Error("Vui lòng nhập đầy đủ");
    }
    const { hostID } = req.body;
    if (hostID) {
        const alreadyHost = await User.find({ _id: hostID, role: 2 });
        if (!alreadyHost) throw new Error("Người dùng không có quyền!!!");
    }
    const { specialtyID, ...data } = req.body;
    const response = await Hospital.findByIdAndUpdate(id, data, {
        new: true,
    });
    return res.status(200).json({
        success: response ? true : false,
        message: response
            ? "Cập nhật thông tin bệnh viện thành công"
            : "Cập nhật thông tin bệnh viện thất bại",
    });
});

const deleteHospital = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await Hospital.findByIdAndDelete(id);
    return res.status(200).json({
        success: respones ? true : false,
        message: response ? "Xóa bệnh viện thành công" : "Xóa bệnh viện thất bại",
    });
});

const addSpecialtyToHospital = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { specialtyID } = req.body;
    const hospital = await Hospital.findById(id);

    const notExistSpecialty = specialtyID?.filter(
        (obj1) => !hospital.specialtyID?.some((obj2) => obj1 === obj2._id.toString())
    );
    const updateSpecialty = hospital.specialtyID.concat(notExistSpecialty);

    hospital.specialtyID = updateSpecialty;
    await hospital.save();
    return res.status(200).json({
        success: true,
        message: 'Thêm chuyên khoa thành công',
    });
});

const deleteSpecialtyHospital = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { specialtyID } = req.body;
    const hospital = await Hospital.findById(id);

    const updateSpecialtys = hospital?.specialtyID?.filter(
        (el) => !specialtyID?.some((el2) => el._id.toString() === el2._id.toString())
    );
    hospital.specialtyID = updateSpecialtys;

    await hospital.save();

    return res.status(200).json({
        success: true,
        message: `Xóa chuyên khoa của bệnh viện thành công`,
    });
});
module.exports = {
    getAllHospitals,
    getHospital,
    getCountHospital,
    addHospital,
    deleteHospital,
    updateHospital,
    addSpecialtyToHospital,
    deleteSpecialtyHospital,
};