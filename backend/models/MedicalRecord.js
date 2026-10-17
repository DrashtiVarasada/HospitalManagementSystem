const mongoose = require("mongoose");

require("./Patient");
require("./Doctor");
require("./Appointment");

/*
|--------------------------------------------------------------------------
| Visit Schema
|--------------------------------------------------------------------------
| Each visit represents one appointment/consultation of the patient.
|
| One MedicalRecord can contain many visits.
|
| Example:
|
| MedicalRecord
|   patient: Aarav
|
|   visits:
|      Visit 1 -> 30 Sep
|      Visit 2 -> 07 Oct
|      Visit 3 -> future visit
|
*/

const visitSchema = new mongoose.Schema(
    {
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: false
        },

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: false
        },

        symptoms: {
            type: String,
            required: true,
            trim: true
        },

        diagnosis: {
            type: String,
            required: true,
            trim: true
        },

        examination: {
            type: String,
            trim: true
        },

        treatment: {
            type: String,
            trim: true
        },

        notes: {
            type: String,
            trim: true
        },

        visitDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: true
    }
);


/*
|--------------------------------------------------------------------------
| Medical Record Schema
|--------------------------------------------------------------------------
|
| ONE PATIENT = ONE MEDICAL RECORD
|
| The medical record contains multiple visits.
|
*/

const medicalRecordSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            unique: true
        },

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true
        },

        visits: {
            type: [visitSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);


const MedicalRecord = mongoose.model(
    "MedicalRecord",
    medicalRecordSchema
);

module.exports = MedicalRecord;     