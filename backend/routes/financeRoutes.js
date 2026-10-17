const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createFinance,
    getAllFinance,
    getFinanceById,
    updateFinance,
    deleteFinance,
    getFinanceByType,
    getFinanceSummary
} = require("../controllers/financeController");

const router = express.Router();


// CREATE → Manager only
router.post(
    "/",
    protect,
    authorizeRoles("manager"),
    createFinance
);


// GET ALL → Manager only
router.get(
    "/",
    protect,
    authorizeRoles("manager"),
    getAllFinance
);


// GET SUMMARY → Manager only
router.get(
    "/summary",
    protect,
    authorizeRoles("manager"),
    getFinanceSummary
);


// GET BY TYPE → Manager only
router.get(
    "/type/:type",
    protect,
    authorizeRoles("manager"),
    getFinanceByType
);


// GET BY ID → Manager only
router.get(
    "/:id",
    protect,
    authorizeRoles("manager"),
    getFinanceById
);


// UPDATE → Manager only
router.put(
    "/:id",
    protect,
    authorizeRoles("manager"),
    updateFinance
);


// DELETE → Manager only
router.delete(
    "/:id",
    protect,
    authorizeRoles("manager"),
    deleteFinance
);


module.exports = router;