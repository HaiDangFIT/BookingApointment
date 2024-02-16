const asyncHandler = require('express-async-handler');
const Specialty = require("../models/specialty");


const getAllSpecialty = asyncHandler(async (req, res) => {
    const queries = { ...req.query };
    const exludeFields = ["limit", "sort", "page", "fields"];
    console.log(req.query.fields);

    exludeFields.forEach((e1) => delete queries[e1]);
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(
        /\b(gte|gt|lt|lte)\b/g,
        (macthedEl) => `$${macthedEl}`
    );
    const formatedQueries = JSON.parse(queryString);
    if (queries?.name) {
        formatedQueries.name = { $regex: queries.name, $options: "i" };
    }

    let queryCommand = Specialty.find(formatedQueries);
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
    const counts = await Specialty.find(formatedQueries).countDocuments();
    return res.status(200).json({
        success: response.length > 0 ? true : false,
        data: response.length > 0 ? response : "Lấy danh sách chuyên khoa thất bại",
        counts,
    });
});

const getCountSpecialty = asyncHandler(async (req, res) => {
    const totalCount = await Specialty.find().countDocuments();
    return res.status(200).json({
        success: totalCount ? true : false,
        data: totalCount,
    });
});

const getSpecialty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await Specialty.findById(id);
    return res.status(200).json({
        success: response ? true : false,
        data: response,
    });
});

module.exports = {
    getAllSpecialty,
    getCountSpecialty,
    getSpecialty,
};