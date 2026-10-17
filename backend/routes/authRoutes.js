const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    registerUser,
    loginUser,
    getAvailableDoctorUsers
} = require("../controllers/authController");

const router = express.Router();


// Register login account → Manager only
router.post(
    "/register",
    protect,
    authorizeRoles("manager"),
    registerUser
);


// Login → Public
router.post(
    "/login",
    loginUser
);


// Get Doctor accounts without Doctor profile → Manager only
router.get(
    "/doctor-users",
    protect,
    authorizeRoles("manager"),
    getAvailableDoctorUsers
);


module.exports = router;