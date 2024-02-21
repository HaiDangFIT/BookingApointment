const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
    {
        doctorID: {
            type: mongoose.Types.ObjectId,
            ref: "Doctor"
        },
        cost: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
        },
        timeType: [
            {
                _id: false,
                time: {
                    type: String,
                    enum: [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                    ],
                },
                slot: {
                    type: Number,
                    default: 3,
                },
                status: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

scheduleSchema.pre("save", async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this.createdAt = new Date(localTimestamp);
    this.updatedAt = new Date(localTimestamp);
    next();
});

scheduleSchema.pre('findOneAndUpdate', async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this._update.updatedAt = new Date(localTimestamp);
    next();
});
//Export the model
module.exports = mongoose.model("Schedule", scheduleSchema);