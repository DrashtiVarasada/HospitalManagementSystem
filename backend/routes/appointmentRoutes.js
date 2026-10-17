const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    getDoctorDailyQueue
} = require("../controllers/appointmentController");

const router = express.Router();


// ==========================================
// CREATE APPOINTMENT
// Receptionist + Doctor
// ==========================================

router.post(
    "/",
    protect,
    authorizeRoles("receptionist", "doctor"),
    createAppointment
);


// ==========================================
// GET ALL APPOINTMENTS
// Receptionist + Doctor + Manager
// ==========================================

router.get(
    "/",
    protect,
    authorizeRoles(
        "receptionist",
        "doctor",
        "manager"
    ),
    getAllAppointments
);


// ==========================================
// GET DOCTOR'S DAILY QUEUE
// Receptionist + Doctor
// ==========================================

router.get(
    "/doctor/:doctorId/date/:date",
    protect,
    authorizeRoles(
        "receptionist",
        "doctor"
    ),
    getDoctorDailyQueue
);


// ==========================================
// GET APPOINTMENT BY ID
// Receptionist + Doctor + Manager
// ==========================================

router.get(
    "/:id",
    protect,
    authorizeRoles(
        "receptionist",
        "doctor",
        "manager"
    ),
    getAppointmentById
);


// ==========================================
// UPDATE APPOINTMENT
// Receptionist only
// ==========================================

router.put(
    "/:id",
    protect,
    authorizeRoles("receptionist"),
    updateAppointment
);


// ==========================================
// DELETE APPOINTMENT
// Receptionist only
// ==========================================

router.delete(
    "/:id",
    protect,
    authorizeRoles("receptionist"),
    deleteAppointment
);


module.exports = router;