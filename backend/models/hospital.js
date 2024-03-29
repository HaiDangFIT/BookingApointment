const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        address: {
            province: {
                type: String,
                required: true
            },
            district: {
                type: String,
                required: true
            },
            ward: {
                type: String,
                required: true
            },
            detail: {
                type: String,
                required: true
            },
        },
        specialtyID: [{
            type: mongoose.Types.ObjectId,
            ref: "Specialty"
        }],

        description: {
            type: String,
        },
        image: {
            type: String,
        },
        hostID: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        rating: [
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

);

hospitalSchema.pre("save", async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this.createdAt = new Date(localTimestamp);
    this.updatedAt = new Date(localTimestamp);
    next();
});

hospitalSchema.pre('findOneAndUpdate', async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this._update.updatedAt = new Date(localTimestamp);
    next();
});

//Export the model
module.exports = mongoose.model("Hospital", hospitalSchema);