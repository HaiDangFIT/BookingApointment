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
        .populate({ path: "hostID", select: "firstName lastName" });

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

module.exports = {
    getAllHospitals,
    getHospital,
    getCountHospital,
    // ratingsHospital,
};