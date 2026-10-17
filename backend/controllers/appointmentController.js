const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");


// =====================================================
// CREATE APPOINTMENT
// =====================================================

const createAppointment = async (req, res) => {
    try {
        const {
            patient,
            doctor,
            appointmentDate,
            appointmentTime,
            reason,
            notes
        } = req.body;

        // Check required fields
        if (
            !patient ||
            !doctor ||
            !appointmentDate ||
            !appointmentTime ||
            !reason
        ) {
            return res.status(400).json({
                message:
                    "Patient, doctor, appointment date, appointment time and reason are required"
            });
        }

        // Check patient exists
        const patientExists = await Patient.findById(patient);

        if (!patientExists) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        // Check doctor exists
        const doctorExists = await Doctor.findById(doctor);

        if (!doctorExists) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // If logged-in user is a doctor,
        // they can only create appointments for themselves.
        if (req.user.role === "doctor") {
            if (doctorExists.user.toString() !== req.user.id.toString()) {
                return res.status(403).json({
                    message:
                        "Doctors can only create appointments for themselves"
                });
            }
        }

        // Create start and end of appointment day
        const startOfDay = new Date(appointmentDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(appointmentDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Find last queue number for this doctor on this date
        const lastAppointment = await Appointment.findOne({
            doctor,
            appointmentDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({
            queueNumber: -1
        });

        // Generate queue number automatically
        const queueNumber = lastAppointment
            ? lastAppointment.queueNumber + 1
            : 1;

        // Create appointment
        const appointment = await Appointment.create({
            patient,
            doctor,
            appointmentDate: startOfDay,
            appointmentTime,
            queueNumber,
            reason,
            notes
        });

        // Populate patient and doctor information
        const result = await Appointment.findById(
            appointment._id
        )
            .populate(
                "patient",
                "name phone email bloodGroup"
            )
            .populate(
                "doctor",
                "name specialization qualification phone consultationFee"
            );

        return res.status(201).json({
            message: "Appointment created successfully",
            appointment: result
        });

    } catch (error) {
        console.error("CREATE APPOINTMENT ERROR:", error);

        // Handle duplicate queue number
        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Queue number conflict. Please try creating the appointment again."
            });
        }

        return res.status(500).json({
            message: "Failed to create appointment",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL APPOINTMENTS
// =====================================================

const getAllAppointments = async (req, res) => {
    try {
        let filter = {};

        /*
         * Manager and Receptionist can see all appointments.
         *
         * Doctor can see only appointments belonging
         * to their own Doctor profile.
         */

        if (req.user.role === "doctor") {
            const doctor = await Doctor.findOne({
                user: req.user.id
            });

            if (!doctor) {
                return res.status(404).json({
                    message:
                        "Doctor profile not found for this user"
                });
            }

            filter.doctor = doctor._id;
        }

        const appointments = await Appointment.find(filter)
            .populate(
                "patient",
                "name phone email bloodGroup"
            )
            .populate(
                "doctor",
                "name specialization qualification phone consultationFee"
            )
            .sort({
                appointmentDate: 1,
                queueNumber: 1
            });

        return res.status(200).json({
            appointments
        });

    } catch (error) {
        console.error("GET ALL APPOINTMENTS ERROR:", error);

        return res.status(500).json({
            message: "Failed to fetch appointments",
            error: error.message
        });
    }
};


// =====================================================
// GET DOCTOR'S DAILY QUEUE
// =====================================================

const getDoctorDailyQueue = async (req, res) => {
    try {
        const { doctorId, date } = req.params;

        // Check doctor exists
        const doctorExists = await Doctor.findById(doctorId);

        if (!doctorExists) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        /*
         * If logged-in user is a doctor,
         * they can only access their own queue.
         */
        if (req.user.role === "doctor") {
            if (
                doctorExists.user.toString() !==
                req.user.id.toString()
            ) {
                return res.status(403).json({
                    message:
                        "Doctors can only access their own appointment queue"
                });
            }
        }

        // Start of selected day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        // End of selected day
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get doctor's appointments for that day
        const appointments = await Appointment.find({
            doctor: doctorId,
            appointmentDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })
            .populate(
                "patient",
                "name phone email bloodGroup"
            )
            .sort({
                queueNumber: 1
            });

        return res.status(200).json({
            doctor: doctorExists.name,
            date,
            totalPatients: appointments.length,
            queue: appointments
        });

    } catch (error) {
        console.error(
            "GET DOCTOR DAILY QUEUE ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch doctor's queue",
            error: error.message
        });
    }
};


// =====================================================
// GET APPOINTMENT BY ID
// =====================================================

const getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(
            req.params.id
        )
            .populate(
                "patient",
                "name phone email bloodGroup"
            )
            .populate(
                "doctor",
                "name specialization qualification phone consultationFee"
            );

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        /*
         * Doctor can only view their own appointment.
         */
        if (req.user.role === "doctor") {
            if (
                appointment.doctor.user.toString() !==
                req.user.id.toString()
            ) {
                return res.status(403).json({
                    message:
                        "Doctors can only access their own appointments"
                });
            }
        }

        return res.status(200).json({
            appointment
        });

    } catch (error) {
        console.error(
            "GET APPOINTMENT BY ID ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch appointment",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE APPOINTMENT
// Receptionist only
// =====================================================

const updateAppointment = async (req, res) => {
    try {
        const {
            patient,
            doctor,
            appointmentDate,
            appointmentTime,
            reason,
            status,
            notes
        } = req.body;

        // Check required fields
        if (
            !patient ||
            !doctor ||
            !appointmentDate ||
            !appointmentTime ||
            !reason
        ) {
            return res.status(400).json({
                message:
                    "Patient, doctor, appointment date, appointment time and reason are required"
            });
        }

        // Check patient
        const patientExists = await Patient.findById(patient);

        if (!patientExists) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        // Check doctor
        const doctorExists = await Doctor.findById(doctor);

        if (!doctorExists) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // Find existing appointment
        const existingAppointment =
            await Appointment.findById(req.params.id);

        if (!existingAppointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        /*
         * Keep the existing queue number during update.
         *
         * Queue numbers are generated automatically during
         * appointment creation and should not be manually changed.
         */
        const appointment =
            await Appointment.findByIdAndUpdate(
                req.params.id,
                {
                    patient,
                    doctor,
                    appointmentDate: new Date(appointmentDate),
                    appointmentTime,
                    reason,
                    status,
                    notes,
                    queueNumber:
                        existingAppointment.queueNumber
                },
                {
                    new: true,
                    runValidators: true
                }
            )
                .populate(
                    "patient",
                    "name phone email bloodGroup"
                )
                .populate(
                    "doctor",
                    "name specialization qualification phone consultationFee"
                );

        return res.status(200).json({
            message: "Appointment updated successfully",
            appointment
        });

    } catch (error) {
        console.error("UPDATE APPOINTMENT ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "This appointment would create a duplicate queue number."
            });
        }

        return res.status(500).json({
            message: "Failed to update appointment",
            error: error.message
        });
    }
};


// =====================================================
// DELETE APPOINTMENT
// Receptionist only
// =====================================================

const deleteAppointment = async (req, res) => {
    try {
        const appointment =
            await Appointment.findByIdAndDelete(
                req.params.id
            );

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        return res.status(200).json({
            message: "Appointment deleted successfully"
        });

    } catch (error) {
        console.error("DELETE APPOINTMENT ERROR:", error);

        return res.status(500).json({
            message: "Failed to delete appointment",
            error: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    getDoctorDailyQueue
};