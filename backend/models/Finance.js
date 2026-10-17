const mongoose = require("mongoose");

require("./Staff");

const financeSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                "salary",
                "revenue",
                "expense"
            ],
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff"
        },

        category: {
            type: String,
            trim: true
        },

        transactionDate: {
            type: Date,
            default: Date.now
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "cancelled"
            ],
            default: "paid"
        }
    },
    {
        timestamps: true
    }
);

const Finance = mongoose.model("Finance", financeSchema);

module.exports = Finance;