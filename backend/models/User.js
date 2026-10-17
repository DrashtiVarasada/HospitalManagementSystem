const mongoose = require("mongoose");

require("./Staff");

const userSchema = new mongoose.Schema(
    {
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            required: true,
            unique: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 8
        },

        role: {
            type: String,
            enum: [
                "receptionist",
                "doctor",
                "manager",
                "pharmacist"
            ],
            required: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model(
    "User",
    userSchema
);

module.exports = User;