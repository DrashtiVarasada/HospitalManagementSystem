import { useEffect, useState } from "react";
import api from "../services/api";
import "./ManagerAppointmentManagement.css";

const ManagerAppointmentManagement = () => {
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] =
        useState(null);

    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [showDetails, setShowDetails] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/appointments");

            setAppointments(
                response.data.appointments || []
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to fetch appointments"
            );
        } finally {
            setLoading(false);
        }
    };

    const viewAppointmentDetails = async (appointment) => {
        try {
            setDetailsLoading(true);
            setError("");

            const response = await api.get(
                `/appointments/${appointment._id}`
            );

            setSelectedAppointment(
                response.data.appointment
            );

            setShowDetails(true);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to fetch appointment details"
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setShowDetails(false);
        setSelectedAppointment(null);
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const formatStatus = (status) => {
        if (!status) return "Unknown";

        return (
            status.charAt(0).toUpperCase() +
            status.slice(1)
        );
    };

    const getStatusClass = (status) => {
        if (status === "completed") {
            return "completed";
        }

        if (status === "cancelled") {
            return "cancelled";
        }

        return "waiting";
    };

    const totalAppointments = appointments.length;

    const waitingAppointments = appointments.filter(
        (appointment) =>
            appointment.status === "waiting"
    ).length;

    const completedAppointments = appointments.filter(
        (appointment) =>
            appointment.status === "completed"
    ).length;

    const cancelledAppointments = appointments.filter(
        (appointment) =>
            appointment.status === "cancelled"
    ).length;

    return (
        <div className="manager-appointment-page">

            <div className="appointment-page-header">
                <div>
                    <h2>Appointment Management</h2>
                    <p>
                        View all hospital appointments and
                        appointment details.
                    </p>
                </div>

                <button
                    className="secondary-button"
                    onClick={fetchAppointments}
                >
                    Refresh
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

            <div className="appointment-summary">

                <div className="summary-card">
                    <span>Total Appointments</span>
                    <strong>
                        {totalAppointments}
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Waiting</span>
                    <strong>
                        {waitingAppointments}
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Completed</span>
                    <strong>
                        {completedAppointments}
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Cancelled</span>
                    <strong>
                        {cancelledAppointments}
                    </strong>
                </div>

            </div>

            <div className="appointments-card">

                <div className="card-header">
                    <div>
                        <h3>All Appointments</h3>
                        <p>
                            Complete list of hospital
                            appointments.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        Loading appointments...
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="empty-state">
                        No appointments found.
                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table className="appointments-table">

                            <thead>
                                <tr>
                                    <th>Queue</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Action</th>
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
                                                <div className="patient-cell">
                                                    <strong>
                                                        {
                                                            appointment
                                                                .patient
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            appointment
                                                                .patient
                                                                ?.phone ||
                                                            "-"
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="doctor-cell">
                                                    <strong>
                                                        Dr.{" "}
                                                        {appointment
                                                            .doctor
                                                            ?.name
                                                            ?.replace(
                                                                /^Dr\.\s*/i,
                                                                ""
                                                            )
                                                            .trim() ||
                                                            "-"}
                                                    </strong>

                                                    <span>
                                                        {
                                                            appointment
                                                                .doctor
                                                                ?.specialization ||
                                                            "-"
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    appointment.appointmentDate
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    appointment.appointmentTime ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                <span className="reason-text">
                                                    {
                                                        appointment.reason ||
                                                        "-"
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge ${getStatusClass(
                                                        appointment.status
                                                    )}`}
                                                >
                                                    {formatStatus(
                                                        appointment.status
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="view-button"
                                                    onClick={() =>
                                                        viewAppointmentDetails(
                                                            appointment
                                                        )
                                                    }
                                                >
                                                    View Details
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

            {showDetails &&
                selectedAppointment && (
                    <div className="modal-overlay">

                        <div className="appointment-modal">

                            <div className="modal-header">

                                <div>
                                    <h3>
                                        Appointment Details
                                    </h3>

                                    <p>
                                        Queue #
                                        {
                                            selectedAppointment.queueNumber
                                        }
                                    </p>
                                </div>

                                <button
                                    className="close-button"
                                    onClick={closeDetails}
                                >
                                    ×
                                </button>

                            </div>

                            {detailsLoading ? (
                                <div className="loading-state">
                                    Loading details...
                                </div>
                            ) : (
                                <div className="appointment-details">

                                    <div className="detail-section">

                                        <h4>
                                            Appointment Information
                                        </h4>

                                        <div className="detail-grid">

                                            <div className="detail-item">
                                                <span>
                                                    Queue Number
                                                </span>

                                                <strong>
                                                    #
                                                    {
                                                        selectedAppointment.queueNumber
                                                    }
                                                </strong>
                                            </div>

                                            <div className="detail-item">
                                                <span>
                                                    Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        selectedAppointment.appointmentDate
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="detail-item">
                                                <span>
                                                    Time
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment.appointmentTime ||
                                                        "-"
                                                    }
                                                </strong>
                                            </div>

                                            <div className="detail-item">
                                                <span>
                                                    Status
                                                </span>

                                                <strong>
                                                    {formatStatus(
                                                        selectedAppointment.status
                                                    )}
                                                </strong>
                                            </div>

                                            <div className="detail-item full-width">
                                                <span>
                                                    Reason
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment.reason ||
                                                        "-"
                                                    }
                                                </strong>
                                            </div>

                                            <div className="detail-item full-width">
                                                <span>
                                                    Notes
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment.notes ||
                                                        "No notes available."
                                                    }
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                    <div className="detail-section">

                                        <h4>
                                            Patient Information
                                        </h4>

                                        <div className="detail-grid">

                                            <div className="detail-item">
                                                <span>
                                                    Name
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment
                                                            .patient
                                                            ?.name ||
                                                        "-"
                                                    }
                                                </strong>
                                            </div>

                                            <div className="detail-item">
                                                <span>
                                                    Phone
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment
                                                            .patient
                                                            ?.phone ||
                                                        "-"
                                                    }
                                                </strong>
                                            </div>

                                            <div className="detail-item">
                                                <span>
                                                    Email
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment
                                                            .patient
                                                            ?.email ||
                                                        "-"
                                                    }
                                                </strong>
                                            </div>

                                            <div className="detail-item">
                                                <span>
                                                    Blood Group
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment
                                                            .patient
                                                            ?.bloodGroup ||
                                                        "-"
                                                    }
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                    <div className="detail-section">

                                        <h4>
                                            Doctor Information
                                        </h4>

                                        <div className="detail-grid">

                                            <div className="detail-item">
                                                <span>
                                                    Doctor
                                                </span>

                                                <strong>
                                                    Dr.{" "}
                                                    {selectedAppointment
                                                        .doctor
                                                        ?.name
                                                        ?.replace(
                                                            /^Dr\.\s*/i,
                                                            ""
                                                        )
                                                        .trim() ||
                                                        "-"}
                                                </strong>
                                            </div>

                                            <div className="detail-item">
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

                                            <div className="detail-item">
                                                <span>
                                                    Qualification
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment
                                                            .doctor
                                                            ?.qualification ||
                                                        "-"
                                                    }
                                                </strong>
                                            </div>

                                            <div className="detail-item">
                                                <span>
                                                    Phone
                                                </span>

                                                <strong>
                                                    {
                                                        selectedAppointment
                                                            .doctor
                                                            ?.phone ||
                                                        "-"
                                                    }
                                                </strong>
                                            </div>

                                            <div className="detail-item">
                                                <span>
                                                    Consultation Fee
                                                </span>

                                                <strong>
                                                    ₹
                                                    {selectedAppointment
                                                        .doctor
                                                        ?.consultationFee ??
                                                        "-"}
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                </div>
                            )}

                            <div className="modal-actions">

                                <button
                                    className="secondary-button"
                                    onClick={closeDetails}
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

export default ManagerAppointmentManagement;