const mongoose = require("mongoose");
const bcryptjs = require("bcrypt");
const moment = require('moment-timezone');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            enum: ["Male", "Female"],
            required: true
        },
        phone: {
            type: String,
            required: true,
            unique: true
        },
        role: {
            type: Number,
            default: 4
        },
        birthday: {
            type: Date
        },
        address: {
            province: {
                type: String
            },
            district: {
                type: String
            },
            ward: {
                type: String
            },
            detail: {
                type: String
            },
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        avatar: {
            type: String
        },
        password: {
            type: String,
            required: true
        },
        refreshToken: {
            typeof: String
        }
    },
    {
        timestamps: {
            type: Date,
            default: new Date(new Date().getTime + (7 * 60 * 60 * 1000))
        }
    }
);

//Hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = bcryptjs.genSaltSync(10);
    this.password = await bcryptjs.hash(this.password, salt);
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this.createdAt = new Date(localTimestamp);
    this.updatedAt = new Date(localTimestamp);
    next();
});

userSchema.methods = {
    isCorrectPassword: async function (password) {
        return await bcryptjs.compare(password, this.password);
    },
};

userSchema.pre('findOneAndUpdate', async function (next) {
    const currentDate = new Date();
    const localTimestamp = currentDate.getTime() + (7 * 60 * 60 * 1000);
    this._update.updatedAt = new Date(localTimestamp);
    next();
});

//Export the model
module.exports = mongoose.model("User", userSchema);
