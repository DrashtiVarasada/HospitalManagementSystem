import { useEffect, useState } from "react";
import api from "../services/api";
import "./ReceptionistPatientManagement.css";

const emptyForm = {
    name: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    bloodGroup: "",
    emergencyContact: {
        name: "",
        phone: "",
        relation: ""
    }
};

const ReceptionistPatientManagement = () => {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [form, setForm] = useState(emptyForm);

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

    // HANDLE NORMAL INPUT
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // HANDLE EMERGENCY CONTACT
    const handleEmergencyChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            emergencyContact: {
                ...previous.emergencyContact,
                [name]: value
            }
        }));
    };

    // OPEN ADD FORM
    const handleAddPatient = () => {
        setEditingPatient(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    // OPEN EDIT FORM
    const handleEditPatient = (patient) => {
        setEditingPatient(patient);

        setForm({
            name: patient.name || "",
            dateOfBirth: patient.dateOfBirth
                ? patient.dateOfBirth.split("T")[0]
                : "",
            gender: patient.gender || "",
            phone: patient.phone || "",
            email: patient.email || "",
            address: patient.address || "",
            bloodGroup: patient.bloodGroup || "",
            emergencyContact: {
                name:
                    patient.emergencyContact?.name || "",
                phone:
                    patient.emergencyContact?.phone || "",
                relation:
                    patient.emergencyContact?.relation || ""
            }
        });

        setShowForm(true);
    };

    // SUBMIT FORM
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingPatient) {
                await api.put(
                    `/patients/${editingPatient._id}`,
                    form
                );

                alert("Patient updated successfully");
            } else {
                await api.post("/patients", form);

                alert("Patient added successfully");
            }

            setShowForm(false);
            setEditingPatient(null);
            setForm(emptyForm);

            fetchPatients();
        } catch (error) {
            console.error("Patient save error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to save patient"
            );
        }
    };

    // SEARCH
    const filteredPatients = patients.filter((patient) => {
        const searchText = search.toLowerCase();

        return (
            patient.name?.toLowerCase().includes(searchText) ||
            patient.phone?.toLowerCase().includes(searchText) ||
            patient.email?.toLowerCase().includes(searchText)
        );
    });

    return (
        <div className="receptionist-patient-management">

            {/* HEADER */}
            <div className="receptionist-patient-header">

                <div>
                    <h1>Patient Management</h1>
                    <p>
                        Register and manage hospital patients
                    </p>
                </div>

                <button
                    className="add-patient-btn"
                    onClick={handleAddPatient}
                >
                    + Add Patient
                </button>

            </div>

            {/* SEARCH */}
            <div className="receptionist-patient-search">

                <input
                    type="text"
                    placeholder="Search by name, phone or email..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />

            </div>

            {/* PATIENT TABLE */}
            {loading ? (
                <div className="receptionist-patient-message">
                    Loading patients...
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="receptionist-patient-message">
                    No patients found.
                </div>
            ) : (
                <div className="receptionist-patient-table-container">

                    <table className="receptionist-patient-table">

                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Date of Birth</th>
                                <th>Gender</th>
                                <th>Phone</th>
                                <th>Blood Group</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredPatients.map(
                                (patient) => (
                                    <tr key={patient._id}>

                                        <td>
                                            {patient.name}
                                        </td>

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
                                            {patient.bloodGroup ||
                                                "-"}
                                        </td>

                                        <td>

                                            <button
                                                className="receptionist-view-btn"
                                                onClick={() =>
                                                    setSelectedPatient(
                                                        patient
                                                    )
                                                }
                                            >
                                                View
                                            </button>

                                            <button
                                                className="receptionist-edit-btn"
                                                onClick={() =>
                                                    handleEditPatient(
                                                        patient
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                        </td>

                                    </tr>
                                )
                            )}

                        </tbody>

                    </table>

                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {showForm && (
                <div className="receptionist-modal-overlay">

                    <div className="receptionist-modal">

                        <div className="receptionist-modal-header">

                            <h2>
                                {editingPatient
                                    ? "Edit Patient"
                                    : "Add Patient"}
                            </h2>

                            <button
                                className="receptionist-close-btn"
                                onClick={() =>
                                    setShowForm(false)
                                }
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            {/* BASIC INFORMATION */}

                            <h3>Basic Information</h3>

                            <div className="patient-form-grid">

                                <div className="form-group">
                                    <label>
                                        Name *
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Date of Birth *
                                    </label>

                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={
                                            form.dateOfBirth
                                        }
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Gender *
                                    </label>

                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select Gender
                                        </option>

                                        <option value="male">
                                            Male
                                        </option>

                                        <option value="female">
                                            Female
                                        </option>

                                        <option value="other">
                                            Other
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Phone *
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Blood Group
                                    </label>

                                    <select
                                        name="bloodGroup"
                                        value={
                                            form.bloodGroup
                                        }
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Select Blood Group
                                        </option>

                                        <option value="A+">
                                            A+
                                        </option>

                                        <option value="A-">
                                            A-
                                        </option>

                                        <option value="B+">
                                            B+
                                        </option>

                                        <option value="B-">
                                            B-
                                        </option>

                                        <option value="AB+">
                                            AB+
                                        </option>

                                        <option value="AB-">
                                            AB-
                                        </option>

                                        <option value="O+">
                                            O+
                                        </option>

                                        <option value="O-">
                                            O-
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>
                                        Address
                                    </label>

                                    <textarea
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        rows="3"
                                    />
                                </div>

                            </div>

                            {/* EMERGENCY CONTACT */}

                            <h3>Emergency Contact</h3>

                            <div className="patient-form-grid">

                                <div className="form-group">
                                    <label>
                                        Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={
                                            form
                                                .emergencyContact
                                                .name
                                        }
                                        onChange={
                                            handleEmergencyChange
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Phone
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={
                                            form
                                                .emergencyContact
                                                .phone
                                        }
                                        onChange={
                                            handleEmergencyChange
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Relation
                                    </label>

                                    <input
                                        type="text"
                                        name="relation"
                                        value={
                                            form
                                                .emergencyContact
                                                .relation
                                        }
                                        onChange={
                                            handleEmergencyChange
                                        }
                                    />
                                </div>

                            </div>

                            {/* FORM BUTTONS */}

                            <div className="receptionist-form-actions">

                                <button
                                    type="button"
                                    className="cancel-patient-btn"
                                    onClick={() =>
                                        setShowForm(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="save-patient-btn"
                                >
                                    {editingPatient
                                        ? "Update Patient"
                                        : "Save Patient"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* VIEW PATIENT MODAL */}

            {selectedPatient && (
                <div className="receptionist-modal-overlay">

                    <div className="receptionist-view-modal">

                        <div className="receptionist-modal-header">

                            <h2>Patient Details</h2>

                            <button
                                className="receptionist-close-btn"
                                onClick={() =>
                                    setSelectedPatient(null)
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="patient-view-details">

                            <p>
                                <strong>Name:</strong>{" "}
                                {selectedPatient.name}
                            </p>

                            <p>
                                <strong>Date of Birth:</strong>{" "}
                                {new Date(
                                    selectedPatient.dateOfBirth
                                ).toLocaleDateString()}
                            </p>

                            <p>
                                <strong>Gender:</strong>{" "}
                                {selectedPatient.gender}
                            </p>

                            <p>
                                <strong>Phone:</strong>{" "}
                                {selectedPatient.phone}
                            </p>

                            <p>
                                <strong>Email:</strong>{" "}
                                {selectedPatient.email || "-"}
                            </p>

                            <p>
                                <strong>Address:</strong>{" "}
                                {selectedPatient.address || "-"}
                            </p>

                            <p>
                                <strong>Blood Group:</strong>{" "}
                                {selectedPatient.bloodGroup ||
                                    "-"}
                            </p>

                            <h3>Emergency Contact</h3>

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

                        <div className="receptionist-form-actions">

                            <button
                                className="cancel-patient-btn"
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

export default ReceptionistPatientManagement;