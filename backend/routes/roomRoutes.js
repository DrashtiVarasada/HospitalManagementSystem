const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createRoom,
    getAllRooms,
    getRoomById,
    assignPatientToRoom,
    removePatientFromRoom,
    updateRoom,
    deleteRoom
} = require("../controllers/roomController");

const router = express.Router();


// Create room → Manager only
router.post(
    "/",
    protect,
    authorizeRoles("manager"),
    createRoom
);


// Get all rooms → Manager + Receptionist
router.get(
    "/",
    protect,
    authorizeRoles("manager", "receptionist"),
    getAllRooms
);


// Assign patient to room → Receptionist only
router.post(
    "/:roomId/patients/:patientId",
    protect,
    authorizeRoles("receptionist"),
    assignPatientToRoom
);


// Remove patient from room → Receptionist only
router.delete(
    "/:roomId/patients/:patientId",
    protect,
    authorizeRoles("receptionist"),
    removePatientFromRoom
);


// Get room by ID → Manager + Receptionist
router.get(
    "/:id",
    protect,
    authorizeRoles("manager", "receptionist"),
    getRoomById
);


// Update room → Manager only
router.put(
    "/:id",
    protect,
    authorizeRoles("manager"),
    updateRoom
);


// Delete room → Manager only
router.delete(
    "/:id",
    protect,
    authorizeRoles("manager"),
    deleteRoom
);


module.exports = router;