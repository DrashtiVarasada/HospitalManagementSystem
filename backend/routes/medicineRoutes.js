const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createMedicine,
    getAllMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    updateMedicineStock,
    dispenseMedicine,
    getLowStockMedicines,
    getExpiredMedicines,
    getExpiringMedicines
} = require("../controllers/medicineController");

const router = express.Router();


// =====================================================
// CREATE MEDICINE
// Pharmacist only
// =====================================================

router.post(
    "/",
    protect,
    authorizeRoles("pharmacist"),
    createMedicine
);


// =====================================================
// GET ALL MEDICINES
// Pharmacist + Manager
// =====================================================

router.get(
    "/",
    protect,
    authorizeRoles("pharmacist", "manager"),
    getAllMedicines
);


// =====================================================
// GET LOW STOCK MEDICINES
// Pharmacist + Manager
// =====================================================

router.get(
    "/low-stock",
    protect,
    authorizeRoles("pharmacist", "manager"),
    getLowStockMedicines
);


// =====================================================
// GET EXPIRED MEDICINES
// Pharmacist + Manager
// =====================================================

router.get(
    "/expired",
    protect,
    authorizeRoles("pharmacist", "manager"),
    getExpiredMedicines
);


// =====================================================
// GET EXPIRING MEDICINES
// Pharmacist + Manager
// =====================================================

router.get(
    "/expiring",
    protect,
    authorizeRoles("pharmacist", "manager"),
    getExpiringMedicines
);


// =====================================================
// UPDATE MEDICINE STOCK
// Pharmacist only
// =====================================================
//
// Example:
// PUT /api/medicines/:id/stock
//
// Body:
// {
//     "quantity": 100
// }
//
// Used for manually updating inventory stock.
// =====================================================

router.put(
    "/:id/stock",
    protect,
    authorizeRoles("pharmacist"),
    updateMedicineStock
);


// =====================================================
// DISPENSE MEDICINE
// Pharmacist only
// =====================================================
//
// Example:
// POST /api/medicines/:id/dispense
//
// Body:
// {
//     "quantity": 10
// }
//
// This automatically decreases medicine stock.
// =====================================================

router.post(
    "/:id/dispense",
    protect,
    authorizeRoles("pharmacist"),
    dispenseMedicine
);


// =====================================================
// GET MEDICINE BY ID
// Pharmacist + Manager
// =====================================================

router.get(
    "/:id",
    protect,
    authorizeRoles("pharmacist", "manager"),
    getMedicineById
);


// =====================================================
// UPDATE MEDICINE
// Pharmacist only
// =====================================================

router.put(
    "/:id",
    protect,
    authorizeRoles("pharmacist"),
    updateMedicine
);


// =====================================================
// DELETE MEDICINE
// Pharmacist only
// =====================================================

router.delete(
    "/:id",
    protect,
    authorizeRoles("pharmacist"),
    deleteMedicine
);


module.exports = router;