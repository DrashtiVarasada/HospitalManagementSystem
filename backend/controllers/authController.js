const User = require("../models/User");
const Staff = require("../models/Staff");
const Doctor = require("../models/Doctor");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// REGISTER USER
const registerUser = async (req, res) => {
    try {
        const {
            staff,
            email,
            password
        } = req.body;

        // Check required fields
        if (!staff || !email || !password) {
            return res.status(400).json({
                message:
                    "Staff, email and password are required"
            });
        }

        // Check staff exists
        const staffExists = await Staff.findById(staff);

        if (!staffExists) {
            return res.status(404).json({
                message: "Staff member not found"
            });
        }

        // Normalize designation
        const designation = staffExists.designation
            ?.toLowerCase()
            .trim();

        // Map Staff designation to User role
        const roleMap = {
            manager: "manager",
            receptionist: "receptionist",
            doctor: "doctor",
            pharmacist: "pharmacist"
        };

        const role = roleMap[designation];

        // Only selected designations can have login accounts
        if (!role) {
            return res.status(400).json({
                message:
                    "Login account can only be created for Manager, Receptionist, Doctor, or Pharmacist"
            });
        }

        // Check whether this staff already has a User account
        const existingStaffUser = await User.findOne({
            staff
        });

        if (existingStaffUser) {
            return res.status(400).json({
                message:
                    "This staff member already has a login account"
            });
        }

        // Check email already exists
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Create User
        const user = await User.create({
            staff,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                staff: user.staff,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// LOGIN USER
const loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                message:
                    "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// GET AVAILABLE DOCTOR USERS
const getAvailableDoctorUsers = async (req, res) => {
    try {
        // Get Doctor Users and their Staff information
        const doctorUsers = await User.find({
            role: "doctor"
        })
            .select("_id email role staff")
            .populate(
                "staff",
                "name phone designation department"
            );

        // Remove orphan User accounts
        // where the Staff record no longer exists
        const validDoctorUsers =
            doctorUsers.filter(
                (user) => user.staff !== null
            );

        // Get Doctor profiles that already exist
        const existingDoctors =
            await Doctor.find({
                user: {
                    $in: validDoctorUsers.map(
                        (user) => user._id
                    )
                }
            }).select("user");

        // Store User IDs that already have
        // a Doctor profile
        const existingDoctorUserIds =
            new Set(
                existingDoctors.map(
                    (doctor) =>
                        doctor.user.toString()
                )
            );

        // Only return valid Doctor Users
        // without an existing Doctor profile
        const availableDoctorUsers =
            validDoctorUsers.filter(
                (user) =>
                    !existingDoctorUserIds.has(
                        user._id.toString()
                    )
            );

        res.status(200).json({
            doctorUsers:
                availableDoctorUsers
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                "Failed to fetch available doctor accounts",
            error: error.message
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getAvailableDoctorUsers
};