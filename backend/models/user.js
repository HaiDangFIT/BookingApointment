const mongoose = require("mongoose");
const bcryptjs = require("bcrypt");

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
        timestamps: true
    }
);

//Hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = bcryptjs.genSaltSync(10);
    this.password = await bcryptjs.hash(this.password, salt);
});

userSchema.methods = {
    isCorrectPassword: async function (password) {
        return await bcryptjs.compare(password, this.password);
    },
};

//Export the model
module.exports = mongoose.model("User", userSchema);
