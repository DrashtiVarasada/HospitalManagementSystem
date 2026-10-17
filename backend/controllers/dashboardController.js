const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Medicine = require("../models/Medicine");
const Room = require("../models/Room");
const Staff = require("../models/Staff");
const Finance = require("../models/Finance");


// GET HOSPITAL DASHBOARD
const getDashboard = async (req, res) => {
    try {

        // BASIC COUNTS
        const totalPatients = await Patient.countDocuments();

        const totalDoctors = await Doctor.countDocuments();

        const totalAppointments =
            await Appointment.countDocuments();

        const totalMedicines =
            await Medicine.countDocuments();

        const totalRooms =
            await Room.countDocuments();

        const totalStaff =
            await Staff.countDocuments();


        // ROOM INFORMATION
        const availableRooms =
            await Room.countDocuments({
                status: "available"
            });

        const occupiedRooms =
            await Room.countDocuments({
                status: "occupied"
            });

        const maintenanceRooms =
            await Room.countDocuments({
                status: "maintenance"
            });


        // APPOINTMENT INFORMATION
        const waitingAppointments =
            await Appointment.countDocuments({
                status: "waiting"
            });

        const completedAppointments =
            await Appointment.countDocuments({
                status: "completed"
            });

        const cancelledAppointments =
            await Appointment.countDocuments({
                status: "cancelled"
            });


        // MEDICINE INFORMATION
        const lowStockMedicines =
            await Medicine.countDocuments({
                $expr: {
                    $lte: ["$quantity", "$reorderLevel"]
                }
            });


        // FINANCE INFORMATION
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


        // FINAL RESPONSE
        res.status(200).json({
            message: "Dashboard data fetched successfully",

            patients: {
                total: totalPatients
            },

            doctors: {
                total: totalDoctors
            },

            staff: {
                total: totalStaff
            },

            appointments: {
                total: totalAppointments,
                waiting: waitingAppointments,
                completed: completedAppointments,
                cancelled: cancelledAppointments
            },

            medicines: {
                total: totalMedicines,
                lowStock: lowStockMedicines
            },

            rooms: {
                total: totalRooms,
                available: availableRooms,
                occupied: occupiedRooms,
                maintenance: maintenanceRooms
            },

            finance: {
                totalRevenue,
                totalExpenses,
                netIncome
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch dashboard data",
            error: error.message
        });
    }
};


module.exports = {
    getDashboard
};