const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getDashboard
} = require("../controllers/dashboardController");

const router = express.Router();

// Manager dashboard → Manager only
router.get(
    "/",
    protect,
    authorizeRoles("manager"),
    getDashboard
);

module.exports = router;    