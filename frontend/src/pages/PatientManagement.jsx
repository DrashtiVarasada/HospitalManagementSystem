import { useEffect, useState } from "react";
import api from "../services/api";
import "./PatientManagement.css";

const PatientManagement = () => {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    // FETCH PATIENTS
    const fetchPatients = async () => {
        try {
            setLoading(true);

            const response = await api.get("/patients");

            setPatients(response.data.patients || []);
        } catch (error) {
            console.error("Failed to fetch patients:", error);

            alert(
                error.response?.data?.message ||
                "Failed to fetch patients"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    // DELETE PATIENT
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this patient?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await api.delete(`/patients/${id}`);

            alert("Patient deleted successfully");

            setSelectedPatient(null);

            fetchPatients();
        } catch (error) {
            console.error("Failed to delete patient:", error);

            alert(
                error.response?.data?.message ||
                "Failed to delete patient"
            );
        }
    };

    // SEARCH PATIENTS
    const filteredPatients = patients.filter((patient) => {
        const searchText = search.toLowerCase();

        return (
            patient.name?.toLowerCase().includes(searchText) ||
            patient.phone?.toLowerCase().includes(searchText) ||
            patient.email?.toLowerCase().includes(searchText)
        );
    });

    return (
        <div className="patient-management">

            {/* HEADER */}
            <div className="patient-header">
                <div>
                    <h1>Patient Management</h1>
                    <p>
                        View and manage registered patients
                    </p>
                </div>

                <div className="patient-count">
                    Total Patients: <strong>{patients.length}</strong>
                </div>
            </div>

            {/* SEARCH */}
            <div className="patient-search">
                <input
                    type="text"
                    placeholder="Search by name, phone or email..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />
            </div>

            {/* LOADING */}
            {loading ? (
                <div className="patient-message">
                    Loading patients...
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="patient-message">
                    No patients found.
                </div>
            ) : (
                <div className="patient-table-container">
                    <table className="patient-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Date of Birth</th>
                                <th>Gender</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Blood Group</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredPatients.map(
                                (patient) => (
                                    <tr key={patient._id}>
                                        <td>{patient.name}</td>

                                        <td>
                                            {new Date(
                                                patient.dateOfBirth
                                            ).toLocaleDateString()}
                                        </td>

                                        <td>
                                            {patient.gender}
                                        </td>

                                        <td>
                                            {patient.phone}
                                        </td>

                                        <td>
                                            {patient.email || "-"}
                                        </td>

                                        <td>
                                            {patient.bloodGroup || "-"}
                                        </td>

                                        <td>
                                            <button
                                                className="view-btn"
                                                onClick={() =>
                                                    setSelectedPatient(
                                                        patient
                                                    )
                                                }
                                            >
                                                View
                                            </button>

                                            <button
                                                className="delete-btn"
                                                onClick={() =>
                                                    handleDelete(
                                                        patient._id
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

            {/* PATIENT DETAILS */}
            {selectedPatient && (
                <div className="patient-modal-overlay">
                    <div className="patient-modal">

                        <div className="patient-modal-header">
                            <h2>Patient Details</h2>

                            <button
                                className="close-btn"
                                onClick={() =>
                                    setSelectedPatient(null)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div className="patient-details">

                            <div>
                                <strong>Name:</strong>
                                <span>
                                    {selectedPatient.name}
                                </span>
                            </div>

                            <div>
                                <strong>Date of Birth:</strong>
                                <span>
                                    {new Date(
                                        selectedPatient.dateOfBirth
                                    ).toLocaleDateString()}
                                </span>
                            </div>

                            <div>
                                <strong>Gender:</strong>
                                <span>
                                    {selectedPatient.gender}
                                </span>
                            </div>

                            <div>
                                <strong>Phone:</strong>
                                <span>
                                    {selectedPatient.phone}
                                </span>
                            </div>

                            <div>
                                <strong>Email:</strong>
                                <span>
                                    {selectedPatient.email || "-"}
                                </span>
                            </div>

                            <div>
                                <strong>Address:</strong>
                                <span>
                                    {selectedPatient.address || "-"}
                                </span>
                            </div>

                            <div>
                                <strong>Blood Group:</strong>
                                <span>
                                    {selectedPatient.bloodGroup || "-"}
                                </span>
                            </div>

                            <div className="emergency-section">
                                <h3>
                                    Emergency Contact
                                </h3>

                                <p>
                                    <strong>Name:</strong>{" "}
                                    {selectedPatient
                                        .emergencyContact?.name ||
                                        "-"}
                                </p>

                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {selectedPatient
                                        .emergencyContact?.phone ||
                                        "-"}
                                </p>

                                <p>
                                    <strong>Relation:</strong>{" "}
                                    {selectedPatient
                                        .emergencyContact?.relation ||
                                        "-"}
                                </p>
                            </div>
                        </div>

                        <div className="patient-modal-actions">
                            <button
                                className="delete-modal-btn"
                                onClick={() =>
                                    handleDelete(
                                        selectedPatient._id
                                    )
                                }
                            >
                                Delete Patient
                            </button>

                            <button
                                className="close-modal-btn"
                                onClick={() =>
                                    setSelectedPatient(null)
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

export default PatientManagement;