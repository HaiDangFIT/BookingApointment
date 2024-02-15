const mongoose = require('mongoose');

const apointmentSchema = new mongoose.Schema({
    scheduleID: {
        type: mongoose.Types.ObjectId,
        ref: "Schedule",
    },
    patientID: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    image: {
        type: String,
    },
    status: {
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
});

//Export the model
module.exports = mongoose.model("Apointment", apointmentSchema);