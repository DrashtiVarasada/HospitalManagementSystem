const MedicalRecord = require("../models/MedicalRecord");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");


// ============================================================================
// HELPER - ATTACH PRESCRIPTIONS TO MEDICAL RECORD VISITS
// ============================================================================

const attachPrescriptionsToRecord = async (record) => {
    if (!record) return { record: null, prescriptions: [] };

    const recordObj = record.toObject ? record.toObject() : JSON.parse(JSON.stringify(record));

    const prescriptions = await Prescription.find({
        medicalRecord: recordObj._id
    })
        .populate("doctor", "name specialization")
        .sort({ prescriptionDate: -1 });

    recordObj.visits = (recordObj.visits || []).map((visit) => {
        const visitPrescriptions = prescriptions.filter(
            (p) => p.visitId && p.visitId.toString() === (visit._id ? visit._id.toString() : "")
        );

        return {
            ...visit,
            prescriptions: visitPrescriptions,
            prescription: visitPrescriptions[0] || null
        };
    });

    return { record: recordObj, prescriptions };
};


// ============================================================================
// CREATE MEDICAL RECORD / ADD VISIT
// ============================================================================

const createMedicalRecord = async (req, res) => {
    try {
        let {
            patient,
            doctor,
            appointment,
            symptoms,
            diagnosis,
            examination,
            treatment,
            notes
        } = req.body;

        // If the logged-in user is a doctor, resolve and verify their doctor profile
        if (req.user && req.user.role === "doctor") {
            const myDoctor = await Doctor.findOne({ user: req.user.id });
            if (!myDoctor) {
                return res.status(403).json({
                    message: "Doctor profile not found for this user account"
                });
            }
            doctor = myDoctor._id;
        }

        // ------------------------------------------------------------
        // Check required fields
        // ------------------------------------------------------------

        if (
            !patient ||
            !doctor ||
            !symptoms ||
            !diagnosis
        ) {
            return res.status(400).json({
                message:
                    "Patient, doctor, symptoms and diagnosis are required"
            });
        }

        // ------------------------------------------------------------
        // Check patient exists
        // ------------------------------------------------------------

        const patientExists = await Patient.findById(patient);

        if (!patientExists) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        // ------------------------------------------------------------
        // Check doctor exists
        // ------------------------------------------------------------

        const doctorExists = await Doctor.findById(doctor);

        if (!doctorExists) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // ------------------------------------------------------------
        // If appointment is provided, validate and mark completed
        // If not provided, auto-create a consultation appointment for today
        // ------------------------------------------------------------

        if (appointment) {
            const appointmentExists =
                await Appointment.findById(appointment);

            if (!appointmentExists) {
                return res.status(404).json({
                    message: "Appointment not found"
                });
            }

            if (
                appointmentExists.patient.toString() !==
                patient.toString()
            ) {
                return res.status(400).json({
                    message:
                        "Selected appointment does not belong to this patient"
                });
            }

            if (
                appointmentExists.doctor.toString() !==
                doctor.toString()
            ) {
                return res.status(400).json({
                    message:
                        "Selected appointment does not belong to this doctor"
                });
            }

            const appointmentAlreadyUsed =
                await MedicalRecord.findOne({
                    "visits.appointment": appointment
                });

            if (appointmentAlreadyUsed) {
                return res.status(400).json({
                    message:
                        "This appointment already has a medical record"
                });
            }

            await Appointment.findByIdAndUpdate(
                appointment,
                {
                    status: "completed"
                }
            );
        } else {
            // Auto-create an appointment record for direct doctor consultation
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const lastAppointment = await Appointment.findOne({
                doctor,
                appointmentDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            }).sort({
                queueNumber: -1
            });

            const queueNumber = lastAppointment
                ? lastAppointment.queueNumber + 1
                : 1;

            const nowTime = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

            const newAppt = await Appointment.create({
                patient,
                doctor,
                appointmentDate: startOfDay,
                appointmentTime: nowTime,
                queueNumber,
                reason: diagnosis || "Direct Consultation",
                status: "completed",
                notes: notes || "Direct consultation visit"
            });

            appointment = newAppt._id;
        }

        // ------------------------------------------------------------
        // Find existing medical record of patient
        // ------------------------------------------------------------

        let medicalRecord = await MedicalRecord.findOne({
            patient
        });

        // ------------------------------------------------------------
        // Create visit object
        // ------------------------------------------------------------

        const newVisit = {
            appointment,
            doctor,
            symptoms,
            diagnosis,
            examination,
            treatment,
            notes,
            visitDate: new Date()
        };

        // ------------------------------------------------------------
        // If patient has NO medical record, create the first record
        // ------------------------------------------------------------

        if (!medicalRecord) {
            medicalRecord = await MedicalRecord.create({
                patient,
                doctor,
                visits: [newVisit]
            });
        } else {
            // Add another visit to the existing medical record
            medicalRecord.visits.push(newVisit);
            await medicalRecord.save();
        }

        // ------------------------------------------------------------
        // Populate complete medical record
        // ------------------------------------------------------------

        const result = await MedicalRecord.findById(
            medicalRecord._id
        )
            .populate(
                "patient",
                "name phone email bloodGroup dateOfBirth gender address"
            )
            .populate(
                "doctor",
                "name specialization qualification phone"
            )
            .populate(
                "visits.doctor",
                "name specialization qualification phone"
            )
            .populate({
                path: "visits.appointment",
                select:
                    "appointmentDate appointmentTime queueNumber status reason"
            });

        const { record: populatedRecord, prescriptions } =
            await attachPrescriptionsToRecord(result);

        const addedVisit =
            populatedRecord.visits[populatedRecord.visits.length - 1];

        return res.status(201).json({
            message: medicalRecord.visits.length === 1
                ? "Medical record created successfully"
                : "New visit added to medical record successfully",
            medicalRecord: populatedRecord,
            createdVisitId: addedVisit ? addedVisit._id : null,
            prescriptions
        });

    } catch (error) {
        console.error(
            "CREATE MEDICAL RECORD ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to create medical record",
            error: error.message
        });
    }
};


// ============================================================================
// GET ALL MEDICAL RECORDS
// ============================================================================

const getAllMedicalRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find()
            .populate(
                "patient",
                "name phone email bloodGroup dateOfBirth gender address"
            )
            .populate(
                "doctor",
                "name specialization qualification phone"
            )
            .populate(
                "visits.doctor",
                "name specialization qualification phone"
            )
            .populate({
                path: "visits.appointment",
                select:
                    "appointmentDate appointmentTime queueNumber status reason"
            })
            .sort({
                updatedAt: -1
            });

        const populatedRecords = await Promise.all(
            records.map(async (rec) => {
                const { record: r } = await attachPrescriptionsToRecord(rec);
                return r;
            })
        );

        return res.status(200).json({
            records: populatedRecords
        });

    } catch (error) {
        console.error(
            "GET ALL MEDICAL RECORDS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch medical records",
            error: error.message
        });
    }
};


// ============================================================================
// GET MEDICAL RECORD BY ID
// ============================================================================

const getMedicalRecordById = async (req, res) => {
    try {
        const record = await MedicalRecord.findById(
            req.params.id
        )
            .populate(
                "patient",
                "name phone email bloodGroup dateOfBirth gender address"
            )
            .populate(
                "doctor",
                "name specialization qualification phone"
            )
            .populate(
                "visits.doctor",
                "name specialization qualification phone"
            )
            .populate({
                path: "visits.appointment",
                select:
                    "appointmentDate appointmentTime queueNumber status reason"
            });

        if (!record) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        const { record: populatedRecord, prescriptions } =
            await attachPrescriptionsToRecord(record);

        return res.status(200).json({
            medicalRecord: populatedRecord,
            prescriptions
        });

    } catch (error) {
        console.error(
            "GET MEDICAL RECORD BY ID ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch medical record",
            error: error.message
        });
    }
};


// ============================================================================
// GET PATIENT MEDICAL HISTORY
// ============================================================================

const getPatientMedicalHistory = async (req, res) => {
    try {
        const { patientId } = req.params;

        // ------------------------------------------------------------
        // Check patient exists
        // ------------------------------------------------------------

        const patientExists = await Patient.findById(
            patientId
        );

        if (!patientExists) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        // ------------------------------------------------------------
        // Find patient's single medical record
        // ------------------------------------------------------------

        const record = await MedicalRecord.findOne({
            patient: patientId
        })
            .populate(
                "patient",
                "name phone email bloodGroup dateOfBirth gender address"
            )
            .populate(
                "doctor",
                "name specialization qualification phone"
            )
            .populate(
                "visits.doctor",
                "name specialization qualification phone"
            )
            .populate({
                path: "visits.appointment",
                select:
                    "appointmentDate appointmentTime queueNumber status reason"
            });

        // ------------------------------------------------------------
        // Patient does not have any medical record yet
        // ------------------------------------------------------------

        if (!record) {
            return res.status(200).json({
                patient: {
                    id: patientExists._id,
                    name: patientExists.name,
                    phone: patientExists.phone,
                    bloodGroup: patientExists.bloodGroup
                },
                totalRecords: 0,
                totalVisits: 0,
                medicalRecord: null,
                records: [],
                prescriptions: []
            });
        }

        const { record: populatedRecord, prescriptions } =
            await attachPrescriptionsToRecord(record);

        // ------------------------------------------------------------
        // Return complete history with prescriptions
        // ------------------------------------------------------------

        return res.status(200).json({
            patient: {
                id: patientExists._id,
                name: patientExists.name,
                phone: patientExists.phone,
                bloodGroup: patientExists.bloodGroup
            },

            totalRecords: 1,

            totalVisits: populatedRecord.visits.length,

            medicalRecord: populatedRecord,

            records: populatedRecord.visits,

            prescriptions
        });

    } catch (error) {
        console.error(
            "GET PATIENT MEDICAL HISTORY ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch patient medical history",
            error: error.message
        });
    }
};


// ============================================================================
// UPDATE A VISIT
// ============================================================================

const updateMedicalRecord = async (req, res) => {
    try {
        const visitId = req.body?.visitId || req.query?.visitId;
        const {
            symptoms,
            diagnosis,
            examination,
            treatment,
            notes
        } = req.body;

        // ------------------------------------------------------------
        // visitId is required
        // ------------------------------------------------------------

        if (!visitId) {
            return res.status(400).json({
                message:
                    "visitId is required to update a medical visit"
            });
        }

        // ------------------------------------------------------------
        // Find main medical record
        // ------------------------------------------------------------

        const medicalRecord =
            await MedicalRecord.findById(
                req.params.id
            );

        if (!medicalRecord) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        // ------------------------------------------------------------
        // Find specific visit
        // ------------------------------------------------------------

        const visit = medicalRecord.visits.id(
            visitId
        );

        if (!visit) {
            return res.status(404).json({
                message: "Medical visit not found"
            });
        }

        // ------------------------------------------------------------
        // Update only provided fields
        // ------------------------------------------------------------

        if (symptoms !== undefined) {
            visit.symptoms = symptoms;
        }

        if (diagnosis !== undefined) {
            visit.diagnosis = diagnosis;
        }

        if (examination !== undefined) {
            visit.examination = examination;
        }

        if (treatment !== undefined) {
            visit.treatment = treatment;
        }

        if (notes !== undefined) {
            visit.notes = notes;
        }

        await medicalRecord.save();

        // ------------------------------------------------------------
        // Populate result
        // ------------------------------------------------------------

        const result = await MedicalRecord.findById(
            medicalRecord._id
        )
            .populate(
                "patient",
                "name phone email bloodGroup dateOfBirth gender address"
            )
            .populate(
                "doctor",
                "name specialization qualification phone"
            )
            .populate(
                "visits.doctor",
                "name specialization qualification phone"
            )
            .populate({
                path: "visits.appointment",
                select:
                    "appointmentDate appointmentTime queueNumber status reason"
            });

        const { record: populatedRecord, prescriptions } =
            await attachPrescriptionsToRecord(result);

        return res.status(200).json({
            message:
                "Medical visit updated successfully",
            medicalRecord: populatedRecord,
            prescriptions
        });

    } catch (error) {
        console.error(
            "UPDATE MEDICAL RECORD ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to update medical record",
            error: error.message
        });
    }
};


// ============================================================================
// DELETE A VISIT OR COMPLETE MEDICAL RECORD
// ============================================================================

const deleteMedicalRecord = async (req, res) => {
    try {
        const visitId = req.body?.visitId || req.query?.visitId;

        // ------------------------------------------------------------
        // Find medical record
        // ------------------------------------------------------------

        const medicalRecord =
            await MedicalRecord.findById(
                req.params.id
            );

        if (!medicalRecord) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        if (visitId) {
            // --------------------------------------------------------
            // Find specific visit
            // --------------------------------------------------------

            const visit = medicalRecord.visits.id(
                visitId
            );

            if (!visit) {
                return res.status(404).json({
                    message: "Medical visit not found"
                });
            }

            const appointmentId = visit.appointment;

            // --------------------------------------------------------
            // Delete associated prescriptions safely (No orphaned rx)
            // --------------------------------------------------------

            await Prescription.deleteMany({
                visitId: visitId
            });

            // --------------------------------------------------------
            // Remove visit from array
            // --------------------------------------------------------

            medicalRecord.visits.pull(visitId);

            // --------------------------------------------------------
            // If no visits remain, clean up entire medical record & prescriptions
            // --------------------------------------------------------

            if (medicalRecord.visits.length === 0) {
                await Prescription.deleteMany({
                    medicalRecord: medicalRecord._id
                });

                await MedicalRecord.findByIdAndDelete(
                    medicalRecord._id
                );
            } else {
                await medicalRecord.save();
            }

            // --------------------------------------------------------
            // Re-open appointment if applicable
            // --------------------------------------------------------

            if (appointmentId) {
                await Appointment.findByIdAndUpdate(
                    appointmentId,
                    {
                        status: "waiting"
                    }
                );
            }

            return res.status(200).json({
                message:
                    "Medical visit and associated prescriptions deleted successfully"
            });

        } else {
            // --------------------------------------------------------
            // Deleting entire medical record: clean up all prescriptions
            // --------------------------------------------------------

            await Prescription.deleteMany({
                medicalRecord: medicalRecord._id
            });

            // Re-open all linked appointments
            for (const v of medicalRecord.visits || []) {
                if (v.appointment) {
                    await Appointment.findByIdAndUpdate(
                        v.appointment,
                        {
                            status: "waiting"
                        }
                    );
                }
            }

            await MedicalRecord.findByIdAndDelete(
                medicalRecord._id
            );

            return res.status(200).json({
                message:
                    "Medical record and all associated prescriptions deleted successfully"
            });
        }

    } catch (error) {
        console.error(
            "DELETE MEDICAL RECORD ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to delete medical record",
            error: error.message
        });
    }
};


module.exports = {
    createMedicalRecord,
    getAllMedicalRecords,
    getMedicalRecordById,
    getPatientMedicalHistory,
    updateMedicalRecord,
    deleteMedicalRecord
};