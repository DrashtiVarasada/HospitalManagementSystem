const mongoose = require("mongoose");

require("./Patient");
require("./Doctor");
require("./MedicalRecord");

const prescriptionSchema = new mongoose.Schema(
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

        medicalRecord: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicalRecord",
            required: true
        },

        // ------------------------------------------------------------
        // Specific visit inside the patient's medical record
        // ------------------------------------------------------------
        //
        // Example:
        //
        // MedicalRecord
        //   visits:
        //      Visit 1 -> _id: 111
        //      Visit 2 -> _id: 222
        //
        // Prescription.visitId = 111
        // means this prescription belongs to Visit 1.
        //

        visitId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        // ------------------------------------------------------------
        // PRESCRIBED MEDICINES
        // ------------------------------------------------------------

        medicines: [
            {
                medicineName: {
                    type: String,
                    required: true,
                    trim: true
                },

                dosage: {
                    type: String,
                    required: true,
                    trim: true
                },

                frequency: {
                    type: String,
                    required: true,
                    trim: true
                },

                duration: {
                    type: String,
                    required: true,
                    trim: true
                },

                instructions: {
                    type: String,
                    trim: true
                }
            }
        ],

        // ------------------------------------------------------------
        // ADDITIONAL INSTRUCTIONS
        // ------------------------------------------------------------

        additionalInstructions: {
            type: String,
            trim: true
        },

        // ------------------------------------------------------------
        // PRESCRIPTION DATE
        // ------------------------------------------------------------

        prescriptionDate: {
            type: Date,
            default: Date.now
        },

        // ------------------------------------------------------------
        // PHARMACIST DISPENSING STATUS
        // ------------------------------------------------------------
        //
        // pending:
        // Doctor created prescription but pharmacist has
        // not dispensed the medicines yet.
        //
        // dispensed:
        // Pharmacist successfully dispensed all medicines
        // and stock was deducted.
        //

        dispensingStatus: {
            type: String,
            enum: ["pending", "dispensed"],
            default: "pending"
        },

        // ------------------------------------------------------------
        // DISPENSED DATE
        // ------------------------------------------------------------
        //
        // This remains null until the pharmacist successfully
        // dispenses the prescription.
        //

        dispensedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Prescription = mongoose.model(
    "Prescription",
    prescriptionSchema
);

module.exports = Prescription;