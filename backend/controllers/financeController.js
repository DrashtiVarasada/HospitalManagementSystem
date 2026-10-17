const Finance = require("../models/Finance");
const Staff = require("../models/Staff");

// CREATE FINANCE TRANSACTION
const createFinance = async (req, res) => {
    try {
        const {
            type,
            amount,
            description,
            staff,
            category,
            transactionDate,
            paymentStatus
        } = req.body;

        if (!type || amount === undefined || !description) {
            return res.status(400).json({
                message: "Type, amount and description are required"
            });
        }

        // Staff is required only for salary transactions
        if (type === "salary") {
            if (!staff) {
                return res.status(400).json({
                    message: "Staff is required for salary transaction"
                });
            }

            const staffExists = await Staff.findById(staff);

            if (!staffExists) {
                return res.status(404).json({
                    message: "Staff not found"
                });
            }
        }

        const finance = await Finance.create({
            type,
            amount,
            description,
            staff,
            category,
            transactionDate,
            paymentStatus
        });

        const populatedFinance = await Finance.findById(
            finance._id
        ).populate(
            "staff",
            "name designation department"
        );

        res.status(201).json({
            message: "Finance transaction created successfully",
            finance: populatedFinance
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create finance transaction",
            error: error.message
        });
    }
};


// GET ALL FINANCE TRANSACTIONS
const getAllFinance = async (req, res) => {
    try {
        const finance = await Finance.find()
            .populate(
                "staff",
                "name designation department"
            )
            .sort({
                transactionDate: -1
            });

        res.status(200).json({
            totalTransactions: finance.length,
            finance
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch finance transactions",
            error: error.message
        });
    }
};


// GET FINANCE BY ID
const getFinanceById = async (req, res) => {
    try {
        const finance = await Finance.findById(
            req.params.id
        ).populate(
            "staff",
            "name designation department"
        );

        if (!finance) {
            return res.status(404).json({
                message: "Finance transaction not found"
            });
        }

        res.status(200).json({
            finance
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch finance transaction",
            error: error.message
        });
    }
};


// UPDATE FINANCE TRANSACTION
const updateFinance = async (req, res) => {
    try {
        const finance = await Finance.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate(
            "staff",
            "name designation department"
        );

        if (!finance) {
            return res.status(404).json({
                message: "Finance transaction not found"
            });
        }

        res.status(200).json({
            message: "Finance transaction updated successfully",
            finance
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update finance transaction",
            error: error.message
        });
    }
};


// DELETE FINANCE TRANSACTION
const deleteFinance = async (req, res) => {
    try {
        const finance = await Finance.findById(
            req.params.id
        );

        if (!finance) {
            return res.status(404).json({
                message: "Finance transaction not found"
            });
        }

        await Finance.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Finance transaction deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete finance transaction",
            error: error.message
        });
    }
};


// GET FINANCE BY TYPE
const getFinanceByType = async (req, res) => {
    try {
        const { type } = req.params;

        const finance = await Finance.find({
            type
        })
            .populate(
                "staff",
                "name designation department"
            )
            .sort({
                transactionDate: -1
            });

        res.status(200).json({
            type,
            totalTransactions: finance.length,
            finance
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch finance by type",
            error: error.message
        });
    }
};


// GET TOTAL FINANCE SUMMARY
const getFinanceSummary = async (req, res) => {
    try {
        const revenueResult = await Finance.aggregate([
            {
                $match: {
                    type: "revenue",
                    paymentStatus: "paid"
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$amount"
                    }
                }
            }
        ]);

        const expenseResult = await Finance.aggregate([
            {
                $match: {
                    type: {
                        $in: ["expense", "salary"]
                    },
                    paymentStatus: "paid"
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$amount"
                    }
                }
            }
        ]);

        const totalRevenue =
            revenueResult.length > 0
                ? revenueResult[0].total
                : 0;

        const totalExpenses =
            expenseResult.length > 0
                ? expenseResult[0].total
                : 0;

        const netIncome =
            totalRevenue - totalExpenses;

        res.status(200).json({
            totalRevenue,
            totalExpenses,
            netIncome
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to generate finance summary",
            error: error.message
        });
    }
};


module.exports = {
    createFinance,
    getAllFinance,
    getFinanceById,
    updateFinance,
    deleteFinance,
    getFinanceByType,
    getFinanceSummary
};