import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./DoctorMedicalRecordManagement.css";

const emptyMedicine = () => ({
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
});

const DoctorMedicalRecordManagement = () => {
    const navigate = useNavigate();

    // Data states
    const [doctor, setDoctor] = useState(null);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Patient Search & Record Checker
    const [searchPatientName, setSearchPatientName] = useState("");
    const [searchedPatient, setSearchedPatient] = useState(null);
    const [patientRecordStatus, setPatientRecordStatus] = useState(null); // 'found' | 'not_found' | 'searched_not_found' | null
    const [existingRecord, setExistingRecord] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");

    // Records table filter
    const [tableSearchTerm, setTableSearchTerm] = useState("");

    // Modals
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

    // Selected visit for view / edit
    const [selectedRecordForView, setSelectedRecordForView] = useState(null);
    const [selectedVisitForView, setSelectedVisitForView] = useState(null);

    // Visit Form state (used for Create First Record, Add Visit, or Edit Visit)
    const [isEditingVisit, setIsEditingVisit] = useState(false);
    const [targetRecordId, setTargetRecordId] = useState(null);
    const [targetVisitId, setTargetVisitId] = useState(null);
    const [targetPatient, setTargetPatient] = useState(null);
    const [visitFormData, setVisitFormData] = useState({
        appointment: "",
        symptoms: "",
        diagnosis: "",
        examination: "",
        treatment: "",
        notes: ""
    });
    const [submittingVisit, setSubmittingVisit] = useState(false);

    // Prescription Form state
    const [prescriptionTarget, setPrescriptionTarget] = useState({
        patient: null,
        record: null,
        visit: null
    });
    const [prescriptionFormData, setPrescriptionFormData] = useState({
        medicines: [emptyMedicine()],
        additionalInstructions: ""
    });
    const [submittingPrescription, setSubmittingPrescription] = useState(false);

    const getId = (val) => {
        if (!val) return "";
        if (typeof val === "object") return val._id || "";
        return String(val);
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

    // Load initial data
    const loadAllData = async () => {
        try {
            setLoading(true);
            const [docRes, patRes, appRes, recRes, presRes] = await Promise.all([
                api.get("/doctors/me"),
                api.get("/patients"),
                api.get("/appointments"),
                api.get("/medical-records"),
                api.get("/prescriptions")
            ]);

            setDoctor(docRes.data.doctor);
            setPatients(patRes.data.patients || []);
            setAppointments(appRes.data.appointments || []);
            setRecords(recRes.data.records || []);
            setPrescriptions(presRes.data.prescriptions || []);
        } catch (error) {
            console.error("Medical records data load error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // Doctor's available appointments
    const doctorAppointments = useMemo(() => {
        if (!doctor) return [];
        return appointments.filter(
            (a) => getId(a.doctor) === getId(doctor._id) && a.status !== "cancelled"
        );
    }, [appointments, doctor]);

    // Filter medical records for table
    const filteredRecords = useMemo(() => {
        const query = tableSearchTerm.trim().toLowerCase();
        if (!query) return records;

        return records.filter((rec) => {
            const patName = rec.patient?.name?.toLowerCase() || "";
            const patPhone = rec.patient?.phone?.toLowerCase() || "";
            const docName = rec.doctor?.name?.toLowerCase() || "";
            const latestVisit = rec.visits?.[rec.visits.length - 1];
            const diagnosis = latestVisit?.diagnosis?.toLowerCase() || "";
            const symptoms = latestVisit?.symptoms?.toLowerCase() || "";

            return (
                patName.includes(query) ||
                patPhone.includes(query) ||
                docName.includes(query) ||
                diagnosis.includes(query) ||
                symptoms.includes(query)
            );
        });
    }, [records, tableSearchTerm]);

    // =========================================================================
    // SEARCH PATIENT FLOW
    // =========================================================================
    const handleSearchPatient = async (patientArg) => {
        setSearchError("");
        let queryName = searchPatientName.trim();
        let targetPat = patientArg;

        if (!targetPat) {
            if (!queryName) {
                setSearchError("Please enter a patient name to search.");
                return;
            }

            try {
                setSearching(true);
                const searchRes = await api.get(`/patients?search=${encodeURIComponent(queryName)}`);
                const foundList = searchRes.data.patients || [];

                if (foundList.length === 0) {
                    setSearchedPatient(null);
                    setExistingRecord(null);
                    setPatientRecordStatus("searched_not_found");
                    setSearching(false);
                    return;
                }

                targetPat = foundList[0];
            } catch (err) {
                console.error("Patient search error:", err);
                setSearchError("Failed to search patient. Please try again.");
                setSearching(false);
                return;
            }
        }

        setSearchedPatient(targetPat);
        setSearchPatientName(targetPat.name);

        try {
            setSearching(true);
            const histRes = await api.get(`/medical-records/patient/${targetPat._id}`);
            const data = histRes.data;

            if (data.medicalRecord && (data.medicalRecord.visits?.length > 0 || data.totalVisits > 0)) {
                setPatientRecordStatus("found");
                setExistingRecord(data.medicalRecord);
            } else {
                setPatientRecordStatus("not_found");
                setExistingRecord(null);
            }
        } catch (error) {
            console.error("History fetch error:", error);
            setPatientRecordStatus("not_found");
            setExistingRecord(null);
        } finally {
            setSearching(false);
        }
    };

    const clearPatientSearch = () => {
        setSearchPatientName("");
        setSearchedPatient(null);
        setPatientRecordStatus(null);
        setExistingRecord(null);
        setSearchError("");
    };

    // =========================================================================
    // MODAL OPENERS
    // =========================================================================
    const openAddVisitModal = (patient, record) => {
        setIsEditingVisit(false);
        setTargetPatient(patient);
        setTargetRecordId(record ? record._id : null);
        setTargetVisitId(null);

        const patAppt = doctorAppointments.find(
            (a) => getId(a.patient) === getId(patient?._id)
        );

        setVisitFormData({
            appointment: patAppt ? getId(patAppt._id) : "",
            symptoms: "",
            diagnosis: "",
            examination: "",
            treatment: "",
            notes: ""
        });

        setShowVisitModal(true);
    };

    const openEditVisitModal = (record, visit, patient) => {
        setIsEditingVisit(true);
        setTargetPatient(patient || record.patient);
        setTargetRecordId(record._id);
        setTargetVisitId(visit._id);

        setVisitFormData({
            appointment: getId(visit.appointment) || "",
            symptoms: visit.symptoms || "",
            diagnosis: visit.diagnosis || "",
            examination: visit.examination || "",
            treatment: visit.treatment || "",
            notes: visit.notes || ""
        });

        setShowVisitModal(true);
    };

    const openViewModal = async (record, visit) => {
        try {
            const res = await api.get(`/medical-records/${record._id}`);
            const freshRecord = res.data.medicalRecord || record;
            setSelectedRecordForView(freshRecord);
            const freshVisit = freshRecord.visits?.find((v) => v._id === visit._id) || freshRecord.visits?.[0];
            setSelectedVisitForView(freshVisit || visit);
            setShowViewModal(true);
        } catch (err) {
            console.error("View modal fetch error:", err);
            setSelectedRecordForView(record);
            setSelectedVisitForView(visit);
            setShowViewModal(true);
        }
    };

    const openAddPrescriptionModal = (patient, record, visit) => {
        setPrescriptionTarget({
            patient,
            record,
            visit
        });

        setPrescriptionFormData({
            medicines: [emptyMedicine()],
            additionalInstructions: ""
        });

        setShowPrescriptionModal(true);
    };

    // =========================================================================
    // VISIT FORM SUBMIT (Create Medical Record / Add Visit / Edit Visit)
    // =========================================================================
    const handleVisitFormSubmit = async (e) => {
        e.preventDefault();

        if (!doctor) {
            alert("Doctor profile could not be loaded.");
            return;
        }

        if (!visitFormData.symptoms.trim()) {
            alert("Symptoms field is required.");
            return;
        }

        if (!visitFormData.diagnosis.trim()) {
            alert("Diagnosis field is required.");
            return;
        }

        try {
            setSubmittingVisit(true);

            if (isEditingVisit && targetRecordId && targetVisitId) {
                const updateRes = await api.put(`/medical-records/${targetRecordId}`, {
                    visitId: targetVisitId,
                    symptoms: visitFormData.symptoms.trim(),
                    diagnosis: visitFormData.diagnosis.trim(),
                    examination: visitFormData.examination.trim(),
                    treatment: visitFormData.treatment.trim(),
                    notes: visitFormData.notes.trim()
                });

                alert("Medical visit updated successfully.");
                setShowVisitModal(false);

                await loadAllData();

                if (selectedRecordForView && selectedRecordForView._id === targetRecordId) {
                    const refreshed = updateRes.data.medicalRecord;
                    setSelectedRecordForView(refreshed);
                    const updatedVisit = refreshed.visits?.find((v) => v._id === targetVisitId);
                    setSelectedVisitForView(updatedVisit || refreshed.visits?.[0]);
                }

                if (searchedPatient) {
                    await handleSearchPatient(searchedPatient);
                }
            } else {
                const postRes = await api.post("/medical-records", {
                    patient: getId(targetPatient._id),
                    doctor: doctor._id,
                    appointment: visitFormData.appointment || undefined,
                    symptoms: visitFormData.symptoms.trim(),
                    diagnosis: visitFormData.diagnosis.trim(),
                    examination: visitFormData.examination.trim(),
                    treatment: visitFormData.treatment.trim(),
                    notes: visitFormData.notes.trim()
                });

                const createdRecord = postRes.data.medicalRecord;
                const createdVisitId = postRes.data.createdVisitId;

                alert(postRes.data.message || "Medical visit recorded successfully.");
                setShowVisitModal(false);

                await loadAllData();

                if (targetPatient) {
                    await handleSearchPatient(targetPatient);
                }

                const wantPrescription = window.confirm(
                    "Medical visit recorded successfully! Would you like to add a Prescription for this visit now?"
                );

                if (wantPrescription && createdRecord) {
                    const createdVisit =
                        createdRecord.visits?.find((v) => getId(v._id) === getId(createdVisitId)) ||
                        createdRecord.visits?.[createdRecord.visits.length - 1];

                    openAddPrescriptionModal(targetPatient, createdRecord, createdVisit);
                }
            }
        } catch (error) {
            console.error("Visit form submit error:", error);
            alert(error.response?.data?.message || "Failed to save medical visit.");
        } finally {
            setSubmittingVisit(false);
        }
    };

    // =========================================================================
    // DELETE VISIT
    // =========================================================================
    const handleDeleteVisit = async (recordId, visitId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this medical visit? All associated prescriptions will also be removed safely."
        );

        if (!confirmed) return;

        try {
            await api.delete(`/medical-records/${recordId}`, {
                data: { visitId }
            });

            alert("Medical visit and associated prescriptions deleted successfully.");

            if (showViewModal && selectedVisitForView?._id === visitId) {
                setShowViewModal(false);
            }

            await loadAllData();

            if (searchedPatient) {
                await handleSearchPatient(searchedPatient);
            }
        } catch (error) {
            console.error("Delete visit error:", error);
            alert(error.response?.data?.message || "Failed to delete medical visit.");
        }
    };

    // =========================================================================
    // PRESCRIPTION HANDLERS
    // =========================================================================
    const handleMedicineFieldChange = (index, field, value) => {
        setPrescriptionFormData((prev) => {
            const list = [...prev.medicines];
            list[index] = { ...list[index], [field]: value };
            return { ...prev, medicines: list };
        });
    };

    const handleAddMedicineRow = () => {
        setPrescriptionFormData((prev) => ({
            ...prev,
            medicines: [...prev.medicines, emptyMedicine()]
        }));
    };

    const handleRemoveMedicineRow = (index) => {
        if (prescriptionFormData.medicines.length === 1) return;
        setPrescriptionFormData((prev) => ({
            ...prev,
            medicines: prev.medicines.filter((_, i) => i !== index)
        }));
    };

    const handlePrescriptionSubmit = async (e) => {
        e.preventDefault();

        if (!doctor) {
            alert("Doctor profile missing.");
            return;
        }

        const { patient, record, visit } = prescriptionTarget;
        if (!patient || !record || !visit) {
            alert("Missing required visit references for this prescription.");
            return;
        }

        for (let i = 0; i < prescriptionFormData.medicines.length; i++) {
            const m = prescriptionFormData.medicines[i];
            if (!m.medicineName.trim() || !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim()) {
                alert(`Please fill medicine name, dosage, frequency, and duration for medicine #${i + 1}.`);
                return;
            }
        }

        try {
            setSubmittingPrescription(true);

            await api.post("/prescriptions", {
                patient: getId(patient._id || patient),
                doctor: doctor._id,
                medicalRecord: getId(record._id || record),
                visitId: getId(visit._id || visit),
                medicines: prescriptionFormData.medicines,
                additionalInstructions: prescriptionFormData.additionalInstructions
            });

            alert("Prescription added successfully to this visit!");
            setShowPrescriptionModal(false);

            await loadAllData();

            if (searchedPatient) {
                await handleSearchPatient(searchedPatient);
            }

            if (selectedRecordForView) {
                const refreshed = await api.get(`/medical-records/${selectedRecordForView._id}`);
                setSelectedRecordForView(refreshed.data.medicalRecord);
            }
        } catch (error) {
            console.error("Prescription submit error:", error);
            alert(error.response?.data?.message || "Failed to create prescription.");
        } finally {
            setSubmittingPrescription(false);
        }
    };

    const getLatestVisit = (record) => {
        if (!record?.visits?.length) return null;
        return record.visits[record.visits.length - 1];
    };

    if (loading) {
        return (
            <div className="manager-dashboard">
                <div className="dashboard-loading">Loading medical records...</div>
            </div>
        );
    }

    return (
        <div className="manager-dashboard">
            {/* Header matching Manager pages */}
            <div className="page-header-row">
                <div>
                    <h2>Medical Record Management</h2>
                    <p>Search patients, review consultation history, and manage medical records.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate("/doctor/prescriptions")}
                    >
                        Prescriptions
                    </button>
                    {searchedPatient && (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => openAddVisitModal(searchedPatient, existingRecord)}
                        >
                            + Add Visit
                        </button>
                    )}
                </div>
            </div>

            {/* SECTION 1: SEARCH PATIENT & CHECK RECORD */}
            <div className="dashboard-card" style={{ marginBottom: "25px" }}>
                <div style={{ marginBottom: "16px" }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: "17px", color: "#1e293b" }}>Search Patient & Check Record</h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                        Enter patient name to inspect medical history or add a new consultation visit
                    </p>
                </div>

                <div className="search-bar-row">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search patient by name..."
                        value={searchPatientName}
                        onChange={(e) => setSearchPatientName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchPatient()}
                    />
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleSearchPatient()}
                        disabled={searching}
                    >
                        {searching ? "Searching..." : "Search"}
                    </button>
                    {searchedPatient && (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={clearPatientSearch}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {searchError && (
                    <div style={{ color: "#dc2626", fontSize: "13px", marginTop: "8px" }}>
                        {searchError}
                    </div>
                )}

                {/* Patient Not Found Notice */}
                {patientRecordStatus === "searched_not_found" && (
                    <div className="notice-box notice-warning" style={{ marginTop: "16px" }}>
                        <strong style={{ display: "block", marginBottom: "4px" }}>Patient Not Found</strong>
                        <p style={{ margin: 0 }}>
                            No registered patient found matching &ldquo;{searchPatientName}&rdquo;. Please verify the name or register the patient first.
                        </p>
                    </div>
                )}

                {/* Patient Found Results */}
                {searchedPatient && patientRecordStatus !== "searched_not_found" && (
                    <div className="patient-result-container" style={{ marginTop: "20px" }}>
                        {/* Patient Info Strip */}
                        <div className="patient-info-strip">
                            <h4 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1e293b" }}>
                                {searchedPatient.name}
                            </h4>
                            <div className="patient-meta-tags">
                                <span>Phone: <strong>{searchedPatient.phone || "No phone"}</strong></span>
                                <span>Blood Group: <strong>{searchedPatient.bloodGroup || "Unknown"}</strong></span>
                                <span>Gender: <strong>{searchedPatient.gender || "N/A"}</strong></span>
                                <span>DOB: <strong>{formatDate(searchedPatient.dateOfBirth)}</strong></span>
                                <span>Email: <strong>{searchedPatient.email || "N/A"}</strong></span>
                            </div>
                        </div>

                        {/* CASE 1: Patient Has Existing Record (Soft Green Box) */}
                        {patientRecordStatus === "found" && existingRecord && (
                            <div className="notice-box notice-success" style={{ marginTop: "14px" }}>
                                <div className="notice-header">
                                    <span className="pill-badge pill-green">Existing Medical Record Found</span>
                                    <span className="visits-tag">
                                        {existingRecord.visits?.length || 0} Total Consultation Visit(s)
                                    </span>
                                </div>

                                <h4 style={{ margin: "16px 0 10px", fontSize: "14px", color: "#166534" }}>Previous Visits & Consultations</h4>

                                <div className="table-responsive" style={{ background: "white", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                    <table className="doctor-table">
                                        <thead>
                                            <tr>
                                                <th>Visit Date</th>
                                                <th>Diagnosis</th>
                                                <th>Symptoms</th>
                                                <th>Treatment</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(existingRecord.visits || []).map((visit, vIdx) => {
                                                const visitPrescriptions = visit.prescriptions || (visit.prescription ? [visit.prescription] : []);
                                                const hasPrescription = visitPrescriptions.length > 0;

                                                return (
                                                    <tr key={visit._id || vIdx}>
                                                        <td>
                                                            <strong>{formatDate(visit.visitDate)}</strong>
                                                            {visit.appointment?.appointmentTime && (
                                                                <small>{visit.appointment.appointmentTime}</small>
                                                            )}
                                                        </td>
                                                        <td><span className="badge-blue">{visit.diagnosis || "-"}</span></td>
                                                        <td>{visit.symptoms || "-"}</td>
                                                        <td>{visit.treatment || "-"}</td>
                                                        <td>
                                                            <div style={{ display: "flex", gap: "6px" }}>
                                                                <button
                                                                    type="button"
                                                                    className="btn-action-view"
                                                                    onClick={() => openViewModal(existingRecord, visit)}
                                                                >
                                                                    View
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-action-prescribe"
                                                                    onClick={() => openAddPrescriptionModal(searchedPatient, existingRecord, visit)}
                                                                >
                                                                    {hasPrescription ? "+ Add Meds" : "+ Prescribe"}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-action-edit"
                                                                    onClick={() => openEditVisitModal(existingRecord, visit, searchedPatient)}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-action-delete"
                                                                    onClick={() => handleDeleteVisit(existingRecord._id, visit._id)}
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

                                <div style={{ marginTop: "14px" }}>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => openAddVisitModal(searchedPatient, existingRecord)}
                                    >
                                        + Add New Visit
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* CASE 2: Patient Has NO Medical Record (Soft Amber Box) */}
                        {patientRecordStatus === "not_found" && (
                            <div className="notice-box notice-warning" style={{ marginTop: "14px" }}>
                                <div className="notice-header">
                                    <span className="pill-badge pill-amber">No Medical Record Found for this Patient</span>
                                </div>
                                <p style={{ margin: "10px 0 14px", fontSize: "13px" }}>
                                    This patient is registered in the hospital but has no medical records yet. You can create their first medical record and consultation visit now.
                                </p>
                                <div>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => openAddVisitModal(searchedPatient, null)}
                                    >
                                        + Create Medical Record
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SECTION 2: ALL HOSPITAL MEDICAL RECORDS */}
            <div className="dashboard-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: "17px", color: "#1e293b" }}>All Medical Records</h3>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                            {filteredRecords.length} records found in the system
                        </p>
                    </div>
                    <button type="button" className="btn-refresh" onClick={loadAllData}>
                        Refresh
                    </button>
                </div>

                <div style={{ marginBottom: "16px" }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Filter records by patient name, phone, or diagnosis..."
                        value={tableSearchTerm}
                        onChange={(e) => setTableSearchTerm(e.target.value)}
                        style={{ maxWidth: "450px" }}
                    />
                </div>

                {filteredRecords.length === 0 ? (
                    <p style={{ color: "#64748b", margin: "20px 0" }}>No medical records found.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="doctor-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Latest Diagnosis</th>
                                    <th>Visits</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((record) => {
                                    const latestVisit = getLatestVisit(record);
                                    return (
                                        <tr key={record._id}>
                                            <td>
                                                <strong>{record.patient?.name || "Unknown Patient"}</strong>
                                                <small>{record.patient?.phone || "No phone"}</small>
                                            </td>
                                            <td>
                                                <span className="badge-blue">
                                                    {latestVisit?.diagnosis || "No diagnosis"}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{record.visits?.length || 0}</strong>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        type="button"
                                                        className="btn-action-view"
                                                        onClick={() => openViewModal(record, latestVisit)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-action-prescribe"
                                                        onClick={() => openAddVisitModal(record.patient, record)}
                                                    >
                                                        + Add Visit
                                                    </button>
                                                    {latestVisit && (
                                                        <button
                                                            type="button"
                                                            className="btn-action-edit"
                                                            onClick={() => openEditVisitModal(record, latestVisit, record.patient)}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {latestVisit && (
                                                        <button
                                                            type="button"
                                                            className="btn-action-delete"
                                                            onClick={() => handleDeleteVisit(record._id, latestVisit._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
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

            {/* MODAL 1: ADD / EDIT VISIT */}
            {showVisitModal && (
                <div className="modal-overlay" onClick={() => setShowVisitModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>
                                    {isEditingVisit
                                        ? "Edit Medical Visit"
                                        : targetRecordId
                                        ? "Add Visit to Existing Record"
                                        : "Create First Medical Record"}
                                </h3>
                                <p>Patient: <strong>{targetPatient?.name}</strong> • Phone: {targetPatient?.phone}</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setShowVisitModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleVisitFormSubmit} className="modal-form">
                            {!isEditingVisit && (
                                <div className="form-group">
                                    <label>Appointment / Consultation</label>
                                    <select
                                        value={visitFormData.appointment}
                                        onChange={(e) =>
                                            setVisitFormData((prev) => ({
                                                ...prev,
                                                appointment: e.target.value
                                            }))
                                        }
                                    >
                                        <option value="">Direct Consultation (Auto-create Appointment)</option>
                                        {doctorAppointments
                                            .filter((a) => getId(a.patient) === getId(targetPatient?._id))
                                            .map((a) => (
                                                <option key={a._id} value={a._id}>
                                                    Appointment on {formatDate(a.appointmentDate)} at {a.appointmentTime} (Queue #{a.queueNumber})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label>Diagnosis *</label>
                                    <textarea
                                        rows="3"
                                        placeholder="e.g. Acute Viral Bronchitis"
                                        value={visitFormData.diagnosis}
                                        onChange={(e) =>
                                            setVisitFormData((prev) => ({
                                                ...prev,
                                                diagnosis: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Symptoms *</label>
                                    <textarea
                                        rows="3"
                                        placeholder="e.g. Cough, fever, throat pain"
                                        value={visitFormData.symptoms}
                                        onChange={(e) =>
                                            setVisitFormData((prev) => ({
                                                ...prev,
                                                symptoms: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label>Clinical Examination</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. BP 120/80, pulse 76, chest clear"
                                        value={visitFormData.examination}
                                        onChange={(e) =>
                                            setVisitFormData((prev) => ({
                                                ...prev,
                                                examination: e.target.value
                                            }))
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Treatment Plan</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Rest, oral fluids, follow-up in 5 days"
                                        value={visitFormData.treatment}
                                        onChange={(e) =>
                                            setVisitFormData((prev) => ({
                                                ...prev,
                                                treatment: e.target.value
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="Doctor remarks or advice"
                                    value={visitFormData.notes}
                                    onChange={(e) =>
                                        setVisitFormData((prev) => ({
                                            ...prev,
                                            notes: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-modal-cancel"
                                    onClick={() => setShowVisitModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-modal-submit"
                                    disabled={submittingVisit}
                                >
                                    {submittingVisit ? "Saving..." : isEditingVisit ? "Update Visit" : "Save Visit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD PRESCRIPTION TO VISIT */}
            {showPrescriptionModal && prescriptionTarget.visit && (
                <div className="modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
                    <div className="modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>Add Prescription to Visit</h3>
                                <p>
                                    Patient: <strong>{prescriptionTarget.patient?.name}</strong> • Diagnosis: <strong>{prescriptionTarget.visit?.diagnosis || "Consultation"}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setShowPrescriptionModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handlePrescriptionSubmit} className="modal-form">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <h4 style={{ margin: 0, color: "#1e293b" }}>Medicines List ({prescriptionFormData.medicines.length})</h4>
                                <button
                                    type="button"
                                    className="btn-add-item"
                                    onClick={handleAddMedicineRow}
                                >
                                    + Add Medicine
                                </button>
                            </div>

                            {prescriptionFormData.medicines.map((med, index) => (
                                <div key={index} className="medicine-card-box">
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <strong style={{ fontSize: "13px", color: "#334155" }}>Medicine #{index + 1}</strong>
                                        {prescriptionFormData.medicines.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn-remove-item"
                                                onClick={() => handleRemoveMedicineRow(index)}
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
                                                placeholder="e.g. Paracetamol"
                                                value={med.medicineName}
                                                onChange={(e) =>
                                                    handleMedicineFieldChange(index, "medicineName", e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Dosage *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 500 mg"
                                                value={med.dosage}
                                                onChange={(e) =>
                                                    handleMedicineFieldChange(index, "dosage", e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Frequency *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Twice daily"
                                                value={med.frequency}
                                                onChange={(e) =>
                                                    handleMedicineFieldChange(index, "frequency", e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Duration *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 5 days"
                                                value={med.duration}
                                                onChange={(e) =>
                                                    handleMedicineFieldChange(index, "duration", e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: "8px" }}>
                                        <label>Instructions</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Take after food"
                                            value={med.instructions}
                                            onChange={(e) =>
                                                handleMedicineFieldChange(index, "instructions", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="form-group" style={{ marginTop: "14px" }}>
                                <label>Additional Instructions</label>
                                <textarea
                                    rows="2"
                                    placeholder="Doctor advice or dietary precautions"
                                    value={prescriptionFormData.additionalInstructions}
                                    onChange={(e) =>
                                        setPrescriptionFormData((prev) => ({
                                            ...prev,
                                            additionalInstructions: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-modal-cancel"
                                    onClick={() => setShowPrescriptionModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-modal-submit"
                                    disabled={submittingPrescription}
                                >
                                    {submittingPrescription ? "Saving..." : "Save Prescription"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: VIEW VISIT & PRESCRIPTIONS */}
            {showViewModal && selectedVisitForView && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>Visit Details & Prescriptions</h3>
                                <p>
                                    Patient: <strong>{selectedRecordForView?.patient?.name}</strong> • Visit Date: {formatDate(selectedVisitForView.visitDate)}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setShowViewModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body-scroll">
                            {/* Visit Information */}
                            <div className="view-card-section">
                                <div className="info-grid-4">
                                    <div><span>Diagnosis:</span> <strong style={{ color: "#2563eb" }}>{selectedVisitForView.diagnosis || "-"}</strong></div>
                                    <div><span>Symptoms:</span> <p>{selectedVisitForView.symptoms || "-"}</p></div>
                                    <div><span>Examination:</span> <p>{selectedVisitForView.examination || "-"}</p></div>
                                    <div><span>Treatment:</span> <p>{selectedVisitForView.treatment || "-"}</p></div>
                                </div>
                                <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
                                    <span>Notes:</span> <strong style={{ color: "#334155" }}>{selectedVisitForView.notes || "No notes"}</strong>
                                </div>
                            </div>

                            {/* Prescriptions Attached */}
                            <div style={{ marginTop: "18px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <h4 style={{ margin: 0, color: "#1e293b" }}>Prescriptions for this Visit</h4>
                                    <button
                                        type="button"
                                        className="btn-action-prescribe"
                                        onClick={() => {
                                            setShowViewModal(false);
                                            openAddPrescriptionModal(selectedRecordForView?.patient, selectedRecordForView, selectedVisitForView);
                                        }}
                                    >
                                        + Add Prescription
                                    </button>
                                </div>

                                {(() => {
                                    const rxList = selectedVisitForView.prescriptions || (selectedVisitForView.prescription ? [selectedVisitForView.prescription] : []);
                                    if (rxList.length === 0) {
                                        return (
                                            <p style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "13px" }}>
                                                No prescription attached to this visit yet.
                                            </p>
                                        );
                                    }
                                    return rxList.map((p, pIdx) => (
                                        <div key={p._id || pIdx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", marginBottom: "10px" }}>
                                            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                                                Prescription Date: {formatDateTime(p.prescriptionDate)} • Doctor: Dr. {p.doctor?.name || doctor?.name}
                                            </div>
                                            <table className="doctor-table" style={{ background: "white" }}>
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
                                                    {(p.medicines || []).map((m, mIdx) => (
                                                        <tr key={mIdx}>
                                                            <td><strong>{m.medicineName}</strong></td>
                                                            <td>{m.dosage}</td>
                                                            <td><span className="badge-blue">{m.frequency}</span></td>
                                                            <td>{m.duration}</td>
                                                            <td>{m.instructions || "As advised"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {p.additionalInstructions && (
                                                <div style={{ marginTop: "8px", fontSize: "12px", color: "#334155" }}>
                                                    <strong>Advice:</strong> {p.additionalInstructions}
                                                </div>
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        <div className="modal-actions" style={{ borderTop: "1px solid #e2e8f0", marginTop: "16px", paddingTop: "14px" }}>
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => setShowViewModal(false)}
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

export default DoctorMedicalRecordManagement;
