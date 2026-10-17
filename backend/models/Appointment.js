const mongoose = require("mongoose");

require("./Patient");
require("./Doctor");

const appointmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true
        },

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true
        },

        appointmentDate: {
            type: Date,
            required: true
        },

        appointmentTime: {
            type: String,
            required: true,
            trim: true
        },

        queueNumber: {
            type: Number,
            required: true,
            min: 1
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "waiting",
                "in-consultation",
                "completed",
                "cancelled"
            ],
            default: "waiting"
        },

        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

/*
 * A doctor cannot have the same queue number
 * twice on the same appointment date.
 */
appointmentSchema.index(
    {
        doctor: 1,
        appointmentDate: 1,
        queueNumber: 1
    },
    {
        unique: true
    }
);

const Appointment = mongoose.model(
    "Appointment",
    appointmentSchema
);

module.exports = Appointment;