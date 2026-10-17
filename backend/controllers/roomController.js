const Room = require("../models/Room");
const Patient = require("../models/Patient");


// CREATE ROOM
// Manager only
const createRoom = async (req, res) => {
    try {
        const {
            roomNumber,
            roomType,
            floor,
            capacity,
            notes
        } = req.body;

        if (!roomNumber || !roomType || !capacity) {
            return res.status(400).json({
                message:
                    "Room number, room type and capacity are required"
            });
        }

        const existingRoom = await Room.findOne({
            roomNumber: roomNumber.trim()
        });

        if (existingRoom) {
            return res.status(400).json({
                message: "Room already exists"
            });
        }

        const room = await Room.create({
            roomNumber: roomNumber.trim(),
            roomType,
            floor,
            capacity,
            occupiedBeds: 0,
            status: "available",
            patients: [],
            notes
        });

        res.status(201).json({
            message: "Room created successfully",
            room
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create room",
            error: error.message
        });
    }
};


// GET ALL ROOMS
// Manager + Receptionist
const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find()
            .populate(
                "patients",
                "name phone email bloodGroup"
            )
            .sort({
                roomNumber: 1
            });

        res.status(200).json({
            rooms
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch rooms",
            error: error.message
        });
    }
};


// GET ROOM BY ID
// Manager + Receptionist
const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate(
                "patients",
                "name phone email bloodGroup"
            );

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        res.status(200).json({
            room
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch room",
            error: error.message
        });
    }
};


// ASSIGN PATIENT TO ROOM
// Receptionist only
const assignPatientToRoom = async (req, res) => {
    try {
        const { roomId, patientId } = req.params;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        const patient = await Patient.findById(patientId);

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        // Room under maintenance
        if (room.status === "maintenance") {
            return res.status(400).json({
                message: "Room is under maintenance"
            });
        }

        // Patient already assigned to this room
        const alreadyAssigned = room.patients.some(
            (id) => id.toString() === patientId
        );

        if (alreadyAssigned) {
            return res.status(400).json({
                message:
                    "Patient is already assigned to this room"
            });
        }

        // Check whether patient is already assigned
        // to another room
        const existingRoom = await Room.findOne({
            patients: patientId
        });

        if (existingRoom) {
            return res.status(400).json({
                message:
                    "Patient is already assigned to another room"
            });
        }

        // Check capacity
        if (room.occupiedBeds >= room.capacity) {
            return res.status(400).json({
                message: "Room is full"
            });
        }

        // Assign patient
        room.patients.push(patientId);
        room.occupiedBeds += 1;

        // Update room status
        if (room.occupiedBeds >= room.capacity) {
            room.status = "occupied";
        } else {
            room.status = "available";
        }

        await room.save();

        const updatedRoom = await Room.findById(roomId)
            .populate(
                "patients",
                "name phone email bloodGroup"
            );

        res.status(200).json({
            message:
                "Patient assigned to room successfully",
            room: updatedRoom
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                "Failed to assign patient to room",
            error: error.message
        });
    }
};


// REMOVE PATIENT FROM ROOM
// Receptionist only
const removePatientFromRoom = async (req, res) => {
    try {
        const { roomId, patientId } = req.params;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        const patientIndex = room.patients.findIndex(
            (id) => id.toString() === patientId
        );

        if (patientIndex === -1) {
            return res.status(404).json({
                message:
                    "Patient is not assigned to this room"
            });
        }

        // Remove patient
        room.patients.splice(patientIndex, 1);

        if (room.occupiedBeds > 0) {
            room.occupiedBeds -= 1;
        }

        // Update status
        if (room.status !== "maintenance") {
            if (room.occupiedBeds >= room.capacity) {
                room.status = "occupied";
            } else {
                room.status = "available";
            }
        }

        await room.save();

        const updatedRoom = await Room.findById(roomId)
            .populate(
                "patients",
                "name phone email bloodGroup"
            );

        res.status(200).json({
            message:
                "Patient removed from room successfully",
            room: updatedRoom
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                "Failed to remove patient from room",
            error: error.message
        });
    }
};


// UPDATE ROOM
// Manager only
const updateRoom = async (req, res) => {
    try {
        const {
            roomNumber,
            roomType,
            floor,
            capacity,
            notes
        } = req.body;

        if (!roomNumber || !roomType || !capacity) {
            return res.status(400).json({
                message:
                    "Room number, room type and capacity are required"
            });
        }

        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Do not allow capacity smaller than
        // currently occupied beds
        if (Number(capacity) < room.occupiedBeds) {
            return res.status(400).json({
                message:
                    "Capacity cannot be less than occupied beds"
            });
        }

        // Check duplicate room number
        const existingRoom = await Room.findOne({
            roomNumber: roomNumber.trim(),
            _id: { $ne: req.params.id }
        });

        if (existingRoom) {
            return res.status(400).json({
                message: "Room number already exists"
            });
        }

        room.roomNumber = roomNumber.trim();
        room.roomType = roomType;
        room.floor = floor;
        room.capacity = Number(capacity);
        room.notes = notes;

        // Keep status consistent
        if (room.status !== "maintenance") {
            if (room.occupiedBeds >= room.capacity) {
                room.status = "occupied";
            } else {
                room.status = "available";
            }
        }

        await room.save();

        const updatedRoom = await Room.findById(room._id)
            .populate(
                "patients",
                "name phone email bloodGroup"
            );

        res.status(200).json({
            message: "Room updated successfully",
            room: updatedRoom
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update room",
            error: error.message
        });
    }
};


// DELETE ROOM
// Manager only
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Don't delete occupied room
        if (room.occupiedBeds > 0 || room.patients.length > 0) {
            return res.status(400).json({
                message:
                    "Cannot delete room while patients are assigned"
            });
        }

        await Room.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Room deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete room"
        });
    }
};


module.exports = {
    createRoom,
    getAllRooms,
    getRoomById,
    assignPatientToRoom,
    removePatientFromRoom,
    updateRoom,
    deleteRoom
};