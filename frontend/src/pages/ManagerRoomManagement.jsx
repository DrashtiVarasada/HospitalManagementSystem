import { useEffect, useState } from "react";
import api from "../services/api";
import "./ManagerRoomManagement.css";

const ManagerRoomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        roomNumber: "",
        roomType: "general",
        floor: "",
        capacity: "",
        notes: ""
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/rooms");

            setRooms(response.data.rooms || []);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to load rooms"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const openAddModal = () => {
        setEditingRoom(null);

        setForm({
            roomNumber: "",
            roomType: "general",
            floor: "",
            capacity: "",
            notes: ""
        });

        setMessage("");
        setError("");
        setShowModal(true);
    };

    const openEditModal = (room) => {
        setEditingRoom(room);

        setForm({
            roomNumber: room.roomNumber || "",
            roomType: room.roomType || "general",
            floor: room.floor || "",
            capacity: room.capacity || "",
            notes: room.notes || ""
        });

        setMessage("");
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingRoom(null);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const payload = {
                roomNumber: form.roomNumber.trim(),
                roomType: form.roomType,
                floor: form.floor.trim(),
                capacity: Number(form.capacity),
                notes: form.notes.trim()
            };

            if (!payload.roomNumber || !payload.capacity) {
                setError(
                    "Room number and capacity are required"
                );
                setSaving(false);
                return;
            }

            if (payload.capacity < 1) {
                setError("Capacity must be at least 1");
                setSaving(false);
                return;
            }

            if (editingRoom) {
                const response = await api.put(
                    `/rooms/${editingRoom._id}`,
                    payload
                );

                setMessage(
                    response.data.message ||
                    "Room updated successfully"
                );
            } else {
                const response = await api.post(
                    "/rooms",
                    payload
                );

                setMessage(
                    response.data.message ||
                    "Room created successfully"
                );
            }

            setShowModal(false);
            setEditingRoom(null);

            await fetchRooms();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to save room"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (room) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete room ${room.roomNumber}?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            const response = await api.delete(
                `/rooms/${room._id}`
            );

            setMessage(
                response.data.message ||
                "Room deleted successfully"
            );

            await fetchRooms();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to delete room"
            );
        }
    };

    const viewRoomDetails = async (room) => {
        try {
            setError("");

            const response = await api.get(
                `/rooms/${room._id}`
            );

            setSelectedRoom(response.data.room);
            setShowDetails(true);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to load room details"
            );
        }
    };

    const closeDetails = () => {
        setShowDetails(false);
        setSelectedRoom(null);
    };

    const getRoomTypeLabel = (type) => {
        const labels = {
            general: "General",
            icu: "ICU",
            ot: "OT",
            rest: "Rest"
        };

        return labels[type] || type;
    };

    const getStatusLabel = (status) => {
        const labels = {
            available: "Available",
            occupied: "Occupied",
            maintenance: "Maintenance"
        };

        return labels[status] || status;
    };

    return (
        <div className="manager-room-page">

            <div className="room-page-header">
                <div>
                    <h2>Room Management</h2>
                    <p>
                        Manage hospital rooms and room information.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={openAddModal}
                >
                    Add Room
                </button>
            </div>

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="room-summary">
                <div className="summary-card">
                    <span>Total Rooms</span>
                    <strong>{rooms.length}</strong>
                </div>

                <div className="summary-card">
                    <span>Available</span>
                    <strong>
                        {
                            rooms.filter(
                                (room) =>
                                    room.status === "available"
                            ).length
                        }
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Occupied</span>
                    <strong>
                        {
                            rooms.filter(
                                (room) =>
                                    room.status === "occupied"
                            ).length
                        }
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Maintenance</span>
                    <strong>
                        {
                            rooms.filter(
                                (room) =>
                                    room.status === "maintenance"
                            ).length
                        }
                    </strong>
                </div>
            </div>

            <div className="rooms-card">

                <div className="card-header">
                    <h3>All Rooms</h3>

                    <button
                        className="secondary-button"
                        onClick={fetchRooms}
                    >
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">
                        Loading rooms...
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="empty-state">
                        No rooms found.
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="rooms-table">
                            <thead>
                                <tr>
                                    <th>Room No.</th>
                                    <th>Type</th>
                                    <th>Floor</th>
                                    <th>Capacity</th>
                                    <th>Occupied</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rooms.map((room) => (
                                    <tr key={room._id}>
                                        <td>
                                            <strong>
                                                {room.roomNumber}
                                            </strong>
                                        </td>

                                        <td>
                                            {getRoomTypeLabel(
                                                room.roomType
                                            )}
                                        </td>

                                        <td>
                                            {room.floor || "-"}
                                        </td>

                                        <td>
                                            {room.capacity}
                                        </td>

                                        <td>
                                            {room.occupiedBeds || 0}
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge ${room.status}`}
                                            >
                                                {getStatusLabel(
                                                    room.status
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="view-button"
                                                    onClick={() =>
                                                        viewRoomDetails(
                                                            room
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                                <button
                                                    className="edit-button"
                                                    onClick={() =>
                                                        openEditModal(
                                                            room
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            room
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="room-modal">

                        <div className="modal-header">
                            <div>
                                <h3>
                                    {editingRoom
                                        ? "Update Room"
                                        : "Add Room"}
                                </h3>

                                <p>
                                    {editingRoom
                                        ? "Update room information."
                                        : "Enter the new room information."}
                                </p>
                            </div>

                            <button
                                className="close-button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="room-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-row">

                                <div className="form-group">
                                    <label>
                                        Room Number
                                    </label>

                                    <input
                                        type="text"
                                        name="roomNumber"
                                        value={form.roomNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. G-101"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Room Type
                                    </label>

                                    <select
                                        name="roomType"
                                        value={form.roomType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="general">
                                            General
                                        </option>

                                        <option value="icu">
                                            ICU
                                        </option>

                                        <option value="ot">
                                            OT
                                        </option>

                                        <option value="rest">
                                            Rest
                                        </option>
                                    </select>
                                </div>

                            </div>

                            <div className="form-row">

                                <div className="form-group">
                                    <label>
                                        Floor
                                    </label>

                                    <input
                                        type="text"
                                        name="floor"
                                        value={form.floor}
                                        onChange={handleChange}
                                        placeholder="e.g. Ground Floor"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Bed Capacity
                                    </label>

                                    <input
                                        type="number"
                                        name="capacity"
                                        value={form.capacity}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                    />
                                </div>

                            </div>

                            <div className="form-group">
                                <label>
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Optional notes"
                                />
                            </div>

                            {error && (
                                <div className="form-error">
                                    {error}
                                </div>
                            )}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingRoom
                                            ? "Update Room"
                                            : "Add Room"}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

            {showDetails && selectedRoom && (
                <div className="modal-overlay">
                    <div className="room-modal details-modal">

                        <div className="modal-header">
                            <div>
                                <h3>
                                    Room {selectedRoom.roomNumber}
                                </h3>

                                <p>
                                    Room details and assigned patients.
                                </p>
                            </div>

                            <button
                                className="close-button"
                                onClick={closeDetails}
                            >
                                ×
                            </button>
                        </div>

                        <div className="room-details">

                            <div className="detail-grid">

                                <div className="detail-item">
                                    <span>Room Number</span>
                                    <strong>
                                        {selectedRoom.roomNumber}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <span>Room Type</span>
                                    <strong>
                                        {getRoomTypeLabel(
                                            selectedRoom.roomType
                                        )}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <span>Floor</span>
                                    <strong>
                                        {selectedRoom.floor || "-"}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <span>Capacity</span>
                                    <strong>
                                        {selectedRoom.capacity}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <span>Occupied Beds</span>
                                    <strong>
                                        {selectedRoom.occupiedBeds || 0}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <span>Status</span>
                                    <strong>
                                        {getStatusLabel(
                                            selectedRoom.status
                                        )}
                                    </strong>
                                </div>

                            </div>

                            <div className="details-section">
                                <h4>Notes</h4>

                                <p>
                                    {selectedRoom.notes ||
                                        "No notes available."}
                                </p>
                            </div>

                            <div className="details-section">
                                <h4>
                                    Assigned Patients
                                </h4>

                                {!selectedRoom.patients ||
                                selectedRoom.patients.length === 0 ? (
                                    <p className="no-patients">
                                        No patients assigned.
                                    </p>
                                ) : (
                                    <div className="patients-list">
                                        {selectedRoom.patients.map(
                                            (patient) => (
                                                <div
                                                    className="patient-item"
                                                    key={patient._id}
                                                >
                                                    <strong>
                                                        {patient.name}
                                                    </strong>

                                                    <span>
                                                        Phone:{" "}
                                                        {patient.phone ||
                                                            "-"}
                                                    </span>

                                                    <span>
                                                        Email:{" "}
                                                        {patient.email ||
                                                            "-"}
                                                    </span>

                                                    <span>
                                                        Blood Group:{" "}
                                                        {patient.bloodGroup ||
                                                            "-"}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={closeDetails}
                            >
                                Close
                            </button>

                            <button
                                className="primary-button"
                                onClick={() => {
                                    closeDetails();
                                    openEditModal(selectedRoom);
                                }}
                            >
                                Edit Room
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default ManagerRoomManagement;