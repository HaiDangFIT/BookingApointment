const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ObjectID = require("mongodb").ObjectId;
const User = require("../models/user");

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

module.exports = {
    verifyAccessToken,
}