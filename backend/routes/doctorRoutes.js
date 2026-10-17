const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createDoctor,
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
    getMyDoctorProfile
} = require("../controllers/doctorController");

const router = express.Router();


// Create doctor → Manager only
router.post(
    "/",
    protect,
    authorizeRoles("manager"),
    createDoctor
);


// Get all doctors → Manager + Doctor + Receptionist
router.get(
    "/",
    protect,
    authorizeRoles(
        "manager",
        "doctor",
        "receptionist"
    ),
    getAllDoctors
);

router.get(
    "/me",
    protect,
    authorizeRoles("doctor"),
    getMyDoctorProfile
);

// Get doctor by ID → Manager + Doctor + Receptionist
router.get(
    "/:id",
    protect,
    authorizeRoles(
        "manager",
        "doctor",
        "receptionist"
    ),
    getDoctorById
);


// Update doctor → Manager only
router.put(
    "/:id",
    protect,
    authorizeRoles("manager"),
    updateDoctor
);


// Delete doctor → Manager only
router.delete(
    "/:id",
    protect,
    authorizeRoles("manager"),
    deleteDoctor
);


module.exports = router;