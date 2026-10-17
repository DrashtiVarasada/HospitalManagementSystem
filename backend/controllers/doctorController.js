const Doctor = require("../models/Doctor");
const User = require("../models/User");


// CREATE DOCTOR
const createDoctor = async (req, res) => {
    try {
        const {
            user,
            name,
            specialization,
            qualification,
            experience,
            phone,
            consultationFee,
            availability
        } = req.body;

        // Check required fields
        if (
            !user ||
            !name ||
            !specialization ||
            !qualification ||
            experience === undefined ||
            !phone ||
            consultationFee === undefined
        ) {
            return res.status(400).json({
                message:
                    "User, name, specialization, qualification, experience, phone and consultation fee are required"
            });
        }

        // Check whether User exists
        const existingUser = await User.findById(user);

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Only users with doctor role can have a Doctor profile
        if (existingUser.role !== "doctor") {
            return res.status(400).json({
                message:
                    "Doctor profile can only be created for a user with doctor role"
            });
        }

        // Check whether this User already has a Doctor profile
        const existingDoctor = await Doctor.findOne({
            user
        });

        if (existingDoctor) {
            return res.status(400).json({
                message:
                    "Doctor profile already exists for this user"
            });
        }

        // Create doctor
        const doctor = await Doctor.create({
            user,
            name,
            specialization,
            qualification,
            experience,
            phone,
            consultationFee,
            availability
        });

        // Populate user information
        await doctor.populate("user", "email role");

        res.status(201).json({
            message: "Doctor created successfully",
            doctor
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create doctor",
            error: error.message
        });
    }
};


// GET ALL DOCTORS
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .populate("user", "email role");

        res.status(200).json({
            doctors
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch doctors",
            error: error.message
        });
    }
};


// GET DOCTOR BY ID
const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(
            req.params.id
        ).populate(
            "user",
            "email role"
        );

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            doctor
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch doctor",
            error: error.message
        });
    }
};


// UPDATE DOCTOR
const updateDoctor = async (req, res) => {
    try {
        // If user is being changed, validate the new user
        if (req.body.user) {

            const existingUser = await User.findById(
                req.body.user
            );

            if (!existingUser) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            if (existingUser.role !== "doctor") {
                return res.status(400).json({
                    message:
                        "Doctor profile can only belong to a user with doctor role"
                });
            }

            // Check whether another Doctor already uses this User
            const existingDoctor = await Doctor.findOne({
                user: req.body.user,
                _id: {
                    $ne: req.params.id
                }
            });

            if (existingDoctor) {
                return res.status(400).json({
                    message:
                        "This user already has another doctor profile"
                });
            }
        }

        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate(
            "user",
            "email role"
        );

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            message: "Doctor updated successfully",
            doctor
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update doctor",
            error: error.message
        });
    }
};


// DELETE DOCTOR
const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(
            req.params.id
        );

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        res.status(200).json({
            message: "Doctor deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete doctor",
            error: error.message
        });
    }
};

// GET LOGGED-IN DOCTOR PROFILE
const getMyDoctorProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({
            user: req.user.id
        }).populate(
            "user",
            "email role"
        );

        if (!doctor) {
            return res.status(404).json({
                message:
                    "Doctor profile not found for this user"
            });
        }

        res.status(200).json({
            doctor
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                "Failed to fetch logged-in doctor profile",
            error: error.message
        });
    }
};
module.exports = {
    createDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
    getMyDoctorProfile
};