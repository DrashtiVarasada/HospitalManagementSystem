const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient
} = require("../controllers/patientController");

const router = express.Router();


// CREATE PATIENT
// Receptionist only
router.post(
    "/",
    protect,
    authorizeRoles("receptionist"),
    createPatient
);


// GET ALL PATIENTS
// Receptionist + Doctor + Manager
router.get(
    "/",
    protect,
    authorizeRoles(
        "receptionist",
        "doctor",
        "manager"
    ),
    getAllPatients
);


// GET PATIENT BY ID
// Receptionist + Doctor + Manager
router.get(
    "/:id",
    protect,
    authorizeRoles(
        "receptionist",
        "doctor",
        "manager"
    ),
    getPatientById
);


// UPDATE PATIENT
// Receptionist only
router.put(
    "/:id",
    protect,
    authorizeRoles("receptionist"),
    updatePatient
);


// DELETE PATIENT
// Manager only
router.delete(
    "/:id",
    protect,
    authorizeRoles("manager"),
    deletePatient
);


module.exports = router;