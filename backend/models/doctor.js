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

doctorSchema.pre("save", async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this.createdAt = new Date(localTimestamp);
    this.updatedAt = new Date(localTimestamp);
    next();
});

doctorSchema.pre('findOneAndUpdate', async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this._update.updatedAt = new Date(localTimestamp);
    next();
});
//Export the model
module.exports = mongoose.model("Doctor", doctorSchema);