const mongoose = require("mongoose");

const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const MedicalRecord = require("../models/MedicalRecord");
const Medicine = require("../models/Medicine");

// ============================================================================
// HELPER - POPULATE PRESCRIPTION
// ============================================================================

const populatePrescription = (query) => {
    return query
        .populate(
            "patient",
            "name phone email bloodGroup"
        )
        .populate(
            "doctor",
            "name specialization qualification"
        )
        .populate(
            "medicalRecord",
            "patient doctor visits"
        );
};

// ============================================================================
// HELPER - RESOLVE DOCTOR PROFILE
// ============================================================================

const resolveDoctorId = async (userId) => {
    if (!userId) return null;

    const doctor = await Doctor.findOne({
        user: userId
    }).select("_id");

    return doctor?._id || null;
};

// ============================================================================
// HELPER - CHECK WHETHER DOCTOR OWNS SELECTED VISIT
// ============================================================================

const doctorOwnsVisit = (medicalRecord, visitId, doctorId) => {
    if (!medicalRecord || !visitId || !doctorId) {
        return false;
    }

    const visit = medicalRecord.visits.id(visitId);

    if (!visit) {
        return false;
    }

    // New records store doctor at visit level.
    if (visit.doctor) {
        return visit.doctor.toString() === doctorId.toString();
    }

    // Backward compatibility for old records.
    if (medicalRecord.doctor) {
        return medicalRecord.doctor.toString() === doctorId.toString();
    }

    return false;
};

// ============================================================================
// CREATE PRESCRIPTION
// ============================================================================

const createPrescription = async (req, res) => {
    try {
        let {
            patient,
            doctor,
            medicalRecord,
            visitId,
            medicines,
            additionalInstructions
        } = req.body;

        // ------------------------------------------------------------
        // If logged-in user is doctor, always use their doctor profile.
        // Never trust doctor ID coming from frontend.
        // ------------------------------------------------------------

        if (
            req.user &&
            req.user.role === "doctor"
        ) {
            const myDoctor = await Doctor.findOne({
                user: req.user.id
            });

            if (!myDoctor) {
                return res.status(403).json({
                    message:
                        "Doctor profile not found for this user account"
                });
            }

            doctor = myDoctor._id;
        }

        // ------------------------------------------------------------
        // Required fields
        // ------------------------------------------------------------

        if (
            !patient ||
            !doctor ||
            !medicalRecord ||
            !visitId ||
            !medicines ||
            !Array.isArray(medicines) ||
            medicines.length === 0
        ) {
            return res.status(400).json({
                message:
                    "Patient, doctor, medical record, visit and at least one medicine are required"
            });
        }

        // ------------------------------------------------------------
        // Validate medicine fields
        // ------------------------------------------------------------

        for (
            let i = 0;
            i < medicines.length;
            i++
        ) {
            const medicine = medicines[i];

            if (
                !medicine.medicineName?.trim() ||
                !medicine.dosage?.trim() ||
                !medicine.frequency?.trim() ||
                !medicine.duration?.trim()
            ) {
                return res.status(400).json({
                    message:
                        `Medicine name, dosage, frequency, and duration are required for medicine #${i + 1}`
                });
            }
        }

        // ------------------------------------------------------------
        // Check patient
        // ------------------------------------------------------------

        const patientExists =
            await Patient.findById(patient);

        if (!patientExists) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        // ------------------------------------------------------------
        // Check doctor
        // ------------------------------------------------------------

        const doctorExists =
            await Doctor.findById(doctor);

        if (!doctorExists) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // ------------------------------------------------------------
        // Check medical record
        // ------------------------------------------------------------

        const medicalRecordExists =
            await MedicalRecord.findById(
                medicalRecord
            );

        if (!medicalRecordExists) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        // ------------------------------------------------------------
        // Verify medical record belongs to patient
        // ------------------------------------------------------------

        if (
            medicalRecordExists.patient.toString() !==
            patient.toString()
        ) {
            return res.status(400).json({
                message:
                    "Medical record does not belong to this patient"
            });
        }

        // ------------------------------------------------------------
        // Find selected visit
        // ------------------------------------------------------------

        const visit =
            medicalRecordExists.visits.id(
                visitId
            );

        if (!visit) {
            return res.status(404).json({
                message:
                    "Selected medical visit not found in this medical record"
            });
        }

        // ------------------------------------------------------------
        // IMPORTANT:
        // Verify doctor owns the SELECTED VISIT.
        //
        // Previously this was checking only:
        // medicalRecordExists.doctor
        //
        // But one medical record can contain visits from
        // different doctors.
        // ------------------------------------------------------------

        if (
            req.user &&
            req.user.role === "doctor"
        ) {
            const myDoctorId =
                await resolveDoctorId(req.user.id);

            if (!myDoctorId) {
                return res.status(403).json({
                    message:
                        "Doctor profile not found for this user account"
                });
            }

            if (
                !doctorOwnsVisit(
                    medicalRecordExists,
                    visitId,
                    myDoctorId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not authorized to create a prescription for this medical visit"
                });
            }

            doctor = myDoctorId;
        }

        // ------------------------------------------------------------
        // Prevent duplicate prescription for same visit
        // ------------------------------------------------------------

        const existingPrescription =
            await Prescription.findOne({
                medicalRecord,
                visitId
            });

        if (existingPrescription) {
            return res.status(409).json({
                message:
                    "A prescription already exists for this medical visit"
            });
        }

        // ------------------------------------------------------------
        // Create prescription
        // ------------------------------------------------------------

        const prescription =
            await Prescription.create({
                patient,
                doctor,
                medicalRecord,
                visitId,
                medicines,
                additionalInstructions,
                prescriptionDate: new Date(),
                dispensingStatus: "pending",
                dispensedAt: null
            });

        // ------------------------------------------------------------
        // Return populated prescription
        // ------------------------------------------------------------

        const result =
            await populatePrescription(
                Prescription.findById(
                    prescription._id
                )
            );

        return res.status(201).json({
            message:
                "Prescription created successfully",
            prescription: result
        });

    } catch (error) {
        console.error(
            "CREATE PRESCRIPTION ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create prescription",
            error: error.message
        });
    }
};

// ============================================================================
// GET ALL PRESCRIPTIONS
// ============================================================================

const getAllPrescriptions = async (
    req,
    res
) => {
    try {
        let filter = {};

        // ------------------------------------------------------------
        // Doctors should ONLY receive their own prescriptions.
        // ------------------------------------------------------------

        if (
            req.user &&
            req.user.role === "doctor"
        ) {
            const doctorId =
                await resolveDoctorId(req.user.id);

            if (!doctorId) {
                return res.status(403).json({
                    message:
                        "Doctor profile not found for this user account"
                });
            }

            filter.doctor = doctorId;
        }

        const prescriptions =
            await populatePrescription(
                Prescription.find(filter)
                    .sort({
                        prescriptionDate: -1
                    })
            );

        return res.status(200).json({
            prescriptions
        });

    } catch (error) {
        console.error(
            "GET ALL PRESCRIPTIONS ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch prescriptions",
            error: error.message
        });
    }
};

// ============================================================================
// GET PRESCRIPTION BY ID
// ============================================================================

const getPrescriptionById = async (
    req,
    res
) => {
    try {
        const prescription =
            await populatePrescription(
                Prescription.findById(
                    req.params.id
                )
            );

        if (!prescription) {
            return res.status(404).json({
                message:
                    "Prescription not found"
            });
        }

        // ------------------------------------------------------------
        // Doctor can only view their own prescription.
        // ------------------------------------------------------------

        if (
            req.user &&
            req.user.role === "doctor"
        ) {
            const doctorId =
                await resolveDoctorId(req.user.id);

            if (!doctorId) {
                return res.status(403).json({
                    message:
                        "Doctor profile not found for this user account"
                });
            }

            if (
                !prescription.doctor ||
                prescription.doctor._id.toString() !==
                doctorId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not authorized to view this prescription"
                });
            }
        }

        return res.status(200).json({
            prescription
        });

    } catch (error) {
        console.error(
            "GET PRESCRIPTION BY ID ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch prescription",
            error: error.message
        });
    }
};
// ============================================================================
// GET PATIENT PRESCRIPTION HISTORY
// ============================================================================

const getPatientPrescriptionHistory =
    async (req, res) => {
        try {
            const {
                patientId
            } = req.params;

            // --------------------------------------------------------
            // Check patient
            // --------------------------------------------------------

            const patientExists =
                await Patient.findById(
                    patientId
                );

            if (!patientExists) {
                return res.status(404).json({
                    message:
                        "Patient not found"
                });
            }

            // --------------------------------------------------------
            // Build filter
            // --------------------------------------------------------

            const filter = {
                patient: patientId
            };

            // --------------------------------------------------------
            // Doctor can only see prescriptions
            // written by themselves.
            // --------------------------------------------------------

            if (
                req.user &&
                req.user.role === "doctor"
            ) {
                const doctorId =
                    await resolveDoctorId(
                        req.user.id
                    );

                if (!doctorId) {
                    return res.status(403).json({
                        message:
                            "Doctor profile not found for this user account"
                    });
                }

                filter.doctor = doctorId;
            }

            // --------------------------------------------------------
            // Get prescriptions
            // --------------------------------------------------------

            const prescriptions =
                await populatePrescription(
                    Prescription.find(filter)
                        .sort({
                            prescriptionDate: -1
                        })
                );

            return res.status(200).json({
                patient: {
                    id: patientExists._id,
                    name: patientExists.name
                },

                totalPrescriptions:
                    prescriptions.length,

                prescriptions
            });

        } catch (error) {
            console.error(
                "GET PATIENT PRESCRIPTION HISTORY ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch patient prescription history",
                error: error.message
            });
        }
    };


// ============================================================================
// UPDATE PRESCRIPTION
// ============================================================================

const updatePrescription = async (
    req,
    res
) => {
    try {
        const {
            medicines,
            additionalInstructions
        } = req.body;

        // ------------------------------------------------------------
        // Find prescription
        // ------------------------------------------------------------

        const prescription =
            await Prescription.findById(
                req.params.id
            );

        if (!prescription) {
            return res.status(404).json({
                message:
                    "Prescription not found"
            });
        }

        // ------------------------------------------------------------
        // Doctor authorization
        // ------------------------------------------------------------

        if (
            req.user &&
            req.user.role === "doctor"
        ) {
            const doctorId =
                await resolveDoctorId(
                    req.user.id
                );

            if (!doctorId) {
                return res.status(403).json({
                    message:
                        "Doctor profile not found for this user account"
                });
            }

            if (
                prescription.doctor.toString() !==
                doctorId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not authorized to modify this prescription"
                });
            }
        }

        // ------------------------------------------------------------
        // Do not allow modification after dispensing
        // ------------------------------------------------------------

        if (
            prescription.dispensingStatus ===
            "dispensed"
        ) {
            return res.status(400).json({
                message:
                    "A dispensed prescription cannot be modified"
            });
        }

        // ------------------------------------------------------------
        // Update medicines
        // ------------------------------------------------------------

        if (
            medicines !== undefined
        ) {
            if (
                !Array.isArray(medicines) ||
                medicines.length === 0
            ) {
                return res.status(400).json({
                    message:
                        "At least one medicine is required"
                });
            }

            for (
                let i = 0;
                i < medicines.length;
                i++
            ) {
                const medicine =
                    medicines[i];

                if (
                    !medicine.medicineName?.trim() ||
                    !medicine.dosage?.trim() ||
                    !medicine.frequency?.trim() ||
                    !medicine.duration?.trim()
                ) {
                    return res.status(400).json({
                        message:
                            `Medicine name, dosage, frequency, and duration are required for medicine #${i + 1}`
                    });
                }
            }

            prescription.medicines =
                medicines;
        }

        // ------------------------------------------------------------
        // Update additional instructions
        // ------------------------------------------------------------

        if (
            additionalInstructions !==
            undefined
        ) {
            prescription.additionalInstructions =
                additionalInstructions;
        }

        // ------------------------------------------------------------
        // Save
        // ------------------------------------------------------------

        await prescription.save();

        // ------------------------------------------------------------
        // Return populated prescription
        // ------------------------------------------------------------

        const result =
            await populatePrescription(
                Prescription.findById(
                    prescription._id
                )
            );

        return res.status(200).json({
            message:
                "Prescription updated successfully",
            prescription: result
        });

    } catch (error) {
        console.error(
            "UPDATE PRESCRIPTION ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update prescription",
            error: error.message
        });
    }
};


// ============================================================================
// DELETE PRESCRIPTION
// ============================================================================

const deletePrescription = async (
    req,
    res
) => {
    try {
        // ------------------------------------------------------------
        // Find prescription
        // ------------------------------------------------------------

        const prescription =
            await Prescription.findById(
                req.params.id
            );

        if (!prescription) {
            return res.status(404).json({
                message:
                    "Prescription not found"
            });
        }

        // ------------------------------------------------------------
        // Doctor authorization
        // ------------------------------------------------------------

        if (
            req.user &&
            req.user.role === "doctor"
        ) {
            const doctorId =
                await resolveDoctorId(
                    req.user.id
                );

            if (!doctorId) {
                return res.status(403).json({
                    message:
                        "Doctor profile not found for this user account"
                });
            }

            if (
                prescription.doctor.toString() !==
                doctorId.toString()
            ) {
                return res.status(403).json({
                    message:
                        "You are not authorized to delete this prescription"
                });
            }
        }

        // ------------------------------------------------------------
        // Do not delete dispensed prescription
        // ------------------------------------------------------------

        if (
            prescription.dispensingStatus ===
            "dispensed"
        ) {
            return res.status(400).json({
                message:
                    "A dispensed prescription cannot be deleted"
            });
        }

        // ------------------------------------------------------------
        // Delete prescription
        // ------------------------------------------------------------

        await Prescription.findByIdAndDelete(
            req.params.id
        );

        return res.status(200).json({
            message:
                "Prescription deleted successfully"
        });

    } catch (error) {
        console.error(
            "DELETE PRESCRIPTION ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to delete prescription",
            error: error.message
        });
    }
};
const dispensePrescription = async (
    req,
    res
) => {
    const session =
        await mongoose.startSession();

    try {
        const {
            items
        } = req.body;

        // ------------------------------------------------------------
        // Validate request
        // ------------------------------------------------------------

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                message:
                    "At least one medicine and quantity are required"
            });
        }

        // ------------------------------------------------------------
        // Validate every item
        // ------------------------------------------------------------

        for (
            let i = 0;
            i < items.length;
            i++
        ) {
            const item =
                items[i];

            if (
                !item.medicineName ||
                !item.medicineName.trim()
            ) {
                return res.status(400).json({
                    message:
                        `Medicine name is required for item #${i + 1}`
                });
            }

            const quantity =
                Number(item.quantity);

            if (
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    message:
                        `Valid dispense quantity greater than 0 is required for ${item.medicineName}`
                });
            }

            if (
                !Number.isInteger(quantity)
            ) {
                return res.status(400).json({
                    message:
                        `Dispense quantity must be a whole number for ${item.medicineName}`
                });
            }
        }

        // ------------------------------------------------------------
        // Find prescription
        // ------------------------------------------------------------

        const prescription =
            await Prescription.findById(
                req.params.id
            );

        if (!prescription) {
            return res.status(404).json({
                message:
                    "Prescription not found"
            });
        }

        // ------------------------------------------------------------
        // Only pharmacist can dispense
        // ------------------------------------------------------------

        if (
            !req.user ||
            req.user.role !== "pharmacist"
        ) {
            return res.status(403).json({
                message:
                    "Only a pharmacist can dispense prescriptions"
            });
        }

        // ------------------------------------------------------------
        // Check dispensing status
        // ------------------------------------------------------------

        if (
            prescription.dispensingStatus ===
            "dispensed"
        ) {
            return res.status(400).json({
                message:
                    "This prescription has already been dispensed"
            });
        }

        // ------------------------------------------------------------
        // Check that requested items match
        // all prescribed medicines
        // ------------------------------------------------------------

        if (
            items.length !==
            prescription.medicines.length
        ) {
            return res.status(400).json({
                message:
                    "Dispense items must match all medicines in the prescription"
            });
        }

        // ------------------------------------------------------------
        // Normalize requested items
        // ------------------------------------------------------------

        const requestedItems =
            items.map((item) => ({
                medicineName:
                    item.medicineName.trim(),

                quantity:
                    Number(item.quantity)
            }));

        // ------------------------------------------------------------
        // Prevent duplicate medicine names
        // ------------------------------------------------------------

        const requestedNames =
            requestedItems.map(
                (item) =>
                    item.medicineName.toLowerCase()
            );

        const uniqueNames =
            new Set(
                requestedNames
            );

        if (
            uniqueNames.size !==
            requestedNames.length
        ) {
            return res.status(400).json({
                message:
                    "The same medicine cannot be included more than once"
            });
        }

        // ------------------------------------------------------------
        // Verify every prescription medicine
        // has a dispense quantity
        // ------------------------------------------------------------

        for (
            const prescribedMedicine
            of prescription.medicines
        ) {
            const requested =
                requestedItems.find(
                    (item) =>
                        item.medicineName
                            .toLowerCase() ===
                        prescribedMedicine
                            .medicineName
                            .toLowerCase()
                );

            if (!requested) {
                return res.status(400).json({
                    message:
                        `Dispense quantity is missing for ${prescribedMedicine.medicineName}`
                });
            }
        }

        // ------------------------------------------------------------
        // Start MongoDB transaction
        // ------------------------------------------------------------

        session.startTransaction();

        const medicinesToUpdate = [];

        // ------------------------------------------------------------
        // Validate every inventory medicine
        // BEFORE changing any stock
        // ------------------------------------------------------------

        for (
            const requested
            of requestedItems
        ) {
            // Escape regex special characters
            // so medicine names are treated literally.
            const escapedName =
                requested.medicineName.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

            const medicine =
                await Medicine.findOne({
                    name: {
                        $regex:
                            `^${escapedName}$`,
                        $options: "i"
                    }
                }).session(session);

            if (!medicine) {
                throw new Error(
                    `Medicine "${requested.medicineName}" was not found in inventory`
                );
            }

            // --------------------------------------------------------
            // Check expiry
            // --------------------------------------------------------

            const today =
                new Date();

            if (
                medicine.expiryDate &&
                new Date(
                    medicine.expiryDate
                ) < today
            ) {
                throw new Error(
                    `Cannot dispense "${medicine.name}" because it has expired`
                );
            }

            // --------------------------------------------------------
            // Check stock
            // --------------------------------------------------------

            if (
                medicine.quantity <
                requested.quantity
            ) {
                throw new Error(
                    `Insufficient stock for "${medicine.name}". Available: ${medicine.quantity}, Required: ${requested.quantity}`
                );
            }

            medicinesToUpdate.push({
                medicine,
                requestedQuantity:
                    requested.quantity
            });
        }

        // ------------------------------------------------------------
        // Deduct stock atomically
        // ------------------------------------------------------------

        for (
            const item
            of medicinesToUpdate
        ) {
            const result =
                await Medicine.updateOne(
                    {
                        _id:
                            item.medicine._id,

                        quantity: {
                            $gte:
                                item.requestedQuantity
                        }
                    },
                    {
                        $inc: {
                            quantity:
                                -item.requestedQuantity
                        }
                    },
                    {
                        session
                    }
                );

            if (
                result.modifiedCount !==
                1
            ) {
                throw new Error(
                    `Stock changed before dispensing "${item.medicine.name}". Please try again.`
                );
            }
        }

        // ------------------------------------------------------------
        // Mark prescription as dispensed
        // ------------------------------------------------------------

        prescription.dispensingStatus =
            "dispensed";

        prescription.dispensedAt =
            new Date();

        await prescription.save({
            session
        });

        // ------------------------------------------------------------
        // Commit transaction
        // ------------------------------------------------------------

        await session.commitTransaction();

        // ------------------------------------------------------------
        // Return updated prescription
        // ------------------------------------------------------------

        const result =
            await populatePrescription(
                Prescription.findById(
                    prescription._id
                )
            );

        return res.status(200).json({
            message:
                "Prescription dispensed successfully and medicine stock updated",

            prescription: result
        });

    } catch (error) {

        // ------------------------------------------------------------
        // Rollback all stock changes
        // ------------------------------------------------------------

        try {
            await session.abortTransaction();
        } catch (abortError) {
            console.error(
                "ABORT TRANSACTION ERROR:",
                abortError
            );
        }

        console.error(
            "DISPENSE PRESCRIPTION ERROR:",
            error
        );

        return res.status(400).json({
            message:
                error.message ||
                "Failed to dispense prescription"
        });

    } finally {
        await session.endSession();
    }
};
// ============================================================================
// GET PRESCRIPTIONS BY VISIT ID
// ============================================================================

const getPrescriptionsByVisit = async (
    req,
    res
) => {
    try {
        const {
            visitId
        } = req.params;

        // ------------------------------------------------------------
        // Build filter
        // ------------------------------------------------------------

        const filter = {
            visitId
        };

        // ------------------------------------------------------------
        // Doctor can only see prescriptions
        // belonging to their own visits/prescriptions.
        // ------------------------------------------------------------

        if (
            req.user &&
            req.user.role === "doctor"
        ) {
            const doctorId =
                await resolveDoctorId(
                    req.user.id
                );

            if (!doctorId) {
                return res.status(403).json({
                    message:
                        "Doctor profile not found for this user account"
                });
            }

            filter.doctor = doctorId;
        }

        // ------------------------------------------------------------
        // Get prescriptions
        // ------------------------------------------------------------

        const prescriptions =
            await populatePrescription(
                Prescription.find(filter)
                    .sort({
                        prescriptionDate: -1
                    })
            );

        return res.status(200).json({
            prescriptions
        });

    } catch (error) {
        console.error(
            "GET PRESCRIPTIONS BY VISIT ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch prescriptions for this visit",
            error: error.message
        });
    }
};


// ============================================================================
// GET PRESCRIPTIONS BY MEDICAL RECORD ID
// ============================================================================

const getPrescriptionsByMedicalRecord =
    async (req, res) => {
        try {
            const {
                recordId
            } = req.params;

            // --------------------------------------------------------
            // Build filter
            // --------------------------------------------------------

            const filter = {
                medicalRecord:
                    recordId
            };

            // --------------------------------------------------------
            // Doctor can only see their own prescriptions
            // --------------------------------------------------------

            if (
                req.user &&
                req.user.role === "doctor"
            ) {
                const doctorId =
                    await resolveDoctorId(
                        req.user.id
                    );

                if (!doctorId) {
                    return res.status(403).json({
                        message:
                            "Doctor profile not found for this user account"
                    });
                }

                filter.doctor =
                    doctorId;
            }

            // --------------------------------------------------------
            // Get prescriptions
            // --------------------------------------------------------

            const prescriptions =
                await populatePrescription(
                    Prescription.find(filter)
                        .sort({
                            prescriptionDate: -1
                        })
                );

            return res.status(200).json({
                prescriptions
            });

        } catch (error) {
            console.error(
                "GET PRESCRIPTIONS BY MEDICAL RECORD ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch prescriptions for this medical record",
                error: error.message
            });
        }
    };


// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    createPrescription,
    getAllPrescriptions,
    getPrescriptionById,
    getPatientPrescriptionHistory,
    getPrescriptionsByVisit,
    getPrescriptionsByMedicalRecord,
    updatePrescription,
    deletePrescription,
    dispensePrescription
};