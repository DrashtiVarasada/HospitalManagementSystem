const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createPrescription,
    getAllPrescriptions,
    getPrescriptionById,
    getPatientPrescriptionHistory,
    getPrescriptionsByVisit,
    getPrescriptionsByMedicalRecord,
    updatePrescription,
    deletePrescription,
    dispensePrescription
} = require("../controllers/prescriptionController");

const router = express.Router();


// =====================================================
// CREATE PRESCRIPTION
// Doctor only
// =====================================================

router.post(
    "/",
    protect,
    authorizeRoles("doctor"),
    createPrescription
);


// =====================================================
// GET ALL PRESCRIPTIONS
// Doctor + Receptionist + Pharmacist + Manager
// =====================================================

router.get(
    "/",
    protect,
    authorizeRoles(
        "doctor",
        "receptionist",
        "pharmacist",
        "manager"
    ),
    getAllPrescriptions
);


// =====================================================
// GET PATIENT PRESCRIPTION HISTORY
// Doctor + Receptionist + Pharmacist + Manager
// =====================================================

router.get(
    "/patient/:patientId",
    protect,
    authorizeRoles(
        "doctor",
        "receptionist",
        "pharmacist",
        "manager"
    ),
    getPatientPrescriptionHistory
);


// =====================================================
// GET PRESCRIPTIONS FOR SPECIFIC VISIT
// Doctor + Receptionist + Pharmacist + Manager
// =====================================================

router.get(
    "/visit/:visitId",
    protect,
    authorizeRoles(
        "doctor",
        "receptionist",
        "pharmacist",
        "manager"
    ),
    getPrescriptionsByVisit
);


// =====================================================
// GET PRESCRIPTIONS FOR MEDICAL RECORD
// Doctor + Receptionist + Pharmacist + Manager
// =====================================================

router.get(
    "/medical-record/:recordId",
    protect,
    authorizeRoles(
        "doctor",
        "receptionist",
        "pharmacist",
        "manager"
    ),
    getPrescriptionsByMedicalRecord
);


// =====================================================
// DISPENSE PRESCRIPTION
// Pharmacist only
// =====================================================
//
// POST /api/prescriptions/:id/dispense
//
// Body:
//
// {
//     "items": [
//         {
//             "medicineName": "Paracetamol",
//             "quantity": 10
//         }
//     ]
// }
//
// This:
// - checks prescription
// - checks stock
// - checks expiry
// - deducts stock
// - marks prescription as dispensed
//
// =====================================================

router.post(
    "/:id/dispense",
    protect,
    authorizeRoles("pharmacist"),
    dispensePrescription
);


// =====================================================
// GET PRESCRIPTION BY ID
// Doctor + Receptionist + Pharmacist + Manager
// =====================================================

router.get(
    "/:id",
    protect,
    authorizeRoles(
        "doctor",
        "receptionist",
        "pharmacist",
        "manager"
    ),
    getPrescriptionById
);


// =====================================================
// UPDATE PRESCRIPTION
// Doctor only
// =====================================================

router.put(
    "/:id",
    protect,
    authorizeRoles("doctor"),
    updatePrescription
);


// =====================================================
// DELETE PRESCRIPTION
// Doctor only
// =====================================================

router.delete(
    "/:id",
    protect,
    authorizeRoles("doctor"),
    deletePrescription
);


module.exports = router;