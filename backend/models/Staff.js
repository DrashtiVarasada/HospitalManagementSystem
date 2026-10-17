const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        designation: {
            type: String,
            required: true,
            trim: true
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        joiningDate: {
            type: Date,
            required: true
        },

        salary: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "active",
                "inactive"
            ],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

const Staff = mongoose.model(
    "Staff",
    staffSchema
);

module.exports = Staff;