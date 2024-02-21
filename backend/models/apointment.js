const mongoose = require('mongoose');

const apointmentSchema = new mongoose.Schema(
    {
        scheduleID: {
            type: mongoose.Types.ObjectId,
            ref: "Schedule",
        },
        patientID: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            default: "Đang xử lý",
            enum: ["Đã hủy", "Đang xử lý", "Đã xác nhận", "Đã khám", "Bỏ khám"],
        },
        time: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        description: {
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
        isPaid: {
            type: Boolean,
        },
        medicines: [
            {
                name: { type: String },
                unit: { type: String },
                amount: { type: Number },
                note: { type: String }
            }
        ]
    },
    {
        timestamps: true
    }
);

apointmentSchema.pre("save", async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this.createdAt = new Date(localTimestamp);
    this.updatedAt = new Date(localTimestamp);
    next();
});

apointmentSchema.pre('findOneAndUpdate', async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this._update.updatedAt = new Date(localTimestamp);
    next();
});
//Export the model
module.exports = mongoose.model("Apointment", apointmentSchema);