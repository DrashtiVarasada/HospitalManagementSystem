import { useEffect, useState } from "react";
import api from "../services/api";
import "./ReceptionistMedicalRecordManagement.css";

const ReceptionistMedicalRecordManagement = () => {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);

    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showDetailsModal, setShowDetailsModal] =
        useState(false);

    const [patientHistory, setPatientHistory] = useState([]);
    const [selectedPatient, setSelectedPatient] =
        useState(null);

    const [showHistoryModal, setShowHistoryModal] =
        useState(false);

    const [loadingHistory, setLoadingHistory] =
        useState(false);

    // FETCH ALL MEDICAL RECORDS
    const fetchRecords = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/medical-records"
            );

            const data = response.data.records || [];

            setRecords(data);
            setFilteredRecords(data);
        } catch (error) {
            console.error(
                "Failed to fetch medical records:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to fetch medical records"
            );
        } finally {
            setLoading(false);
        }
    };

    // SEARCH RECORDS
    useEffect(() => {
        const search = searchTerm.toLowerCase().trim();

        if (!search) {
            setFilteredRecords(records);
            return;
        }

        const filtered = records.filter((record) => {
            const patientName =
                record.patient?.name?.toLowerCase() || "";

            const patientPhone =
                record.patient?.phone?.toLowerCase() || "";

            const diagnosis =
                record.diagnosis?.toLowerCase() || "";

            const doctorName =
                record.doctor?.name?.toLowerCase() || "";

            return (
                patientName.includes(search) ||
                patientPhone.includes(search) ||
                diagnosis.includes(search) ||
                doctorName.includes(search)
            );
        });

        setFilteredRecords(filtered);
    }, [searchTerm, records]);

    // VIEW RECORD
    const handleViewRecord = async (recordId) => {
        try {
            const response = await api.get(
                `/medical-records/${recordId}`
            );

            setSelectedRecord(
                response.data.medicalRecord
            );

            setShowDetailsModal(true);
        } catch (error) {
            console.error(
                "Failed to fetch medical record:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to fetch medical record"
            );
        }
    };

    // VIEW PATIENT HISTORY
    const handleViewHistory = async (patientId) => {
        try {
            setLoadingHistory(true);

            const response = await api.get(
                `/medical-records/patient/${patientId}`
            );

            setSelectedPatient(response.data.patient);

            setPatientHistory(
                response.data.records || []
            );

            setShowHistoryModal(true);
        } catch (error) {
            console.error(
                "Failed to fetch patient history:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to fetch patient history"
            );
        } finally {
            setLoadingHistory(false);
        }
    };

    // CLOSE DETAILS MODAL
    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedRecord(null);
    };

    // CLOSE HISTORY MODAL
    const closeHistoryModal = () => {
        setShowHistoryModal(false);
        setSelectedPatient(null);
        setPatientHistory([]);
    };

    // FORMAT DATE
    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    // FORMAT DATE + TIME
    const formatDateTime = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    return (
        <div className="receptionist-medical-records">

            {/* HEADER */}
            <div className="medical-record-header">
                <div>
                    <h1>Medical Records</h1>

                    <p>
                        View patient medical records and
                        previous medical history
                    </p>
                </div>

                <button
                    type="button"
                    className="medical-record-refresh-btn"
                    onClick={fetchRecords}
                >
                    Refresh
                </button>
            </div>

            {/* SEARCH */}
            <div className="medical-record-search-card">
                <div className="medical-record-search-group">
                    <label>
                        Search Medical Records
                    </label>

                    <input
                        type="text"
                        placeholder="Search by patient, phone, doctor or diagnosis..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                    />
                </div>
            </div>

            {/* RECORD LIST */}
            <div className="medical-record-list-card">

                <div className="medical-record-list-header">
                    <div>
                        <h2>
                            Medical Records
                        </h2>

                        <p>
                            Showing{" "}
                            <strong>
                                {filteredRecords.length}
                            </strong>{" "}
                            record(s)
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="medical-record-message">
                        Loading medical records...
                    </div>
                )}

                {!loading &&
                    filteredRecords.length === 0 && (
                        <div className="medical-record-message">
                            No medical records found.
                        </div>
                    )}

                {!loading &&
                    filteredRecords.length > 0 && (
                        <div className="medical-record-table-container">
                            <table className="medical-record-table">

                                <thead>
                                    <tr>
                                        <th>
                                            Patient
                                        </th>

                                        <th>
                                            Doctor
                                        </th>

                                        <th>
                                            Diagnosis
                                        </th>

                                        <th>
                                            Record Date
                                        </th>

                                        <th>
                                            Appointment
                                        </th>

                                        <th>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredRecords.map(
                                        (record) => (
                                            <tr
                                                key={
                                                    record._id
                                                }
                                            >
                                                <td>
                                                    <strong>
                                                        {
                                                            record
                                                                .patient
                                                                ?.name
                                                        }
                                                    </strong>

                                                    <span className="patient-phone">
                                                        {
                                                            record
                                                                .patient
                                                                ?.phone
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    {
                                                        record
                                                            .doctor
                                                            ?.name
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        record.diagnosis
                                                    }
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        record.recordDate
                                                    )}
                                                </td>

                                                <td>
                                                    <span>
                                                        {formatDate(
                                                            record
                                                                .appointment
                                                                ?.appointmentDate
                                                        )}
                                                    </span>

                                                    <span className="appointment-time">
                                                        {
                                                            record
                                                                .appointment
                                                                ?.appointmentTime
                                                        }
                                                    </span>
                                                </td>

                                                <td className="medical-record-actions">

                                                    <button
                                                        type="button"
                                                        className="view-medical-record-btn"
                                                        onClick={() =>
                                                            handleViewRecord(
                                                                record._id
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="history-medical-record-btn"
                                                        onClick={() =>
                                                            handleViewHistory(
                                                                record
                                                                    .patient
                                                                    ?._id
                                                            )
                                                        }
                                                    >
                                                        History
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

            {/* RECORD DETAILS MODAL */}
            {showDetailsModal &&
                selectedRecord && (
                    <div
                        className="medical-record-modal-overlay"
                        onClick={
                            closeDetailsModal
                        }
                    >
                        <div
                            className="medical-record-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="medical-record-modal-header">
                                <div>
                                    <h2>
                                        Medical Record
                                        Details
                                    </h2>

                                    <p>
                                        Patient:{" "}
                                        {
                                            selectedRecord
                                                .patient
                                                ?.name
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="medical-record-close-btn"
                                    onClick={
                                        closeDetailsModal
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            <div className="medical-record-details">

                                <div className="medical-detail-section">
                                    <h3>
                                        Patient Information
                                    </h3>

                                    <div className="medical-detail-grid">

                                        <div>
                                            <span>
                                                Name
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .patient
                                                        ?.name
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Phone
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .patient
                                                        ?.phone
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Email
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .patient
                                                        ?.email ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Blood Group
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .patient
                                                        ?.bloodGroup ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                    </div>
                                </div>

                                <div className="medical-detail-section">
                                    <h3>
                                        Doctor Information
                                    </h3>

                                    <div className="medical-detail-grid">

                                        <div>
                                            <span>
                                                Doctor
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .doctor
                                                        ?.name
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Specialization
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .doctor
                                                        ?.specialization ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Qualification
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .doctor
                                                        ?.qualification ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                    </div>
                                </div>

                                <div className="medical-detail-section">
                                    <h3>
                                        Appointment
                                        Information
                                    </h3>

                                    <div className="medical-detail-grid">

                                        <div>
                                            <span>
                                                Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    selectedRecord
                                                        .appointment
                                                        ?.appointmentDate
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Time
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .appointment
                                                        ?.appointmentTime
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Queue Number
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .appointment
                                                        ?.queueNumber
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Status
                                            </span>

                                            <strong>
                                                {
                                                    selectedRecord
                                                        .appointment
                                                        ?.status
                                                }
                                            </strong>
                                        </div>

                                    </div>
                                </div>

                                <div className="medical-detail-section">
                                    <h3>
                                        Medical Information
                                    </h3>

                                    <div className="medical-text-field">
                                        <span>
                                            Symptoms
                                        </span>

                                        <p>
                                            {
                                                selectedRecord.symptoms
                                            }
                                        </p>
                                    </div>

                                    <div className="medical-text-field">
                                        <span>
                                            Diagnosis
                                        </span>

                                        <p>
                                            {
                                                selectedRecord.diagnosis
                                            }
                                        </p>
                                    </div>

                                    <div className="medical-text-field">
                                        <span>
                                            Examination
                                        </span>

                                        <p>
                                            {
                                                selectedRecord.examination ||
                                                "-"
                                            }
                                        </p>
                                    </div>

                                    <div className="medical-text-field">
                                        <span>
                                            Treatment
                                        </span>

                                        <p>
                                            {
                                                selectedRecord.treatment ||
                                                "-"
                                            }
                                        </p>
                                    </div>

                                    <div className="medical-text-field">
                                        <span>
                                            Notes
                                        </span>

                                        <p>
                                            {
                                                selectedRecord.notes ||
                                                "-"
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="medical-record-date">
                                    Record Created:{" "}
                                    {formatDateTime(
                                        selectedRecord.recordDate
                                    )}
                                </div>

                            </div>

                            <div className="medical-record-modal-footer">
                                <button
                                    type="button"
                                    className="medical-record-modal-close-btn"
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

            {/* PATIENT HISTORY MODAL */}
            {showHistoryModal &&
                selectedPatient && (
                    <div
                        className="medical-record-modal-overlay"
                        onClick={
                            closeHistoryModal
                        }
                    >
                        <div
                            className="medical-record-modal history-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="medical-record-modal-header">
                                <div>
                                    <h2>
                                        Patient Medical
                                        History
                                    </h2>

                                    <p>
                                        Patient:{" "}
                                        {
                                            selectedPatient.name
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="medical-record-close-btn"
                                    onClick={
                                        closeHistoryModal
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            {loadingHistory ? (
                                <div className="medical-record-message">
                                    Loading patient
                                    history...
                                </div>
                            ) : patientHistory.length ===
                              0 ? (
                                <div className="medical-record-message">
                                    No previous medical
                                    records found for
                                    this patient.
                                </div>
                            ) : (
                                <div className="patient-history-list">

                                    <div className="history-summary">
                                        Total Records:{" "}
                                        <strong>
                                            {
                                                patientHistory.length
                                            }
                                        </strong>
                                    </div>

                                    {patientHistory.map(
                                        (
                                            record,
                                            index
                                        ) => (
                                            <div
                                                className="history-record-card"
                                                key={
                                                    record._id
                                                }
                                            >
                                                <div className="history-record-header">
                                                    <div>
                                                        <h3>
                                                            Visit{" "}
                                                            {index +
                                                                1}
                                                        </h3>

                                                        <span>
                                                            {formatDate(
                                                                record.recordDate
                                                            )}
                                                        </span>
                                                    </div>

                                                    <strong>
                                                        {
                                                            record
                                                                .doctor
                                                                ?.name
                                                        }
                                                    </strong>
                                                </div>

                                                <div className="history-record-content">

                                                    <div>
                                                        <span>
                                                            Diagnosis
                                                        </span>

                                                        <p>
                                                            {
                                                                record.diagnosis
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Symptoms
                                                        </span>

                                                        <p>
                                                            {
                                                                record.symptoms
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Treatment
                                                        </span>

                                                        <p>
                                                            {
                                                                record.treatment ||
                                                                "-"
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Notes
                                                        </span>

                                                        <p>
                                                            {
                                                                record.notes ||
                                                                "-"
                                                            }
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                            <div className="medical-record-modal-footer">
                                <button
                                    type="button"
                                    className="medical-record-modal-close-btn"
                                    onClick={
                                        closeHistoryModal
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

export default ReceptionistMedicalRecordManagement;