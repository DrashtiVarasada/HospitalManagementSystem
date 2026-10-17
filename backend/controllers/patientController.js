const Patient = require("../models/Patient");


// CREATE PATIENT
const createPatient = async (req, res) => {
    try {
        const {
            name,
            dateOfBirth,
            gender,
            phone,
            email,
            address,
            bloodGroup,
            emergencyContact
        } = req.body;

        // Check required fields
        if (
            !name ||
            !dateOfBirth ||
            !gender ||
            !phone
        ) {
            return res.status(400).json({
                message:
                    "Name, date of birth, gender and phone are required"
            });
        }

        // Create patient
        const patient = await Patient.create({
            name,
            dateOfBirth,
            gender,
            phone,
            email,
            address,
            bloodGroup,
            emergencyContact
        });

        res.status(201).json({
            message: "Patient created successfully",
            patient
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create patient",
            error: error.message
        });
    }
};


// GET ALL PATIENTS
const getAllPatients = async (req, res) => {
    try {
        const { search, name } = req.query;
        const searchTerm = search || name;

        let query = {};
        if (searchTerm && searchTerm.trim()) {
            query.name = { $regex: searchTerm.trim(), $options: "i" };
        }

        const patients = await Patient.find(query)
            .sort({
                name: 1
            });

        res.status(200).json({
            patients
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch patients",
            error: error.message
        });
    }
};


// GET PATIENT BY ID
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(
            req.params.id
        );

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        res.status(200).json({
            patient
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch patient",
            error: error.message
        });
    }
};


// UPDATE PATIENT
const updatePatient = async (req, res) => {
    try {
        const {
            name,
            dateOfBirth,
            gender,
            phone,
            email,
            address,
            bloodGroup,
            emergencyContact
        } = req.body;

        // Check required fields
        if (
            !name ||
            !dateOfBirth ||
            !gender ||
            !phone
        ) {
            return res.status(400).json({
                message:
                    "Name, date of birth, gender and phone are required"
            });
        }

        const patient =
            await Patient.findByIdAndUpdate(
                req.params.id,
                {
                    name,
                    dateOfBirth,
                    gender,
                    phone,
                    email,
                    address,
                    bloodGroup,
                    emergencyContact
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        res.status(200).json({
            message: "Patient updated successfully",
            patient
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update patient",
            error: error.message
        });
    }
};


// DELETE PATIENT
const deletePatient = async (req, res) => {
    try {
        const patient =
            await Patient.findByIdAndDelete(
                req.params.id
            );

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        res.status(200).json({
            message: "Patient deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete patient",
            error: error.message
        });
    }
};


module.exports = {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient
};