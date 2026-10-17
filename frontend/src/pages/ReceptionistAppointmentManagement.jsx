import { useEffect, useState } from "react";
import api from "../services/api";
import "./ReceptionistAppointmentManagement.css";

const ReceptionistAppointmentManagement = () => {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [showForm, setShowForm] = useState(false);

    const [selectedAppointment, setSelectedAppointment] =
        useState(null);

    const [editingAppointment, setEditingAppointment] =
        useState(null);

    const [form, setForm] = useState({
        patient: "",
        doctor: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
        notes: "",
        status: "waiting"
    });

    const [loading, setLoading] = useState(false);

    const [loadingAppointments, setLoadingAppointments] =
        useState(true);


    /* =========================
       FETCH PATIENTS
    ========================== */

    const fetchPatients = async () => {
        try {
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
        }
    };


    /* =========================
       FETCH DOCTORS
    ========================== */

    const fetchDoctors = async () => {
        try {
            const response = await api.get("/doctors");

            setDoctors(response.data.doctors || []);

        } catch (error) {
            console.error(
                "Failed to fetch doctors:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to fetch doctors"
            );
        }
    };


    /* =========================
       FETCH APPOINTMENTS
    ========================== */

    const fetchAppointments = async () => {
        try {
            setLoadingAppointments(true);

            const response =
                await api.get("/appointments");

            setAppointments(
                response.data.appointments || []
            );

        } catch (error) {
            console.error(
                "Failed to fetch appointments:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to fetch appointments"
            );

        } finally {
            setLoadingAppointments(false);
        }
    };


    /* =========================
       TODAY DATE
    ========================== */

    const getTodayDate = () => {
        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };


    /* =========================
       CURRENT TIME
    ========================== */

    const getCurrentTime = () => {
        const now = new Date();

        const hours = String(
            now.getHours()
        ).padStart(2, "0");

        const minutes = String(
            now.getMinutes()
        ).padStart(2, "0");

        return `${hours}:${minutes}`;
    };


    /* =========================
       RESET FORM
    ========================== */

    const resetForm = () => {
        setForm({
            patient: "",
            doctor: "",
            appointmentDate: "",
            appointmentTime: "",
            reason: "",
            notes: "",
            status: "waiting"
        });
    };


    /* =========================
       OPEN CREATE FORM
    ========================== */

    const openCreateForm = () => {
        setEditingAppointment(null);

        setForm({
            patient: "",
            doctor: "",
            appointmentDate: getTodayDate(),
            appointmentTime: getCurrentTime(),
            reason: "",
            notes: "",
            status: "waiting"
        });

        setShowForm(true);

        fetchPatients();
        fetchDoctors();
    };


    /* =========================
       HANDLE FORM CHANGE
    ========================== */

    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };


    /* =========================
       CREATE APPOINTMENT
    ========================== */

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !form.patient ||
            !form.doctor ||
            !form.appointmentDate ||
            !form.appointmentTime ||
            !form.reason
        ) {
            alert(
                "Please fill all required fields."
            );

            return;
        }

        try {
            setLoading(true);

            const response = await api.post(
                "/appointments",
                form
            );

            alert(
                `Appointment created successfully!\nQueue Number: ${response.data.appointment.queueNumber}`
            );

            setShowForm(false);
            setEditingAppointment(null);

            resetForm();

            await fetchAppointments();

        } catch (error) {
            console.error(
                "Failed to create appointment:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to create appointment"
            );

        } finally {
            setLoading(false);
        }
    };


    /* =========================
       VIEW APPOINTMENT
    ========================== */

    const handleViewAppointment = async (id) => {
        try {
            const response =
                await api.get(
                    `/appointments/${id}`
                );

            setSelectedAppointment(
                response.data.appointment
            );

        } catch (error) {
            console.error(
                "Failed to fetch appointment:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to fetch appointment details"
            );
        }
    };


    /* =========================
       EDIT APPOINTMENT
    ========================== */

    const handleEditAppointment = (appointment) => {

        setSelectedAppointment(null);

        setEditingAppointment(appointment);

        setForm({
            patient:
                appointment.patient?._id || "",

            doctor:
                appointment.doctor?._id || "",

            appointmentDate:
                appointment.appointmentDate
                    ? appointment.appointmentDate.substring(
                        0,
                        10
                    )
                    : "",

            appointmentTime:
                appointment.appointmentTime || "",

            reason:
                appointment.reason || "",

            notes:
                appointment.notes || "",

            status:
                appointment.status || "waiting"
        });

        setShowForm(true);

        fetchPatients();
        fetchDoctors();
    };


    /* =========================
       UPDATE APPOINTMENT
    ========================== */

    const handleUpdateAppointment = async (e) => {
        e.preventDefault();

        if (!editingAppointment) {
            return;
        }

        if (
            !form.patient ||
            !form.doctor ||
            !form.appointmentDate ||
            !form.appointmentTime ||
            !form.reason
        ) {
            alert(
                "Please fill all required fields."
            );

            return;
        }

        try {
            setLoading(true);

            await api.put(
                `/appointments/${editingAppointment._id}`,
                form
            );

            alert(
                "Appointment updated successfully!"
            );

            setEditingAppointment(null);

            setShowForm(false);

            resetForm();

            await fetchAppointments();

        } catch (error) {
            console.error(
                "Failed to update appointment:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to update appointment"
            );

        } finally {
            setLoading(false);
        }
    };


    /* =========================
       DELETE APPOINTMENT
    ========================== */

    const handleDeleteAppointment = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this appointment?"
        );

        if (!confirmDelete) {
            return;
        }

        try {

            await api.delete(
                `/appointments/${id}`
            );

            alert(
                "Appointment deleted successfully!"
            );

            await fetchAppointments();

        } catch (error) {

            console.error(
                "Failed to delete appointment:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to delete appointment"
            );
        }
    };


    /* =========================
       CANCEL FORM
    ========================== */

    const handleCancelForm = () => {
        setShowForm(false);

        setEditingAppointment(null);

        resetForm();
    };


    /* =========================
       FORMAT DATE
    ========================== */

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return new Date(
            date
        ).toLocaleDateString();
    };


    /* =========================
       INITIAL LOAD
    ========================== */

    useEffect(() => {

        fetchPatients();
        fetchDoctors();
        fetchAppointments();

    }, []);


    return (
        <div className="receptionist-appointment">


            {/* =========================
                HEADER
            ========================== */}

            <div className="appointment-header">

                <div>

                    <h1>
                        Appointment Management
                    </h1>

                    <p>
                        Create and manage patient
                        appointments
                    </p>

                </div>


                <button
                    type="button"
                    className="create-appointment-btn"
                    onClick={openCreateForm}
                >
                    + Create Appointment
                </button>

            </div>


            {/* =========================
                CREATE / EDIT FORM
            ========================== */}

            {showForm && (

                <div className="appointment-form-card">

                    <h2>
                        {editingAppointment
                            ? "Edit Appointment"
                            : "Create Appointment"}
                    </h2>


                    <form
                        onSubmit={
                            editingAppointment
                                ? handleUpdateAppointment
                                : handleSubmit
                        }
                        className="appointment-form"
                    >


                        {/* PATIENT */}

                        <div className="form-group">

                            <label>
                                Patient *
                            </label>

                            <select
                                name="patient"
                                value={form.patient}
                                onChange={handleChange}
                                required
                            >

                                <option value="">
                                    Select Patient
                                </option>

                                {patients.map(
                                    (patient) => (

                                        <option
                                            key={patient._id}
                                            value={patient._id}
                                        >
                                            {patient.name}
                                            {" - "}
                                            {patient.phone}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* DOCTOR */}

                        <div className="form-group">

                            <label>
                                Doctor *
                            </label>

                            <select
                                name="doctor"
                                value={form.doctor}
                                onChange={handleChange}
                                required
                            >

                                <option value="">
                                    Select Doctor
                                </option>

                                {doctors.map(
                                    (doctor) => (

                                        <option
                                            key={doctor._id}
                                            value={doctor._id}
                                        >
                                            {doctor.name}
                                            {" - "}
                                            {doctor.specialization}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* DATE */}

                        <div className="form-group">

                            <label>
                                Appointment Date *
                            </label>

                            <input
                                type="date"
                                name="appointmentDate"
                                value={
                                    form.appointmentDate
                                }
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* TIME */}

                        <div className="form-group">

                            <label>
                                Appointment Time *
                            </label>

                            <input
                                type="time"
                                name="appointmentTime"
                                value={
                                    form.appointmentTime
                                }
                                onChange={handleChange}
                                required
                            />

                        </div>


                        {/* REASON */}

                        <div className="form-group">

                            <label>
                                Reason *
                            </label>

                            <input
                                type="text"
                                name="reason"
                                value={form.reason}
                                onChange={handleChange}
                                placeholder="Enter reason for appointment"
                                required
                            />

                        </div>


                        {/* STATUS - EDIT ONLY */}

                        {editingAppointment && (

                            <div className="form-group">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >

                                    <option value="waiting">
                                        Waiting
                                    </option>

                                    <option value="in-consultation">
                                        In Consultation
                                    </option>

                                    <option value="completed">
                                        Completed
                                    </option>

                                    <option value="cancelled">
                                        Cancelled
                                    </option>

                                </select>

                            </div>

                        )}


                        {/* NOTES */}

                        <div className="form-group full-width">

                            <label>
                                Notes
                            </label>

                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Optional notes"
                                rows="4"
                            />

                        </div>


                        {/* BUTTONS */}

                        <div className="form-actions">

                            <button
                                type="submit"
                                className="submit-appointment-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? editingAppointment
                                        ? "Updating..."
                                        : "Creating..."
                                    : editingAppointment
                                        ? "Update Appointment"
                                        : "Create Appointment"}
                            </button>


                            <button
                                type="button"
                                className="cancel-appointment-btn"
                                onClick={handleCancelForm}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* =========================
                APPOINTMENT LIST
            ========================== */}

            <div className="appointment-list-card">

                <div className="appointment-list-header">

                    <div>

                        <h2>
                            Appointments
                        </h2>

                        <p>
                            Total Appointments:{" "}
                            <strong>
                                {appointments.length}
                            </strong>
                        </p>

                    </div>


                    <button
                        type="button"
                        className="refresh-btn"
                        onClick={fetchAppointments}
                    >
                        Refresh
                    </button>

                </div>


                {loadingAppointments && (

                    <div className="appointment-message">
                        Loading appointments...
                    </div>

                )}


                {!loadingAppointments &&
                    appointments.length === 0 && (

                        <div className="appointment-message">
                            No appointments found.
                        </div>

                    )}


                {!loadingAppointments &&
                    appointments.length > 0 && (

                        <div className="appointment-table-container">

                            <table className="appointment-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Queue
                                        </th>

                                        <th>
                                            Patient
                                        </th>

                                        <th>
                                            Doctor
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Time
                                        </th>

                                        <th>
                                            Reason
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {appointments.map(
                                        (appointment) => (

                                            <tr
                                                key={
                                                    appointment._id
                                                }
                                            >

                                                <td>
                                                    <strong>
                                                        #
                                                        {
                                                            appointment.queueNumber
                                                        }
                                                    </strong>
                                                </td>


                                                <td>
                                                    {
                                                        appointment
                                                            .patient
                                                            ?.name
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        appointment
                                                            .doctor
                                                            ?.name
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        formatDate(
                                                            appointment.appointmentDate
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        appointment.appointmentTime
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        appointment.reason
                                                    }
                                                </td>


                                                <td>

                                                    <span
                                                        className={`appointment-status ${appointment.status}`}
                                                    >
                                                        {
                                                            appointment.status?.replace(
                                                                "-",
                                                                " "
                                                            )
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    <button
                                                        type="button"
                                                        className="view-appointment-btn"
                                                        onClick={() =>
                                                            handleViewAppointment(
                                                                appointment._id
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="edit-appointment-btn"
                                                        onClick={() =>
                                                            handleEditAppointment(
                                                                appointment
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="delete-appointment-btn"
                                                        onClick={() =>
                                                            handleDeleteAppointment(
                                                                appointment._id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

            </div>


            {/* =========================
                VIEW APPOINTMENT MODAL
            ========================== */}

            {selectedAppointment && (

                <div
                    className="appointment-modal-overlay"
                    onClick={() =>
                        setSelectedAppointment(null)
                    }
                >

                    <div
                        className="appointment-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="appointment-modal-header">

                            <div>

                                <h2>
                                    Appointment Details
                                </h2>

                                <p>
                                    Queue #
                                    {
                                        selectedAppointment.queueNumber
                                    }
                                </p>

                            </div>


                            <button
                                type="button"
                                className="appointment-close-btn"
                                onClick={() =>
                                    setSelectedAppointment(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="appointment-details-grid">


                            <div className="appointment-detail">

                                <span>
                                    Patient
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .patient
                                            ?.name
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .patient
                                            ?.phone || "-"
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Email
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .patient
                                            ?.email || "-"
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Blood Group
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .patient
                                            ?.bloodGroup || "-"
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Doctor
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .doctor
                                            ?.name
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Specialization
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .doctor
                                            ?.specialization ||
                                        "-"
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Date
                                </span>

                                <strong>
                                    {
                                        formatDate(
                                            selectedAppointment
                                                .appointmentDate
                                        )
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Time
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .appointmentTime
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Reason
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .reason
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail">

                                <span>
                                    Status
                                </span>

                                <span
                                    className={`appointment-status ${selectedAppointment.status}`}
                                >
                                    {
                                        selectedAppointment
                                            .status
                                            ?.replace(
                                                "-",
                                                " "
                                            )
                                    }
                                </span>

                            </div>


                            <div className="appointment-detail appointment-notes">

                                <span>
                                    Notes
                                </span>

                                <strong>
                                    {
                                        selectedAppointment
                                            .notes ||
                                        "No notes"
                                    }
                                </strong>

                            </div>

                        </div>


                        <div className="appointment-modal-footer">

                            <button
                                type="button"
                                className="appointment-modal-close"
                                onClick={() =>
                                    setSelectedAppointment(
                                        null
                                    )
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

export default ReceptionistAppointmentManagement;