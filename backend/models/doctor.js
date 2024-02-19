const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
        hospitalID: {
            type: mongoose.Types.ObjectId,
            ref: "Hospital",
        },
        specialtyID: {
            type: mongoose.Types.ObjectId,
            ref: "Specialty",
        },
        description: {
            type: String,
        },
        position: {
            type: String,
        },
        ratings: [
            {
                star: { type: Number },
                postedBy: { type: mongoose.Types.ObjectId, ref: "User" },
                comment: { type: String },
                updatedAt: { type: Date, default: Date.now() },
            }
        ],
        totalRatings: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true
    }
)

//Export the model
module.exports = mongoose.model("Doctor", doctorSchema);