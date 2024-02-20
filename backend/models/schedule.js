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

//Export the model
module.exports = mongoose.model("Schedule", scheduleSchema);