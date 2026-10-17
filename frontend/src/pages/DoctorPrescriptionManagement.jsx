import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./DoctorPrescriptionManagement.css";

const emptyMedicine = () => ({
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
});

const DoctorPrescriptionManagement = () => {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDoctorOnly, setFilterDoctorOnly] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [editingPrescriptionId, setEditingPrescriptionId] = useState(null);

    const [formData, setFormData] = useState({
        medicalRecord: "",
        visitId: "",
        patient: "",
        medicines: [emptyMedicine()],
        additionalInstructions: ""
    });

    const getId = (value) => {
        if (!value) return "";
        if (typeof value === "object") return value._id || "";
        return String(value);
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatDateTime = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const fetchDoctor = async () => {
        try {
            const response = await api.get("/doctors/me");
            setDoctor(response.data.doctor);
            return response.data.doctor;
        } catch (err) {
            console.error("Failed to fetch doctor profile", err);
            return null;
        }
    };

    const fetchMedicalRecords = async () => {
        try {
            const response = await api.get("/medical-records");
            const records = response.data.records || [];
            setMedicalRecords(records);
            return records;
        } catch (err) {
            console.error("Failed to fetch medical records", err);
            return [];
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const response = await api.get("/prescriptions");
            const data = response.data.prescriptions || [];
            setPrescriptions(data);
            return data;
        } catch (err) {
            console.error("Failed to fetch prescriptions", err);
            return [];
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchDoctor(),
                fetchMedicalRecords(),
                fetchPrescriptions()
            ]);
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message || "Failed to load prescription data"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const availableVisits = useMemo(() => {
        const visits = [];
        medicalRecords.forEach((record) => {
            (record.visits || []).forEach((visit) => {
                visits.push({
                    recordId: record._id,
                    visitId: visit._id,
                    patient: record.patient,
                    doctor: visit.doctor || record.doctor,
                    appointment: visit.appointment,
                    symptoms: visit.symptoms,
                    diagnosis: visit.diagnosis,
                    examination: visit.examination,
                    treatment: visit.treatment,
                    notes: visit.notes,
                    visitDate: visit.visitDate
                });
            });
        });
        return visits;
    }, [medicalRecords]);

    const getPrescriptionVisit = (prescription) => {
        if (!prescription) return null;
        const record = prescription.medicalRecord;
        if (!record || !record.visits) return null;
        if (!prescription.visitId) return null;
        return (
            record.visits.find(
                (visit) => getId(visit._id) === getId(prescription.visitId)
            ) || null
        );
    };

    const filteredPrescriptions = useMemo(() => {
        let list = prescriptions;

        if (filterDoctorOnly && doctor) {
            list = list.filter(
                (p) => getId(p.doctor) === getId(doctor._id)
            );
        }

        const search = searchTerm.toLowerCase().trim();
        if (!search) {
            return list;
        }

        return list.filter((prescription) => {
            const patientName = prescription.patient?.name?.toLowerCase() || "";
            const patientPhone = prescription.patient?.phone?.toLowerCase() || "";
            const visit = getPrescriptionVisit(prescription);
            const diagnosis = visit?.diagnosis?.toLowerCase() || "";
            const symptoms = visit?.symptoms?.toLowerCase() || "";
            const treatment = visit?.treatment?.toLowerCase() || "";
            const additionalInstructions =
                prescription.additionalInstructions?.toLowerCase() || "";
            const medicineNames =
                prescription.medicines
                    ?.map((m) => m.medicineName?.toLowerCase() || "")
                    .join(" ") || "";

            return (
                patientName.includes(search) ||
                patientPhone.includes(search) ||
                diagnosis.includes(search) ||
                symptoms.includes(search) ||
                treatment.includes(search) ||
                additionalInstructions.includes(search) ||
                medicineNames.includes(search)
            );
        });
    }, [prescriptions, doctor, filterDoctorOnly, searchTerm]);

    const resetForm = () => {
        setFormData({
            medicalRecord: "",
            visitId: "",
            patient: "",
            medicines: [emptyMedicine()],
            additionalInstructions: ""
        });
        setSelectedPatient(null);
        setEditingPrescriptionId(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        if (name === "visitId") {
            const selectedVisit = availableVisits.find(
                (visit) => getId(visit.visitId) === value
            );

            if (selectedVisit) {
                setFormData((prev) => ({
                    ...prev,
                    visitId: value,
                    medicalRecord: selectedVisit.recordId,
                    patient: getId(selectedVisit.patient)
                }));
                setSelectedPatient(selectedVisit.patient || null);
            } else {
                setFormData((prev) => ({
                    ...prev,
                    visitId: value,
                    medicalRecord: "",
                    patient: ""
                }));
                setSelectedPatient(null);
            }
        }
    };

    const handleMedicineChange = (index, field, value) => {
        setFormData((prev) => {
            const medicines = [...prev.medicines];
            medicines[index] = {
                ...medicines[index],
                [field]: value
            };
            return {
                ...prev,
                medicines
            };
        });
    };

    const addMedicine = () => {
        setFormData((prev) => ({
            ...prev,
            medicines: [...prev.medicines, emptyMedicine()]
        }));
    };

    const removeMedicine = (index) => {
        if (formData.medicines.length === 1) return;
        setFormData((prev) => ({
            ...prev,
            medicines: prev.medicines.filter((_, i) => i !== index)
        }));
    };

    const openCreateForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (prescription) => {
        setEditingPrescriptionId(prescription._id);
        setFormData({
            medicalRecord: getId(prescription.medicalRecord),
            visitId: getId(prescription.visitId),
            patient: getId(prescription.patient),
            medicines:
                prescription.medicines?.length > 0
                    ? prescription.medicines.map((m) => ({
                          medicineName: m.medicineName || "",
                          dosage: m.dosage || "",
                          frequency: m.frequency || "",
                          duration: m.duration || "",
                          instructions: m.instructions || ""
                      }))
                    : [emptyMedicine()],
            additionalInstructions: prescription.additionalInstructions || ""
        });
        setSelectedPatient(prescription.patient || null);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (!doctor) {
                alert("Doctor profile not found. Please log in as a doctor.");
                return;
            }

            for (let i = 0; i < formData.medicines.length; i++) {
                const m = formData.medicines[i];
                if (
                    !m.medicineName.trim() ||
                    !m.dosage.trim() ||
                    !m.frequency.trim() ||
                    !m.duration.trim()
                ) {
                    alert(
                        `Please complete Medicine Name, Dosage, Frequency, and Duration for medicine #${i + 1}`
                    );
                    return;
                }
            }

            if (editingPrescriptionId) {
                await api.put(`/prescriptions/${editingPrescriptionId}`, {
                    medicines: formData.medicines,
                    additionalInstructions: formData.additionalInstructions
                });
                alert("Prescription updated successfully");
            } else {
                if (!formData.visitId) {
                    alert("Please select a medical visit");
                    return;
                }
                if (!formData.medicalRecord || !formData.patient) {
                    alert("Medical record and patient must be associated with the selected visit");
                    return;
                }

                await api.post("/prescriptions", {
                    patient: formData.patient,
                    doctor: doctor._id,
                    medicalRecord: formData.medicalRecord,
                    visitId: formData.visitId,
                    medicines: formData.medicines,
                    additionalInstructions: formData.additionalInstructions
                });
                alert("Prescription created successfully");
            }

            setShowForm(false);
            resetForm();
            await fetchPrescriptions();
        } catch (error) {
            console.error("Prescription save error:", error);
            alert(
                error.response?.data?.message || "Failed to save prescription"
            );
        }
    };

    const handleViewPrescription = (prescription) => {
        if (!prescription) return;
        setSelectedPrescription(prescription);
        setShowDetails(true);
    };

    const handleDelete = async (prescriptionId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this prescription? This action cannot be undone."
        );
        if (!confirmed) return;

        try {
            await api.delete(`/prescriptions/${prescriptionId}`);
            alert("Prescription deleted successfully");
            await fetchPrescriptions();
        } catch (error) {
            console.error("Delete prescription error:", error);
            alert(
                error.response?.data?.message || "Failed to delete prescription"
            );
        }
    };

    const closeFormModal = () => {
        setShowForm(false);
        resetForm();
    };

    const closeDetailsModal = () => {
        setShowDetails(false);
        setSelectedPrescription(null);
    };

    if (loading) {
        return (
            <div className="manager-dashboard">
                <div className="dashboard-loading">Loading prescriptions...</div>
            </div>
        );
    }

    return (
        <div className="manager-dashboard">
            {/* Header matching Manager pages */}
            <div className="page-header-row">
                <div>
                    <h2>Prescription Management</h2>
                    <p>Create and manage patient prescriptions linked to medical visits.</p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate("/doctor/medical-records")}
                    >
                        Medical Records
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={openCreateForm}
                    >
                        + Create Prescription
                    </button>
                </div>
            </div>

            {/* Prescriptions List Card */}
            <div className="dashboard-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: "17px", color: "#1e293b" }}>Prescriptions List</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                            {filteredPrescriptions.length}{" "}
                            {filteredPrescriptions.length === 1 ? "prescription" : "prescriptions"} found
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            style={{
                                background: filterDoctorOnly ? "#eff6ff" : "#f8fafc",
                                color: filterDoctorOnly ? "#2563eb" : "#475569",
                                borderColor: filterDoctorOnly ? "#bfdbfe" : "#cbd5e1"
                            }}
                            onClick={() => setFilterDoctorOnly(!filterDoctorOnly)}
                        >
                            {filterDoctorOnly ? "Showing My Prescriptions" : "Showing All Prescriptions"}
                        </button>
                        <button
                            type="button"
                            className="btn-refresh"
                            onClick={loadData}
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: "18px" }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by patient name, diagnosis, medicine, or instructions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: "500px" }}
                    />
                </div>

                {/* Prescriptions Table */}
                {filteredPrescriptions.length === 0 ? (
                    <p style={{ color: "#64748b", margin: "25px 0" }}>No prescriptions found.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="doctor-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Visit Date</th>
                                    <th>Prescription Date</th>
                                    <th>Medicines</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrescriptions.map((prescription) => {
                                    const visit = getPrescriptionVisit(prescription);
                                    const visitDate = visit?.visitDate
                                        ? formatDate(visit.visitDate)
                                        : "-";
                                    const rxDate = formatDate(prescription.prescriptionDate);

                                    return (
                                        <tr key={prescription._id}>
                                            <td>
                                                <strong>{prescription.patient?.name || "Unknown Patient"}</strong>
                                                <small>{prescription.patient?.phone || "No phone"}</small>
                                            </td>

                                            <td>
                                                <strong style={{ color: "#334155" }}>{visitDate}</strong>
                                                {visit?.diagnosis && (
                                                    <small style={{ color: "#2563eb" }}>
                                                        {visit.diagnosis}
                                                    </small>
                                                )}
                                            </td>

                                            <td>
                                                <span>{rxDate}</span>
                                            </td>

                                            <td>
                                                <span className="badge-purple">
                                                    {prescription.medicines?.length || 0} medicine(s)
                                                </span>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#64748b",
                                                        maxWidth: "240px",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        marginTop: "4px"
                                                    }}
                                                    title={prescription.medicines?.map((m) => m.medicineName).join(", ")}
                                                >
                                                    {prescription.medicines?.map((m) => m.medicineName).join(", ")}
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        type="button"
                                                        className="btn-action-view"
                                                        onClick={() => handleViewPrescription(prescription)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-action-edit"
                                                        onClick={() => openEditForm(prescription)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-action-delete"
                                                        onClick={() => handleDelete(prescription._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {showForm && (
                <div className="modal-overlay" onClick={closeFormModal}>
                    <div className="modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>
                                    {editingPrescriptionId
                                        ? "Edit Prescription"
                                        : "Create Prescription"}
                                </h3>
                                <p>
                                    {editingPrescriptionId
                                        ? "Update prescribed medicines and instructions"
                                        : "Assign medicines to a specific patient medical visit"}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeFormModal}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {!editingPrescriptionId && (
                                <div className="form-group">
                                    <label>Medical Visit *</label>
                                    <select
                                        name="visitId"
                                        value={formData.visitId}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Select Medical Visit</option>
                                        {availableVisits.map((visit) => (
                                            <option key={visit.visitId} value={visit.visitId}>
                                                {visit.patient?.name || "Patient"} - {visit.diagnosis || "Visit"} ({formatDate(visit.visitDate)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.visitId && (
                                <div className="form-group">
                                    <label>Selected Visit Summary</label>
                                    {(() => {
                                        const visit = availableVisits.find(
                                            (item) => getId(item.visitId) === formData.visitId
                                        );
                                        if (!visit) return null;
                                        return (
                                            <div
                                                style={{
                                                    padding: "10px 14px",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "6px",
                                                    background: "#f8fafc",
                                                    fontSize: "13px"
                                                }}
                                            >
                                                <div><strong>Diagnosis:</strong> {visit.diagnosis || "-"}</div>
                                                <div><strong>Symptoms:</strong> {visit.symptoms || "-"}</div>
                                                <div><strong>Visit Date:</strong> {formatDate(visit.visitDate)}</div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Patient</label>
                                <input
                                    type="text"
                                    value={selectedPatient?.name || (formData.patient ? "Selected Patient" : "")}
                                    placeholder="Patient will be resolved from the medical visit"
                                    readOnly
                                    style={{ background: "#f8fafc" }}
                                />
                            </div>

                            <div style={{ marginTop: "10px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <h4 style={{ margin: 0, color: "#1e293b" }}>Medicines List</h4>
                                    <button
                                        type="button"
                                        className="btn-add-item"
                                        onClick={addMedicine}
                                    >
                                        + Add Medicine
                                    </button>
                                </div>

                                {formData.medicines.map((medicine, index) => (
                                    <div className="medicine-card-box" key={index}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                            <strong style={{ fontSize: "13px", color: "#334155" }}>Medicine #{index + 1}</strong>
                                            {formData.medicines.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove-item"
                                                    onClick={() => removeMedicine(index)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="form-grid-4">
                                            <div className="form-group">
                                                <label>Medicine Name *</label>
                                                <input
                                                    type="text"
                                                    value={medicine.medicineName}
                                                    onChange={(e) =>
                                                        handleMedicineChange(index, "medicineName", e.target.value)
                                                    }
                                                    placeholder="e.g. Paracetamol"
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Dosage *</label>
                                                <input
                                                    type="text"
                                                    value={medicine.dosage}
                                                    onChange={(e) =>
                                                        handleMedicineChange(index, "dosage", e.target.value)
                                                    }
                                                    placeholder="e.g. 500 mg"
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Frequency *</label>
                                                <input
                                                    type="text"
                                                    value={medicine.frequency}
                                                    onChange={(e) =>
                                                        handleMedicineChange(index, "frequency", e.target.value)
                                                    }
                                                    placeholder="e.g. Twice daily"
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Duration *</label>
                                                <input
                                                    type="text"
                                                    value={medicine.duration}
                                                    onChange={(e) =>
                                                        handleMedicineChange(index, "duration", e.target.value)
                                                    }
                                                    placeholder="e.g. 5 days"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ marginTop: "8px" }}>
                                            <label>Instructions</label>
                                            <input
                                                type="text"
                                                value={medicine.instructions}
                                                onChange={(e) =>
                                                    handleMedicineChange(index, "instructions", e.target.value)
                                                }
                                                placeholder="e.g. Take after meals with warm water"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="form-group" style={{ marginTop: "14px" }}>
                                <label>Additional Instructions</label>
                                <textarea
                                    name="additionalInstructions"
                                    value={formData.additionalInstructions}
                                    onChange={handleFormChange}
                                    rows="2"
                                    placeholder="Additional advice, precaution, or diet suggestions"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-modal-cancel"
                                    onClick={closeFormModal}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-modal-submit">
                                    {editingPrescriptionId
                                        ? "Update Prescription"
                                        : "Save Prescription"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW PRESCRIPTION DETAILS MODAL */}
            {showDetails && selectedPrescription && (
                <div className="modal-overlay" onClick={closeDetailsModal}>
                    <div className="modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>Prescription Details</h3>
                                <p>Comprehensive prescription view</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeDetailsModal}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body-scroll">
                            {/* Patient Info Card */}
                            <div className="view-card-section" style={{ marginBottom: "14px" }}>
                                <h4 style={{ margin: "0 0 10px", color: "#1e293b" }}>Patient Information</h4>
                                <div className="info-grid-4">
                                    <div><span>Name:</span> <strong>{selectedPrescription.patient?.name || "-"}</strong></div>
                                    <div><span>Phone:</span> <strong>{selectedPrescription.patient?.phone || "-"}</strong></div>
                                    <div><span>Blood Group:</span> <strong>{selectedPrescription.patient?.bloodGroup || "-"}</strong></div>
                                    <div><span>Email:</span> <strong>{selectedPrescription.patient?.email || "-"}</strong></div>
                                </div>
                            </div>

                            {/* Attending Doctor */}
                            <div className="view-card-section" style={{ marginBottom: "14px" }}>
                                <h4 style={{ margin: "0 0 10px", color: "#1e293b" }}>Attending Doctor</h4>
                                <div className="info-grid-3">
                                    <div><span>Doctor:</span> <strong>Dr. {selectedPrescription.doctor?.name || "Doctor"}</strong></div>
                                    <div><span>Specialization:</span> <strong>{selectedPrescription.doctor?.specialization || "-"}</strong></div>
                                    <div><span>Qualification:</span> <strong>{selectedPrescription.doctor?.qualification || "-"}</strong></div>
                                </div>
                            </div>

                            {/* Medical Visit Details */}
                            <div className="view-card-section" style={{ marginBottom: "14px" }}>
                                <h4 style={{ margin: "0 0 10px", color: "#1e293b" }}>Medical Visit Details</h4>
                                {(() => {
                                    const visit = getPrescriptionVisit(selectedPrescription);
                                    return (
                                        <div className="info-grid-4">
                                            <div><span>Diagnosis:</span> <strong style={{ color: "#2563eb" }}>{visit?.diagnosis || "-"}</strong></div>
                                            <div><span>Symptoms:</span> <p>{visit?.symptoms || "-"}</p></div>
                                            <div><span>Visit Date:</span> <p>{formatDate(visit?.visitDate)}</p></div>
                                            <div><span>Prescription Date:</span> <p>{formatDate(selectedPrescription.prescriptionDate)}</p></div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Prescribed Medicines */}
                            <div style={{ marginBottom: "14px" }}>
                                <h4 style={{ margin: "0 0 10px", color: "#1e293b" }}>Prescribed Medicines</h4>
                                <table className="doctor-table" style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                                    <thead>
                                        <tr>
                                            <th>Medicine</th>
                                            <th>Dosage</th>
                                            <th>Frequency</th>
                                            <th>Duration</th>
                                            <th>Instructions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPrescription.medicines?.map((med, index) => (
                                            <tr key={index}>
                                                <td><strong>{med.medicineName}</strong></td>
                                                <td>{med.dosage}</td>
                                                <td><span className="badge-blue">{med.frequency}</span></td>
                                                <td>{med.duration}</td>
                                                <td>{med.instructions || "As advised"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Additional Instructions */}
                            {selectedPrescription.additionalInstructions && (
                                <div className="view-card-section">
                                    <h4 style={{ margin: "0 0 6px", color: "#1e293b" }}>Additional Instructions</h4>
                                    <p style={{ margin: 0, color: "#334155", fontSize: "13px" }}>
                                        {selectedPrescription.additionalInstructions}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions" style={{ borderTop: "1px solid #e2e8f0", marginTop: "16px", paddingTop: "14px" }}>
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={closeDetailsModal}
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

export default DoctorPrescriptionManagement;
