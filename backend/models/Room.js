const mongoose = require("mongoose");

require("./Patient");

const roomSchema = new mongoose.Schema(
    {
        roomNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        roomType: {
            type: String,
            enum: [
                "general",
                "icu",
                "ot",
                "rest"
            ],
            required: true
        },

        floor: {
            type: String,
            trim: true
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        occupiedBeds: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "available",
                "occupied",
                "maintenance"
            ],
            default: "available"
        },

        patients: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Patient"
            }
        ],

        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Room = mongoose.model(
    "Room",
    roomSchema
);

module.exports = Room;