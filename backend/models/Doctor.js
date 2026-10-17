const mongoose = require("mongoose");
require("./User");

const doctorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        specialization: {
            type: String,
            required: true,
            trim: true
        },

        qualification: {
            type: String,
            required: true,
            trim: true
        },

        experience: {
            type: Number,
            required: true,
            min: 0
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        consultationFee: {
            type: Number,
            required: true,
            min: 0
        },

        availability: {
            days: [
                {
                    type: String,
                    enum: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday"
                    ]
                }
            ],

            startTime: {
                type: String
            },

            endTime: {
                type: String
            }
        }
    },
    {
        timestamps: true
    }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;