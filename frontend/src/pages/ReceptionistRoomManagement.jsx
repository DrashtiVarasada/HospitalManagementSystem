import { useEffect, useState } from "react";
import api from "../services/api";
import "./ReceptionistRoomManagement.css";

const ReceptionistRoomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [patients, setPatients] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingPatients, setLoadingPatients] = useState(false);

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState("");

    const [showAllocateModal, setShowAllocateModal] =
        useState(false);

    const [showDetailsModal, setShowDetailsModal] =
        useState(false);

    // FETCH ROOMS
    const fetchRooms = async () => {
        try {
            setLoading(true);

            const response = await api.get("/rooms");

            setRooms(response.data.rooms || []);
        } catch (error) {
            console.error("Failed to fetch rooms:", error);

            alert(
                error.response?.data?.message ||
                "Failed to fetch rooms"
            );
        } finally {
            setLoading(false);
        }
    };

    // FETCH PATIENTS
    const fetchPatients = async () => {
        try {
            setLoadingPatients(true);

            const response = await api.get("/patients");

            setPatients(response.data.patients || []);
        } catch (error) {
            console.error(
                "Failed to fetch patients:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to fetch patients"
            );
        } finally {
            setLoadingPatients(false);
        }
    };

    // OPEN ALLOCATE MODAL
    const openAllocateModal = (room) => {
        if (room.status === "maintenance") {
            alert("This room is under maintenance.");
            return;
        }

        if (room.occupiedBeds >= room.capacity) {
            alert("This room is full.");
            return;
        }

        setSelectedRoom(room);
        setSelectedPatient("");

        fetchPatients();

        setShowAllocateModal(true);
    };

    // ALLOCATE PATIENT
    const handleAllocatePatient = async (e) => {
        e.preventDefault();

        if (!selectedRoom || !selectedPatient) {
            alert("Please select a patient.");
            return;
        }

        try {
            await api.post(
                `/rooms/${selectedRoom._id}/patients/${selectedPatient}`
            );

            alert("Patient allocated successfully!");

            setShowAllocateModal(false);
            setSelectedRoom(null);
            setSelectedPatient("");

            await fetchRooms();
        } catch (error) {
            console.error(
                "Failed to allocate patient:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to allocate patient"
            );
        }
    };

    // DEALLOCATE PATIENT
    const handleDeallocatePatient = async (
        roomId,
        patientId
    ) => {
        const confirmDeallocate = window.confirm(
            "Are you sure you want to deallocate this patient from the room?"
        );

        if (!confirmDeallocate) {
            return;
        }

        try {
            await api.delete(
                `/rooms/${roomId}/patients/${patientId}`
            );

            alert("Patient deallocated successfully!");

            await fetchRooms();

            // Refresh details modal if currently open
            if (
                showDetailsModal &&
                selectedRoom?._id === roomId
            ) {
                const response = await api.get(
                    `/rooms/${roomId}`
                );

                setSelectedRoom(response.data.room);
            }
        } catch (error) {
            console.error(
                "Failed to deallocate patient:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to deallocate patient"
            );
        }
    };

    // VIEW ROOM DETAILS
    const handleViewRoom = async (roomId) => {
        try {
            const response = await api.get(
                `/rooms/${roomId}`
            );

            setSelectedRoom(response.data.room);
            setShowDetailsModal(true);
        } catch (error) {
            console.error(
                "Failed to fetch room details:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to fetch room details"
            );
        }
    };

    // CLOSE MODALS
    const closeAllocateModal = () => {
        setShowAllocateModal(false);
        setSelectedRoom(null);
        setSelectedPatient("");
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedRoom(null);
    };

    // FORMAT ROOM TYPE
    const formatRoomType = (type) => {
        if (!type) {
            return "-";
        }

        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    // FORMAT STATUS
    const formatStatus = (status) => {
        if (!status) {
            return "-";
        }

        return status
            .split("-")
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
            )
            .join(" ");
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    return (
        <div className="receptionist-room">
            {/* HEADER */}
            <div className="room-header">
                <div>
                    <h1>Room Management</h1>

                    <p>
                        View rooms and manage patient
                        allocation
                    </p>
                </div>

                <button
                    type="button"
                    className="room-refresh-btn"
                    onClick={fetchRooms}
                >
                    Refresh
                </button>
            </div>

            {/* ROOM LIST */}
            <div className="room-list-card">
                <div className="room-list-header">
                    <div>
                        <h2>Hospital Rooms</h2>

                        <p>
                            Total Rooms:{" "}
                            <strong>
                                {rooms.length}
                            </strong>
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="room-message">
                        Loading rooms...
                    </div>
                )}

                {!loading && rooms.length === 0 && (
                    <div className="room-message">
                        No rooms found.
                    </div>
                )}

                {!loading && rooms.length > 0 && (
                    <div className="room-table-container">
                        <table className="room-table">
                            <thead>
                                <tr>
                                    <th>Room No.</th>
                                    <th>Type</th>
                                    <th>Floor</th>
                                    <th>Capacity</th>
                                    <th>Occupied</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rooms.map((room) => (
                                    <tr
                                        key={room._id}
                                    >
                                        <td>
                                            <strong>
                                                {
                                                    room.roomNumber
                                                }
                                            </strong>
                                        </td>

                                        <td>
                                            {formatRoomType(
                                                room.roomType
                                            )}
                                        </td>

                                        <td>
                                            {room.floor ||
                                                "-"}
                                        </td>

                                        <td>
                                            {
                                                room.capacity
                                            }
                                        </td>

                                        <td>
                                            {
                                                room.occupiedBeds
                                            }{" "}
                                            /{" "}
                                            {
                                                room.capacity
                                            }
                                        </td>

                                        <td>
                                            <span
                                                className={`room-status ${room.status}`}
                                            >
                                                {formatStatus(
                                                    room.status
                                                )}
                                            </span>
                                        </td>

                                        <td className="room-actions">
                                            <button
                                                type="button"
                                                className="view-room-btn"
                                                onClick={() =>
                                                    handleViewRoom(
                                                        room._id
                                                    )
                                                }
                                            >
                                                View
                                            </button>

                                            <button
                                                type="button"
                                                className="allocate-room-btn"
                                                onClick={() =>
                                                    openAllocateModal(
                                                        room
                                                    )
                                                }
                                                disabled={
                                                    room.status ===
                                                        "maintenance" ||
                                                    room.occupiedBeds >=
                                                        room.capacity
                                                }
                                            >
                                                Allocate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ALLOCATE MODAL */}
            {showAllocateModal &&
                selectedRoom && (
                    <div
                        className="room-modal-overlay"
                        onClick={closeAllocateModal}
                    >
                        <div
                            className="room-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >
                            <div className="room-modal-header">
                                <div>
                                    <h2>
                                        Allocate Patient
                                    </h2>

                                    <p>
                                        Room{" "}
                                        {
                                            selectedRoom.roomNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="room-close-btn"
                                    onClick={
                                        closeAllocateModal
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            <form
                                onSubmit={
                                    handleAllocatePatient
                                }
                                className="room-allocation-form"
                            >
                                <div className="room-info-box">
                                    <span>
                                        Room Type
                                    </span>

                                    <strong>
                                        {formatRoomType(
                                            selectedRoom.roomType
                                        )}
                                    </strong>

                                    <span>
                                        Available Beds
                                    </span>

                                    <strong>
                                        {selectedRoom.capacity -
                                            selectedRoom.occupiedBeds}
                                    </strong>
                                </div>

                                <div className="room-form-group">
                                    <label>
                                        Select Patient *
                                    </label>

                                    <select
                                        value={
                                            selectedPatient
                                        }
                                        onChange={(e) =>
                                            setSelectedPatient(
                                                e.target
                                                    .value
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Patient
                                        </option>

                                        {loadingPatients ? (
                                            <option disabled>
                                                Loading
                                                patients...
                                            </option>
                                        ) : (
                                            patients.map(
                                                (
                                                    patient
                                                ) => (
                                                    <option
                                                        key={
                                                            patient._id
                                                        }
                                                        value={
                                                            patient._id
                                                        }
                                                    >
                                                        {
                                                            patient.name
                                                        }{" "}
                                                        -{" "}
                                                        {
                                                            patient.phone
                                                        }
                                                    </option>
                                                )
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="room-form-actions">
                                    <button
                                        type="submit"
                                        className="confirm-allocation-btn"
                                    >
                                        Allocate Patient
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-room-btn"
                                        onClick={
                                            closeAllocateModal
                                        }
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            {/* ROOM DETAILS MODAL */}
            {showDetailsModal &&
                selectedRoom && (
                    <div
                        className="room-modal-overlay"
                        onClick={closeDetailsModal}
                    >
                        <div
                            className="room-modal room-details-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >
                            <div className="room-modal-header">
                                <div>
                                    <h2>
                                        Room Details
                                    </h2>

                                    <p>
                                        Room{" "}
                                        {
                                            selectedRoom.roomNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="room-close-btn"
                                    onClick={
                                        closeDetailsModal
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            <div className="room-details-grid">
                                <div className="room-detail-box">
                                    <span>
                                        Room Number
                                    </span>

                                    <strong>
                                        {
                                            selectedRoom.roomNumber
                                        }
                                    </strong>
                                </div>

                                <div className="room-detail-box">
                                    <span>
                                        Room Type
                                    </span>

                                    <strong>
                                        {formatRoomType(
                                            selectedRoom.roomType
                                        )}
                                    </strong>
                                </div>

                                <div className="room-detail-box">
                                    <span>
                                        Floor
                                    </span>

                                    <strong>
                                        {
                                            selectedRoom.floor ||
                                            "-"
                                        }
                                    </strong>
                                </div>

                                <div className="room-detail-box">
                                    <span>
                                        Capacity
                                    </span>

                                    <strong>
                                        {
                                            selectedRoom.capacity
                                        }
                                    </strong>
                                </div>

                                <div className="room-detail-box">
                                    <span>
                                        Occupied Beds
                                    </span>

                                    <strong>
                                        {
                                            selectedRoom.occupiedBeds
                                        }
                                    </strong>
                                </div>

                                <div className="room-detail-box">
                                    <span>
                                        Status
                                    </span>

                                    <span
                                        className={`room-status ${selectedRoom.status}`}
                                    >
                                        {formatStatus(
                                            selectedRoom.status
                                        )}
                                    </span>
                                </div>

                                <div className="room-detail-box room-notes-box">
                                    <span>
                                        Notes
                                    </span>

                                    <strong>
                                        {
                                            selectedRoom.notes ||
                                            "No notes"
                                        }
                                    </strong>
                                </div>
                            </div>

                            <div className="assigned-patients-section">
                                <h3>
                                    Assigned Patients
                                </h3>

                                {!selectedRoom
                                    .patients ||
                                selectedRoom.patients
                                    .length === 0 ? (
                                    <p className="no-patients">
                                        No patients are
                                        currently assigned
                                        to this room.
                                    </p>
                                ) : (
                                    <div className="assigned-patients-list">
                                        {selectedRoom.patients.map(
                                            (patient) => (
                                                <div
                                                    className="assigned-patient"
                                                    key={
                                                        patient._id
                                                    }
                                                >
                                                    <div>
                                                        <strong>
                                                            {
                                                                patient.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                patient.phone
                                                            }
                                                        </span>

                                                        {patient.bloodGroup && (
                                                            <span>
                                                                Blood
                                                                Group:{" "}
                                                                {
                                                                    patient.bloodGroup
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="deallocate-room-btn"
                                                        onClick={() =>
                                                            handleDeallocatePatient(
                                                                selectedRoom._id,
                                                                patient._id
                                                            )
                                                        }
                                                    >
                                                        Deallocate
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="room-modal-footer">
                                <button
                                    type="button"
                                    className="room-modal-close-btn"
                                    onClick={
                                        closeDetailsModal
                                    }
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default ReceptionistRoomManagement;