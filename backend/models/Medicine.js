const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },

        expiryDate: {
            type: Date,
            required: true
        },

        supplier: {
            type: String,
            trim: true
        },

        reorderLevel: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

const Medicine = mongoose.model(
    "Medicine",
    medicineSchema
);

module.exports = Medicine;