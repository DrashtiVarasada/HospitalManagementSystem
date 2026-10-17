const Staff = require("../models/Staff");
const User = require("../models/User");


// CREATE STAFF
const createStaff = async (req, res) => {
    try {
        const {
            name,
            designation,
            department,
            phone,
            joiningDate,
            salary,
            status
        } = req.body;

        // Check required fields
        if (
            !name ||
            !designation ||
            !department ||
            !phone ||
            !joiningDate ||
            salary === undefined
        ) {
            return res.status(400).json({
                message:
                    "Name, designation, department, phone, joining date and salary are required"
            });
        }

        // Create staff
        const staff = await Staff.create({
            name,
            designation,
            department,
            phone,
            joiningDate,
            salary,
            status
        });

        res.status(201).json({
            message: "Staff created successfully",
            staff
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create staff",
            error: error.message
        });
    }
};


// GET ALL STAFF
const getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.find()
            .sort({
                name: 1
            });

        // Get all staff IDs
        const staffIds = staff.map(
            (member) => member._id
        );

        // Find users/accounts belonging to these staff members
        const users = await User.find({
            staff: {
                $in: staffIds
            }
        }).select("staff");

        // Store staff IDs that already have accounts
        const accountStaffIds = new Set(
            users.map(
                (user) => user.staff.toString()
            )
        );

        // Add hasAccount to every staff member
        const staffWithAccountStatus = staff.map(
            (member) => ({
                ...member.toObject(),

                hasAccount: accountStaffIds.has(
                    member._id.toString()
                )
            })
        );

        res.status(200).json({
            staff: staffWithAccountStatus
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch staff",
            error: error.message
        });
    }
};


// GET STAFF BY ID
const getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findById(
            req.params.id
        );

        if (!staff) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        // Check whether this staff member has a login account
        const user = await User.findOne({
            staff: staff._id
        }).select("_id");

        const staffWithAccountStatus = {
            ...staff.toObject(),
            hasAccount: !!user
        };

        res.status(200).json({
            staff: staffWithAccountStatus
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch staff",
            error: error.message
        });
    }
};


// UPDATE STAFF
const updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!staff) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        // Check whether this staff member has a login account
        const user = await User.findOne({
            staff: staff._id
        }).select("_id");

        const staffWithAccountStatus = {
            ...staff.toObject(),
            hasAccount: !!user
        };

        res.status(200).json({
            message: "Staff updated successfully",
            staff: staffWithAccountStatus
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update staff",
            error: error.message
        });
    }
};


// DELETE STAFF
const deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        // Delete login account linked to this staff member
        await User.findOneAndDelete({
            staff: staff._id
        });

        // Delete staff member
        await Staff.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Staff and associated login account deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete staff"
        });
    }
};


// GET STAFF BY DEPARTMENT
const getStaffByDepartment = async (req, res) => {
    try {
        const { department } = req.params;

        const staff = await Staff.find({
            department
        }).sort({
            name: 1
        });

        // Get all staff IDs
        const staffIds = staff.map(
            (member) => member._id
        );

        // Find users/accounts belonging to these staff members
        const users = await User.find({
            staff: {
                $in: staffIds
            }
        }).select("staff");

        // Store staff IDs that already have accounts
        const accountStaffIds = new Set(
            users.map(
                (user) => user.staff.toString()
            )
        );

        // Add hasAccount to every staff member
        const staffWithAccountStatus = staff.map(
            (member) => ({
                ...member.toObject(),

                hasAccount: accountStaffIds.has(
                    member._id.toString()
                )
            })
        );

        res.status(200).json({
            department,
            totalStaff: staffWithAccountStatus.length,
            staff: staffWithAccountStatus
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                "Failed to fetch staff by department",
            error: error.message
        });
    }
};


module.exports = {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    getStaffByDepartment
};