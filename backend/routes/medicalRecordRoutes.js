const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createMedicalRecord,
    getAllMedicalRecords,
    getMedicalRecordById,
    getPatientMedicalHistory,
    updateMedicalRecord,
    deleteMedicalRecord
} = require("../controllers/medicalRecordController");

const router = express.Router();


// Create medical record → Doctor only
router.post(
    "/",
    protect,
    authorizeRoles("doctor"),
    createMedicalRecord
);


// Get all medical records → Doctor + Receptionist + Manager
router.get(
    "/",
    protect,
    authorizeRoles("doctor", "receptionist", "manager"),
    getAllMedicalRecords
);


// Get patient's medical history → Doctor + Receptionist + Manager
router.get(
    "/patient/:patientId",
    protect,
    authorizeRoles("doctor", "receptionist", "manager"),
    getPatientMedicalHistory
);


// Get medical record by ID → Doctor + Receptionist + Manager
router.get(
    "/:id",
    protect,
    authorizeRoles("doctor", "receptionist", "manager"),
    getMedicalRecordById
);


// Update medical record → Doctor only
router.put(
    "/:id",
    protect,
    authorizeRoles("doctor"),
    updateMedicalRecord
);


// Delete medical record → Doctor only
router.delete(
    "/:id",
    protect,
    authorizeRoles("doctor"),
    deleteMedicalRecord
);


module.exports = router;