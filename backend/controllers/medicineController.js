const Medicine = require("../models/Medicine");


// =====================================================
// CREATE MEDICINE
// =====================================================

const createMedicine = async (req, res) => {
    try {
        const {
            name,
            category,
            quantity,
            unitPrice,
            expiryDate,
            supplier,
            reorderLevel
        } = req.body;

        // Check required fields
        if (
            !name ||
            !category ||
            quantity === undefined ||
            unitPrice === undefined ||
            !expiryDate ||
            reorderLevel === undefined
        ) {
            return res.status(400).json({
                message:
                    "Name, category, quantity, unit price, expiry date and reorder level are required"
            });
        }

        // Validate numeric values
        if (
            Number(quantity) < 0 ||
            Number(unitPrice) < 0 ||
            Number(reorderLevel) < 0
        ) {
            return res.status(400).json({
                message:
                    "Quantity, unit price and reorder level cannot be negative"
            });
        }

        const medicine = await Medicine.create({
            name: name.trim(),
            category: category.trim(),
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            expiryDate,
            supplier: supplier?.trim() || "",
            reorderLevel: Number(reorderLevel)
        });

        return res.status(201).json({
            message: "Medicine added successfully",
            medicine
        });

    } catch (error) {
        console.error("CREATE MEDICINE ERROR:", error);

        return res.status(500).json({
            message: "Failed to add medicine",
            error: error.message
        });
    }
};


// =====================================================
// GET ALL MEDICINES
// =====================================================

const getAllMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find()
            .sort({
                name: 1
            });

        return res.status(200).json({
            totalMedicines: medicines.length,
            medicines
        });

    } catch (error) {
        console.error("GET ALL MEDICINES ERROR:", error);

        return res.status(500).json({
            message: "Failed to fetch medicines",
            error: error.message
        });
    }
};


// =====================================================
// GET MEDICINE BY ID
// =====================================================

const getMedicineById = async (req, res) => {
    try {
        const medicine = await Medicine.findById(
            req.params.id
        );

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        return res.status(200).json({
            medicine
        });

    } catch (error) {
        console.error("GET MEDICINE BY ID ERROR:", error);

        return res.status(500).json({
            message: "Failed to fetch medicine",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE MEDICINE
// =====================================================

const updateMedicine = async (req, res) => {
    try {
        const {
            name,
            category,
            quantity,
            unitPrice,
            expiryDate,
            supplier,
            reorderLevel
        } = req.body;

        // Validate numeric values if provided
        if (
            quantity !== undefined &&
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                message: "Quantity cannot be negative"
            });
        }

        if (
            unitPrice !== undefined &&
            Number(unitPrice) < 0
        ) {
            return res.status(400).json({
                message: "Unit price cannot be negative"
            });
        }

        if (
            reorderLevel !== undefined &&
            Number(reorderLevel) < 0
        ) {
            return res.status(400).json({
                message:
                    "Reorder level cannot be negative"
            });
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name.trim();
        }

        if (category !== undefined) {
            updateData.category = category.trim();
        }

        if (quantity !== undefined) {
            updateData.quantity = Number(quantity);
        }

        if (unitPrice !== undefined) {
            updateData.unitPrice = Number(unitPrice);
        }

        if (expiryDate !== undefined) {
            updateData.expiryDate = expiryDate;
        }

        if (supplier !== undefined) {
            updateData.supplier = supplier.trim();
        }

        if (reorderLevel !== undefined) {
            updateData.reorderLevel =
                Number(reorderLevel);
        }

        const medicine =
            await Medicine.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        return res.status(200).json({
            message:
                "Medicine updated successfully",
            medicine
        });

    } catch (error) {
        console.error("UPDATE MEDICINE ERROR:", error);

        return res.status(500).json({
            message: "Failed to update medicine",
            error: error.message
        });
    }
};


// =====================================================
// DELETE MEDICINE
// =====================================================

const deleteMedicine = async (req, res) => {
    try {
        const medicine =
            await Medicine.findByIdAndDelete(
                req.params.id
            );

        if (!medicine) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        return res.status(200).json({
            message:
                "Medicine deleted successfully"
        });

    } catch (error) {
        console.error("DELETE MEDICINE ERROR:", error);

        return res.status(500).json({
            message:
                "Failed to delete medicine",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE STOCK QUANTITY
// =====================================================

const updateMedicineStock = async (req, res) => {
    try {
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({
                message:
                    "Quantity is required"
            });
        }

        const newQuantity = Number(quantity);

        if (
            !Number.isFinite(newQuantity) ||
            newQuantity < 0
        ) {
            return res.status(400).json({
                message:
                    "Quantity must be a valid non-negative number"
            });
        }

        const medicine =
            await Medicine.findByIdAndUpdate(
                req.params.id,
                {
                    quantity: newQuantity
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!medicine) {
            return res.status(404).json({
                message:
                    "Medicine not found"
            });
        }

        return res.status(200).json({
            message:
                "Medicine stock updated successfully",
            medicine
        });

    } catch (error) {
        console.error(
            "UPDATE MEDICINE STOCK ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update medicine stock",
            error: error.message
        });
    }
};


// =====================================================
// DISPENSE MEDICINE
// =====================================================
//
// This is the important Option-B functionality.
//
// Pharmacist sends:
//
// {
//     "quantity": 10
// }
//
// The backend:
//
// 1. Finds medicine
// 2. Checks expiry
// 3. Checks requested quantity
// 4. Checks available stock
// 5. Atomically decreases stock
//
// =====================================================

const dispenseMedicine = async (req, res) => {
    try {
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({
                message:
                    "Dispense quantity is required"
            });
        }

        const dispenseQuantity =
            Number(quantity);

        if (
            !Number.isFinite(dispenseQuantity) ||
            dispenseQuantity <= 0
        ) {
            return res.status(400).json({
                message:
                    "Dispense quantity must be greater than 0"
            });
        }

        // Find medicine first
        const medicine =
            await Medicine.findById(
                req.params.id
            );

        if (!medicine) {
            return res.status(404).json({
                message:
                    "Medicine not found"
            });
        }

        // Check expiry
        const today = new Date();

        if (
            new Date(medicine.expiryDate) <
            today
        ) {
            return res.status(400).json({
                message:
                    "Cannot dispense expired medicine"
            });
        }

        // Check sufficient stock
        if (
            medicine.quantity <
            dispenseQuantity
        ) {
            return res.status(400).json({
                message:
                    "Insufficient medicine stock",
                availableQuantity:
                    medicine.quantity,
                requestedQuantity:
                    dispenseQuantity
            });
        }

        /*
         * Atomic stock deduction.
         *
         * The condition quantity >= dispenseQuantity
         * prevents the stock from becoming negative
         * even if two dispensing requests happen
         * at almost the same time.
         */
        const updatedMedicine =
            await Medicine.findOneAndUpdate(
                {
                    _id: req.params.id,
                    quantity: {
                        $gte: dispenseQuantity
                    }
                },
                {
                    $inc: {
                        quantity:
                            -dispenseQuantity
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedMedicine) {
            return res.status(400).json({
                message:
                    "Stock changed before dispensing. Please check the available quantity and try again."
            });
        }

        return res.status(200).json({
            message:
                "Medicine dispensed and stock updated successfully",
            dispensedQuantity:
                dispenseQuantity,
            remainingQuantity:
                updatedMedicine.quantity,
            medicine:
                updatedMedicine
        });

    } catch (error) {
        console.error(
            "DISPENSE MEDICINE ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to dispense medicine",
            error: error.message
        });
    }
};


// =====================================================
// GET LOW STOCK MEDICINES
// =====================================================

const getLowStockMedicines = async (req, res) => {
    try {
        const medicines =
            await Medicine.find({
                $expr: {
                    $lte: [
                        "$quantity",
                        "$reorderLevel"
                    ]
                }
            }).sort({
                quantity: 1
            });

        return res.status(200).json({
            totalLowStock:
                medicines.length,
            medicines
        });

    } catch (error) {
        console.error(
            "GET LOW STOCK MEDICINES ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch low stock medicines",
            error: error.message
        });
    }
};


// =====================================================
// GET EXPIRED MEDICINES
// =====================================================

const getExpiredMedicines = async (req, res) => {
    try {
        const today = new Date();

        const medicines =
            await Medicine.find({
                expiryDate: {
                    $lt: today
                }
            }).sort({
                expiryDate: 1
            });

        return res.status(200).json({
            totalExpired:
                medicines.length,
            medicines
        });

    } catch (error) {
        console.error(
            "GET EXPIRED MEDICINES ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch expired medicines",
            error: error.message
        });
    }
};


// =====================================================
// GET EXPIRING MEDICINES
// =====================================================

const getExpiringMedicines = async (req, res) => {
    try {
        const today = new Date();

        const next30Days =
            new Date();

        next30Days.setDate(
            next30Days.getDate() + 30
        );

        const medicines =
            await Medicine.find({
                expiryDate: {
                    $gte: today,
                    $lte: next30Days
                }
            }).sort({
                expiryDate: 1
            });

        return res.status(200).json({
            totalExpiring:
                medicines.length,
            medicines
        });

    } catch (error) {
        console.error(
            "GET EXPIRING MEDICINES ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch expiring medicines",
            error: error.message
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
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
};