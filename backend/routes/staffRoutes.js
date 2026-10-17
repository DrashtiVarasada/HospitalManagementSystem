const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    getStaffByDepartment
} = require("../controllers/staffController");

const router = express.Router();


// Create staff → Manager only
router.post(
    "/",
    protect,
    authorizeRoles("manager"),
    createStaff
);


// Get all staff → Manager only
router.get(
    "/",
    protect,
    authorizeRoles("manager"),
    getAllStaff
);


// Get staff by department → Manager only
router.get(
    "/department/:department",
    protect,
    authorizeRoles("manager"),
    getStaffByDepartment
);


// Get staff by ID → Manager only
router.get(
    "/:id",
    protect,
    authorizeRoles("manager"),
    getStaffById
);


// Update staff → Manager only
router.put(
    "/:id",
    protect,
    authorizeRoles("manager"),
    updateStaff
);


// Delete staff → Manager only
router.delete(
    "/:id",
    protect,
    authorizeRoles("manager"),
    deleteStaff
);


module.exports = router;