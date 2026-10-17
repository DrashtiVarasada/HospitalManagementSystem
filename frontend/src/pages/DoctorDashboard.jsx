import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./DoctorDashboard.css";

const emptyMedicine = () => ({
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
});

const DoctorDashboard = () => {
    const navigate = useNavigate();

    // Data states
    const [doctor, setDoctor] = useState(null);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Patient checker state
    const [patientSearchTerm, setPatientSearchTerm] = useState("");
    const [searchedPatient, setSearchedPatient] = useState(null);
    const [patientRecordStatus, setPatientRecordStatus] = useState(null); // 'not_found' | 'found' | null
    const [existingRecord, setExistingRecord] = useState(null);
    const [checkingPatient, setCheckingPatient] = useState(false);

    // Modals
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRecordForView, setSelectedRecordForView] = useState(null);

    // Medical Record Form state
    const [recordFormData, setRecordFormData] = useState({
        patient: "",
        appointment: "",
        symptoms: "",
        diagnosis: "",
        examination: "",
        treatment: "",
        notes: ""
    });
    const [selectedPatientForRecord, setSelectedPatientForRecord] = useState(null);
    const [submittingRecord, setSubmittingRecord] = useState(false);

    // Prescription Form state
    const [prescriptionFormData, setPrescriptionFormData] = useState({
        patient: "",
        medicalRecord: "",
        visitId: "",
        medicines: [emptyMedicine()],
        additionalInstructions: ""
    });
    const [selectedVisitForPrescription, setSelectedVisitForPrescription] = useState(null);
    const [submittingPrescription, setSubmittingPrescription] = useState(false);

    const getId = (val) => {
        if (!val) return "";
        if (typeof val === "object") return val._id || "";
        return String(val);
    };

    // Keep exactly one "Dr." prefix when displaying doctor names.
    const getDoctorDisplayName = (name) => {
        if (!name) return "Doctor";
        return String(name).replace(/^Dr\.\s*/i, "").trim() || "Doctor";
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
            console.error("Dashboard data load error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // Filter appointments for this doctor
    const myAppointments = useMemo(() => {
        if (!doctor) return [];
        return appointments.filter(
            (a) => getId(a.doctor) === getId(doctor._id)
        );
    }, [appointments, doctor]);

    // Helper for comparing dates in the user's local timezone
    const getLocalDateKey = (date) => {
        if (!date) return "";
        const value = new Date(date);
        if (Number.isNaN(value.getTime())) return "";

        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    // Today's appointments for this doctor
    const todayAppointments = useMemo(() => {
        const todayStr = getLocalDateKey(new Date());

        return myAppointments.filter((a) => {
            const apptDateStr = getLocalDateKey(a.appointmentDate);
            return apptDateStr === todayStr;
        });
    }, [myAppointments]);

    // Doctor's records
    //
    // One MedicalRecord belongs to one patient and can contain visits
    // performed by different doctors. A doctor should therefore see the
    // record if at least one visit belongs to the logged-in doctor.
    const myRecords = useMemo(() => {
        if (!doctor) return [];

        const doctorId = getId(doctor._id);

        return records.filter((record) => {
            const topLevelDoctorMatches = getId(record.doctor) === doctorId;

            const hasDoctorVisit = (record.visits || []).some(
                (visit) => getId(visit.doctor) === doctorId
            );

            return topLevelDoctorMatches || hasDoctorVisit;
        });
    }, [records, doctor]);

    // Doctor's prescriptions
    const myPrescriptions = useMemo(() => {
        if (!doctor) return [];

        const doctorId = getId(doctor._id);

        return prescriptions.filter(
            (prescription) => getId(prescription.doctor) === doctorId
        );
    }, [prescriptions, doctor]);

    // Available unused appointments for doctor
    const availableDoctorAppointments = useMemo(() => {
        if (!doctor) return [];
        const usedIds = new Set();
        records.forEach((r) => {
            (r.visits || []).forEach((v) => {
                const id = getId(v.appointment);
                if (id) usedIds.add(id);
            });
        });

        return myAppointments.filter(
            (a) => !usedIds.has(getId(a._id)) && a.status !== "cancelled"
        );
    }, [myAppointments, doctor, records]);

    // Total visits performed by the logged-in doctor
    const totalVisitsCount = useMemo(() => {
        if (!doctor) return 0;

        const doctorId = getId(doctor._id);

        return myRecords.reduce((total, record) => {
            const doctorVisits = (record.visits || []).filter(
                (visit) => getId(visit.doctor) === doctorId
            );

            // Backward compatibility for older records where visit.doctor
            // may not exist but the top-level doctor matches.
            if (
                doctorVisits.length === 0 &&
                getId(record.doctor) === doctorId
            ) {
                return total + (record.visits?.length || 0);
            }

            return total + doctorVisits.length;
        }, 0);
    }, [myRecords, doctor]);

    // Get latest visit from a record
    const getLatestVisit = (record, doctorOnly = false) => {
        if (!record?.visits?.length) return null;

        let visits = record.visits;

        if (doctorOnly && doctor) {
            const doctorId = getId(doctor._id);

            const doctorVisits = visits.filter(
                (visit) => getId(visit.doctor) === doctorId
            );

            if (doctorVisits.length > 0) {
                visits = doctorVisits;
            } else if (getId(record.doctor) !== doctorId) {
                return null;
            }
        }

        return [...visits].sort(
            (a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0)
        )[0];
    };

    // =========================================================================
    // PATIENT MEDICAL RECORD CHECKER
    // =========================================================================

    const handleSearchPatientRecord = async (patientToLookup) => {
        let targetPatient = patientToLookup;

        if (!targetPatient) {
            const query = patientSearchTerm.trim().toLowerCase();
            if (!query) {
                alert("Please enter a patient name or phone number to search.");
                return;
            }

            // Find in patients list
            targetPatient = patients.find((p) => {
                const name = (p.name || "").toLowerCase();
                const phone = (p.phone || "").toLowerCase();
                return name.includes(query) || phone.includes(query);
            });

            if (!targetPatient) {
                alert(`No patient found matching "${patientSearchTerm}". Please verify the name or phone.`);
                setSearchedPatient(null);
                setPatientRecordStatus(null);
                return;
            }
        }

        setCheckingPatient(true);
        setSearchedPatient(targetPatient);

        try {
            // Check if patient medical record is created or not
            const response = await api.get(`/medical-records/patient/${targetPatient._id}`);
            const data = response.data;

            if (data.medicalRecord && (data.medicalRecord.visits?.length > 0 || data.totalVisits > 0)) {
                // Record ALREADY CREATED
                setPatientRecordStatus("found");
                setExistingRecord(data.medicalRecord);
            } else {
                // Record NOT CREATED
                setPatientRecordStatus("not_found");
                setExistingRecord(null);
            }
        } catch (error) {
            console.error("Error checking patient record:", error);
            setPatientRecordStatus("not_found");
            setExistingRecord(null);
        } finally {
            setCheckingPatient(false);
        }
    };

    // Open Medical Record Modal for a patient (either Create New or Add Visit)
    const openRecordModal = (patient, isExistingRecord = false, recordObj = null) => {
        setSelectedPatientForRecord(patient);

        // Find any active appointment for this patient with this doctor
        const patientAppt = availableDoctorAppointments.find(
            (a) => getId(a.patient) === getId(patient._id)
        );

        setRecordFormData({
            patient: getId(patient._id),
            appointment: patientAppt ? getId(patientAppt._id) : "",
            symptoms: "",
            diagnosis: "",
            examination: "",
            treatment: "",
            notes: ""
        });

        setShowRecordModal(true);
    };

    // Submit Medical Record (creates new or appends to existing)
    const handleRecordSubmit = async (e) => {
        e.preventDefault();
        if (!doctor) return alert("Doctor details missing");
        if (!recordFormData.patient) return alert("Please select a patient");
        if (!recordFormData.diagnosis.trim()) return alert("Please enter diagnosis");
        if (!recordFormData.symptoms.trim()) return alert("Please enter symptoms");

        try {
            setSubmittingRecord(true);
            const response = await api.post("/medical-records", {
                patient: recordFormData.patient,
                doctor: doctor._id,
                appointment: recordFormData.appointment || undefined,
                symptoms: recordFormData.symptoms,
                diagnosis: recordFormData.diagnosis,
                examination: recordFormData.examination,
                treatment: recordFormData.treatment,
                notes: recordFormData.notes
            });

            const createdRecord = response.data.medicalRecord;
            const createdVisitId = response.data.createdVisitId;

            alert(response.data.message || "Medical record saved successfully!");
            setShowRecordModal(false);

            await loadAllData();

            if (selectedPatientForRecord) {
                await handleSearchPatientRecord(selectedPatientForRecord);
            }

            const wantPrescription = window.confirm(
                "Medical Record successfully saved! Would you like to add a Prescription for this visit now?"
            );

            if (wantPrescription && createdRecord) {
                const latestVisit = createdRecord.visits?.[createdRecord.visits.length - 1];
                openPrescriptionModal(
                    selectedPatientForRecord,
                    createdRecord,
                    latestVisit || { _id: createdVisitId, diagnosis: recordFormData.diagnosis }
                );
            }
        } catch (error) {
            console.error("Save record error:", error);
            alert(error.response?.data?.message || "Failed to save medical record");
        } finally {
            setSubmittingRecord(false);
        }
    };

    // =========================================================================
    // PRESCRIPTION MANAGEMENT MODAL
    // =========================================================================

    const openPrescriptionModal = (patient, record, visit) => {
        setSelectedVisitForPrescription({
            patient,
            record,
            visit
        });

        setPrescriptionFormData({
            patient: getId(patient),
            medicalRecord: getId(record),
            visitId: getId(visit),
            medicines: [emptyMedicine()],
            additionalInstructions: ""
        });

        setShowPrescriptionModal(true);
    };

    const handleMedicineChange = (index, field, value) => {
        setPrescriptionFormData((prev) => {
            const meds = [...prev.medicines];
            meds[index] = { ...meds[index], [field]: value };
            return { ...prev, medicines: meds };
        });
    };

    const addMedicineField = () => {
        setPrescriptionFormData((prev) => ({
            ...prev,
            medicines: [...prev.medicines, emptyMedicine()]
        }));
    };

    const removeMedicineField = (index) => {
        if (prescriptionFormData.medicines.length === 1) return;
        setPrescriptionFormData((prev) => ({
            ...prev,
            medicines: prev.medicines.filter((_, i) => i !== index)
        }));
    };

    const handlePrescriptionSubmit = async (e) => {
        e.preventDefault();
        if (!doctor) return alert("Doctor details missing");
        if (!prescriptionFormData.medicalRecord || !prescriptionFormData.visitId) {
            return alert("Medical record and visit are required");
        }

        for (let i = 0; i < prescriptionFormData.medicines.length; i++) {
            const m = prescriptionFormData.medicines[i];
            if (!m.medicineName.trim() || !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim()) {
                return alert(`Please fill medicine name, dosage, frequency, and duration for medicine #${i + 1}`);
            }
        }

        try {
            setSubmittingPrescription(true);
            await api.post("/prescriptions", {
                patient: prescriptionFormData.patient,
                doctor: doctor._id,
                medicalRecord: prescriptionFormData.medicalRecord,
                visitId: prescriptionFormData.visitId,
                medicines: prescriptionFormData.medicines,
                additionalInstructions: prescriptionFormData.additionalInstructions
            });

            alert("Prescription added successfully to this visit!");
            setShowPrescriptionModal(false);
            await loadAllData();

            if (selectedRecordForView) {
                const refreshed = await api.get(`/medical-records/${selectedRecordForView._id}`);
                setSelectedRecordForView(refreshed.data.medicalRecord);
            }
        } catch (error) {
            console.error("Prescription error:", error);
            alert(error.response?.data?.message || "Failed to save prescription");
        } finally {
            setSubmittingPrescription(false);
        }
    };

    // =========================================================================
    // VIEW MEDICAL RECORD + PRESCRIPTIONS
    // =========================================================================

    const handleViewRecord = async (record) => {
        try {
            const res = await api.get(`/medical-records/${record._id}`);
            setSelectedRecordForView(res.data.medicalRecord || record);
            setShowDetailsModal(true);
        } catch (error) {
            console.error("View record error:", error);
            setSelectedRecordForView(record);
            setShowDetailsModal(true);
        }
    };

    if (loading) {
        return (
            <div className="doctor-dashboard-loading">
                <p>Loading Doctor Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="doctor-dashboard">

            {/* WELCOME HERO */}
            <div className="doctor-hero-card">
                <div className="doctor-hero-content">
                    <div className="doctor-hero-avatar">
                        {doctor?.name?.charAt(0)?.toUpperCase() || "D"}
                    </div>
                    <div>
                        <h2>Welcome back, Dr. {getDoctorDisplayName(doctor?.name)}</h2>
                        <p className="hero-subtitle">
                            {doctor?.specialization || "General Medicine"} • {doctor?.qualification || "MBBS"} • {doctor?.experience || 0} Years Experience
                        </p>
                        <div className="hero-tags">
                            <span className="hero-tag">Phone: {doctor?.phone || "N/A"}</span>
                            <span className="hero-tag">Consultation Fee: Rs. {doctor?.consultationFee || "0"}</span>
                            <span className="hero-tag status-active">Active On Duty</span>
                        </div>
                    </div>
                </div>

                <div className="doctor-hero-actions">
                    <button
                        type="button"
                        className="hero-action-btn primary"
                        onClick={() => navigate("/doctor/medical-records")}
                    >
                        Medical Records
                    </button>
                    <button
                        type="button"
                        className="hero-action-btn secondary"
                        onClick={() => navigate("/doctor/prescriptions")}
                    >
                        Prescriptions
                    </button>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="doctor-stats-grid">
                <div className="doctor-stat-card">
                    <div className="stat-icon-wrapper bg-blue">[Patients]</div>
                    <div>
                        <span className="stat-label">Total Patients Checked</span>
                        <strong className="stat-number">{myRecords.length}</strong>
                        <span className="stat-sub">Across {totalVisitsCount} visits</span>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon-wrapper bg-teal">[Records]</div>
                    <div>
                        <span className="stat-label">Medical Records</span>
                        <strong className="stat-number">{myRecords.length}</strong>
                        <span className="stat-sub">Created by Dr. {getDoctorDisplayName(doctor?.name).split(" ")[0]}</span>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon-wrapper bg-amber">[Queue]</div>
                    <div>
                        <span className="stat-label">Today Queue</span>
                        <strong className="stat-number">{todayAppointments.length}</strong>
                        <span className="stat-sub">
                            {todayAppointments.filter((a) => a.status === "waiting").length} waiting,{" "}
                            {todayAppointments.filter((a) => a.status === "completed").length} completed
                        </span>
                    </div>
                </div>

                <div className="doctor-stat-card">
                    <div className="stat-icon-wrapper bg-purple">[Prescriptions]</div>
                    <div>
                        <span className="stat-label">Prescriptions Issued</span>
                        <strong className="stat-number">{myPrescriptions.length}</strong>
                        <span className="stat-sub">Active medical prescriptions</span>
                    </div>
                </div>
            </div>

            {/* PATIENT MEDICAL RECORD SEARCH & CHECKER */}
            <div className="patient-checker-card">
                <div className="checker-header">
                    <div>
                        <h3>Check Patient & Medical Record</h3>
                        <p>Search a patient to check if their medical record exists or create/add to their medical record</p>
                    </div>
                </div>

                <div className="checker-body">
                    {/* Search bar */}
                    <div className="checker-search-bar">
                        <div className="checker-input-wrapper">
                            <input
                                type="text"
                                placeholder="Enter patient name or phone number..."
                                value={patientSearchTerm}
                                onChange={(e) => setPatientSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearchPatientRecord()}
                            />
                        </div>

                        <button
                            type="button"
                            className="checker-search-btn"
                            onClick={() => handleSearchPatientRecord()}
                            disabled={checkingPatient}
                        >
                            {checkingPatient ? "Checking..." : "Check Record"}
                        </button>
                    </div>

                    {/* Quick Pick from Today's Patients */}
                    {todayAppointments.length > 0 && (
                        <div className="today-queue-quickpick">
                            <span className="quickpick-label">Today Patients:</span>
                            <div className="quickpick-pills">
                                {todayAppointments.map((appt) => (
                                    <button
                                        key={appt._id}
                                        type="button"
                                        className="quickpick-pill"
                                        onClick={() => {
                                            if (appt.patient) {
                                                setPatientSearchTerm(appt.patient.name);
                                                handleSearchPatientRecord(appt.patient);
                                            }
                                        }}
                                    >
                                        #{appt.queueNumber} {appt.patient?.name || "Patient"} ({appt.appointmentTime || "Today"})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RESULTS BOX */}
                    {searchedPatient && (
                        <div className="checker-result-box">
                            <div className="patient-profile-summary">
                                <div className="patient-avatar-circle">
                                    {searchedPatient.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="patient-meta">
                                    <h4>{searchedPatient.name}</h4>
                                    <div className="patient-meta-tags">
                                        <span>Phone: {searchedPatient.phone || "No phone"}</span>
                                        <span>Blood Group: {searchedPatient.bloodGroup || "Unknown"}</span>
                                        <span>Gender: {searchedPatient.gender || "N/A"}</span>
                                        <span>DOB: {formatDate(searchedPatient.dateOfBirth)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* SCENARIO A: NOT CREATED */}
                            {patientRecordStatus === "not_found" && (
                                <div className="record-status-card not-created">
                                    <div className="status-badge-row">
                                        <span className="status-pill warning">Medical Record Not Created</span>
                                    </div>
                                    <p className="status-message">
                                        No medical record exists for <strong>{searchedPatient.name}</strong> yet. You can create their initial medical record now.
                                    </p>
                                    <div className="status-actions">
                                        <button
                                            type="button"
                                            className="status-btn create-new"
                                            onClick={() => openRecordModal(searchedPatient, false)}
                                        >
                                            + Create New Medical Record
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* SCENARIO B: ALREADY CREATED */}
                            {patientRecordStatus === "found" && existingRecord && (
                                <div className="record-status-card already-created">
                                    <div className="status-badge-row">
                                        <span className="status-pill success">Medical Record Exists</span>
                                        <span className="visits-count-badge">
                                            {existingRecord.visits?.length || 0} Total Consultation Visit(s)
                                        </span>
                                    </div>

                                    {/* Latest visit preview */}
                                    {getLatestVisit(existingRecord) && (
                                        <div className="existing-record-preview">
                                            <div>
                                                <span>Latest Diagnosis:</span>
                                                <strong>{getLatestVisit(existingRecord).diagnosis}</strong>
                                            </div>
                                            <div>
                                                <span>Last Visit Date:</span>
                                                <strong>{formatDate(getLatestVisit(existingRecord).visitDate)}</strong>
                                            </div>
                                            <div>
                                                <span>Symptoms:</span>
                                                <p>{getLatestVisit(existingRecord).symptoms || "-"}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="status-actions">
                                        <button
                                            type="button"
                                            className="status-btn add-record"
                                            onClick={() => openRecordModal(searchedPatient, true, existingRecord)}
                                        >
                                            + Add Medical Record
                                        </button>

                                        <button
                                            type="button"
                                            className="status-btn view-record"
                                            onClick={() => handleViewRecord(existingRecord)}
                                        >
                                            View Record & Prescriptions
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* TWO COLUMNS: TODAY'S QUEUE & RECENT MEDICAL RECORDS */}
            <div className="dashboard-sections-grid">

                {/* TODAY'S APPOINTMENT QUEUE */}
                <div className="dashboard-section-card">
                    <div className="section-card-header">
                        <div>
                            <h3>Today Patient Queue</h3>
                            <p>{todayAppointments.length} patient(s) scheduled for today</p>
                        </div>
                        <button
                            type="button"
                            className="section-refresh-btn"
                            onClick={loadAllData}
                        >
                            Refresh
                        </button>
                    </div>

                    {todayAppointments.length === 0 ? (
                        <div className="dashboard-empty-state">
                            <p>No appointments scheduled for today.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Queue</th>
                                        <th>Patient</th>
                                        <th>Time</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todayAppointments.map((appt) => {
                                        return (
                                            <tr key={appt._id}>
                                                <td>
                                                    <span className="queue-pill">#{appt.queueNumber}</span>
                                                </td>
                                                <td>
                                                    <strong>{appt.patient?.name || "Patient"}</strong>
                                                    <span className="table-sub">{appt.patient?.phone}</span>
                                                </td>
                                                <td>{appt.appointmentTime || "-"}</td>
                                                <td>
                                                    <span className="reason-text">{appt.reason}</span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${appt.status}`}>
                                                        {appt.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="table-action-btn check-btn"
                                                        onClick={() => {
                                                            if (appt.patient) {
                                                                setPatientSearchTerm(appt.patient.name);
                                                                handleSearchPatientRecord(appt.patient);
                                                            }
                                                        }}
                                                    >
                                                        Check / Add Record
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* RECENT MEDICAL RECORDS */}
                <div className="dashboard-section-card">
                    <div className="section-card-header">
                        <div>
                            <h3>Recent Medical Records</h3>
                            <p>{myRecords.length} patient record(s) under your care</p>
                        </div>
                        <button
                            type="button"
                            className="section-viewall-btn"
                            onClick={() => navigate("/doctor/medical-records")}
                        >
                            View All
                        </button>
                    </div>

                    {myRecords.length === 0 ? (
                        <div className="dashboard-empty-state">
                            <p>No medical records created yet.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Latest Diagnosis</th>
                                        <th>Visits</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myRecords.slice(0, 5).map((record) => {
                                        const latestVisit = getLatestVisit(record, true);
                                        const hasPrescription = (latestVisit?.prescriptions?.length || 0) > 0;

                                        return (
                                            <tr key={record._id}>
                                                <td>
                                                    <strong>{record.patient?.name || "Unknown"}</strong>
                                                    <span className="table-sub">{record.patient?.phone}</span>
                                                </td>
                                                <td>
                                                    <span className="diagnosis-pill">
                                                        {latestVisit?.diagnosis || "No diagnosis"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>{record.visits?.length || 0}</strong>
                                                </td>
                                                <td>
                                                    <div className="table-action-group">
                                                        <button
                                                            type="button"
                                                            className="table-action-btn view-btn"
                                                            onClick={() => handleViewRecord(record)}
                                                        >
                                                            View
                                                        </button>

                                                        {latestVisit && (
                                                            <button
                                                                type="button"
                                                                className="table-action-btn rx-btn"
                                                                onClick={() =>
                                                                    openPrescriptionModal(
                                                                        record.patient,
                                                                        record,
                                                                        latestVisit
                                                                    )
                                                                }
                                                            >
                                                                {hasPrescription ? "+ Add Meds" : "+ Prescribe"}
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

            </div>

            {/* MODAL 1: CREATE / ADD MEDICAL RECORD */}
            {showRecordModal && (
                <div className="dash-modal-overlay" onClick={() => setShowRecordModal(false)}>
                    <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <div>
                                <h3>
                                    {patientRecordStatus === "found" ? "Add Visit to Medical Record" : "Create New Medical Record"}
                                </h3>
                                <p>
                                    Patient: <strong>{selectedPatientForRecord?.name}</strong> • Phone: {selectedPatientForRecord?.phone}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="dash-modal-close"
                                onClick={() => setShowRecordModal(false)}
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={handleRecordSubmit} className="dash-modal-form">
                            <div className="dash-form-group">
                                <label>Appointment / Consultation Type</label>
                                <select
                                    value={recordFormData.appointment}
                                    onChange={(e) =>
                                        setRecordFormData((prev) => ({
                                            ...prev,
                                            appointment: e.target.value
                                        }))
                                    }
                                >
                                    <option value="">Direct Doctor Consultation (Auto-create Appointment)</option>
                                    {availableDoctorAppointments
                                        .filter(
                                            (a) =>
                                                getId(a.patient) ===
                                                getId(selectedPatientForRecord?._id)
                                        )
                                        .map((a) => (
                                            <option key={a._id} value={a._id}>
                                                Appointment on {formatDate(a.appointmentDate)} at {a.appointmentTime} (Queue #{a.queueNumber})
                                            </option>
                                        ))}
                                </select>
                                <small>You can link an existing appointment or record a direct consultation visit.</small>
                            </div>

                            <div className="dash-form-row">
                                <div className="dash-form-group">
                                    <label>Diagnosis *</label>
                                    <textarea
                                        rows="3"
                                        placeholder="e.g. Acute Viral Bronchitis, Hypertension Stage 1..."
                                        value={recordFormData.diagnosis}
                                        onChange={(e) =>
                                            setRecordFormData((prev) => ({
                                                ...prev,
                                                diagnosis: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>

                                <div className="dash-form-group">
                                    <label>Symptoms *</label>
                                    <textarea
                                        rows="3"
                                        placeholder="e.g. Dry cough for 3 days, fever 101F, body aches..."
                                        value={recordFormData.symptoms}
                                        onChange={(e) =>
                                            setRecordFormData((prev) => ({
                                                ...prev,
                                                symptoms: e.target.value
                                            }))
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="dash-form-row">
                                <div className="dash-form-group">
                                    <label>Clinical Examination</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. BP: 120/80, Pulse: 78 bpm, Chest clear..."
                                        value={recordFormData.examination}
                                        onChange={(e) =>
                                            setRecordFormData((prev) => ({
                                                ...prev,
                                                examination: e.target.value
                                            }))
                                        }
                                    />
                                </div>

                                <div className="dash-form-group">
                                    <label>Treatment Plan</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Hydration, rest, oral antibiotics, follow-up in 5 days..."
                                        value={recordFormData.treatment}
                                        onChange={(e) =>
                                            setRecordFormData((prev) => ({
                                                ...prev,
                                                treatment: e.target.value
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="dash-form-group">
                                <label>Doctor Notes / Remarks</label>
                                <textarea
                                    rows="2"
                                    placeholder="Any additional clinical observations or notes..."
                                    value={recordFormData.notes}
                                    onChange={(e) =>
                                        setRecordFormData((prev) => ({
                                            ...prev,
                                            notes: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            <div className="dash-modal-actions">
                                <button
                                    type="button"
                                    className="dash-modal-btn cancel"
                                    onClick={() => setShowRecordModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="dash-modal-btn submit"
                                    disabled={submittingRecord}
                                >
                                    {submittingRecord ? "Saving..." : "Save Medical Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD PRESCRIPTION TO VISIT */}
            {showPrescriptionModal && selectedVisitForPrescription && (
                <div className="dash-modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
                    <div className="dash-modal-box prescription-modal-width" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <div>
                                <h3>Add Prescription to Patient Visit</h3>
                                <p>
                                    Patient: <strong>{selectedVisitForPrescription.patient?.name}</strong> • Diagnosis:{" "}
                                    <span className="diagnosis-highlight">
                                        {selectedVisitForPrescription.visit?.diagnosis || "Consultation"}
                                    </span>
                                </p>
                            </div>
                            <button
                                type="button"
                                className="dash-modal-close"
                                onClick={() => setShowPrescriptionModal(false)}
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={handlePrescriptionSubmit} className="dash-modal-form">
                            <div className="medicines-section-header">
                                <h4>Prescribed Medicines ({prescriptionFormData.medicines.length})</h4>
                                <button
                                    type="button"
                                    className="add-medicine-btn"
                                    onClick={addMedicineField}
                                >
                                    + Add Another Medicine
                                </button>
                            </div>

                            {prescriptionFormData.medicines.map((med, index) => (
                                <div key={index} className="medicine-row-card">
                                    <div className="medicine-row-header">
                                        <span>Medicine #{index + 1}</span>
                                        {prescriptionFormData.medicines.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-med-btn"
                                                onClick={() => removeMedicineField(index)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="med-inputs-grid">
                                        <div className="dash-form-group">
                                            <label>Medicine Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg"
                                                value={med.medicineName}
                                                onChange={(e) =>
                                                    handleMedicineChange(index, "medicineName", e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="dash-form-group">
                                            <label>Dosage *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 500mg, 1 Tablet, 5ml"
                                                value={med.dosage}
                                                onChange={(e) =>
                                                    handleMedicineChange(index, "dosage", e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="dash-form-group">
                                            <label>Frequency *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 1-0-1, Twice daily, Every 8 hours"
                                                value={med.frequency}
                                                onChange={(e) =>
                                                    handleMedicineChange(index, "frequency", e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="dash-form-group">
                                            <label>Duration *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 5 days, 1 week, 1 month"
                                                value={med.duration}
                                                onChange={(e) =>
                                                    handleMedicineChange(index, "duration", e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="dash-form-group">
                                        <label>Timing / Food Instructions</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. After food with warm water, Before breakfast"
                                            value={med.instructions}
                                            onChange={(e) =>
                                                handleMedicineChange(index, "instructions", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="dash-form-group" style={{ marginTop: "14px" }}>
                                <label>Additional Advice / Special Instructions</label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Drink warm fluids, avoid dairy, rest for 3 days, revisit if fever persists..."
                                    value={prescriptionFormData.additionalInstructions}
                                    onChange={(e) =>
                                        setPrescriptionFormData((prev) => ({
                                            ...prev,
                                            additionalInstructions: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            <div className="dash-modal-actions">
                                <button
                                    type="button"
                                    className="dash-modal-btn cancel"
                                    onClick={() => setShowPrescriptionModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="dash-modal-btn submit"
                                    disabled={submittingPrescription}
                                >
                                    {submittingPrescription ? "Saving..." : "Save Prescription"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: VIEW MEDICAL RECORD AND ITS PRESCRIPTION */}
            {showDetailsModal && selectedRecordForView && (
                <div className="dash-modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="dash-modal-box view-modal-width" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <div>
                                <h3>Medical Record & Clinical History</h3>
                                <p>Complete consultations and prescribed medication</p>
                            </div>
                            <button
                                type="button"
                                className="dash-modal-close"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="view-modal-body">
                            {/* Patient Info Card */}
                            <div className="view-patient-card">
                                <div className="patient-avatar-lg">
                                    {selectedRecordForView.patient?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="view-patient-info">
                                    <h3>{selectedRecordForView.patient?.name || "Patient"}</h3>
                                    <div className="view-patient-grid">
                                        <div><span>Phone:</span> <strong>{selectedRecordForView.patient?.phone || "-"}</strong></div>
                                        <div><span>Gender:</span> <strong>{selectedRecordForView.patient?.gender || "-"}</strong></div>
                                        <div><span>Blood Group:</span> <strong>{selectedRecordForView.patient?.bloodGroup || "-"}</strong></div>
                                        <div><span>DOB:</span> <strong>{formatDate(selectedRecordForView.patient?.dateOfBirth)}</strong></div>
                                        <div><span>Email:</span> <strong>{selectedRecordForView.patient?.email || "-"}</strong></div>
                                        <div><span>Doctor:</span> <strong>Dr. {getDoctorDisplayName(selectedRecordForView.doctor?.name || doctor?.name)}</strong></div>
                                    </div>
                                </div>
                            </div>

                            {/* Action to Add New Visit */}
                            <div className="view-add-visit-bar">
                                <span>Total Visits Recorded: <strong>{selectedRecordForView.visits?.length || 0}</strong></span>
                                <button
                                    type="button"
                                    className="view-add-visit-btn"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        openRecordModal(selectedRecordForView.patient, true, selectedRecordForView);
                                    }}
                                >
                                    + Add Medical Record / Visit
                                </button>
                            </div>

                            {/* Visits List */}
                            <div className="view-visits-list">
                                {(selectedRecordForView.visits || []).map((visit, vIdx) => {
                                    const visitPrescriptions = visit.prescriptions || (visit.prescription ? [visit.prescription] : []);
                                    const hasPrescription = visitPrescriptions.length > 0;

                                    return (
                                        <div key={visit._id || vIdx} className="view-visit-item-card">
                                            {/* VISIT HEADER */}
                                            <div className="visit-item-header">
                                                <div>
                                                    <h4>
                                                        Visit #{vIdx + 1} • <span className="diagnosis-tag">{visit.diagnosis || "Consultation"}</span>
                                                    </h4>
                                                    <span className="visit-date-str">
                                                        Visit Date: {formatDate(visit.visitDate)}
                                                        {visit.appointment?.appointmentTime && ` • Time: ${visit.appointment.appointmentTime}`}
                                                    </span>
                                                </div>

                                                <div className="visit-actions">
                                                    <button
                                                        type="button"
                                                        className="add-rx-for-visit-btn"
                                                        onClick={() =>
                                                            openPrescriptionModal(
                                                                selectedRecordForView.patient,
                                                                selectedRecordForView,
                                                                visit
                                                             )
                                                        }
                                                    >
                                                        {hasPrescription ? "+ Add More Meds" : "+ Add Prescription"}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* VISIT DETAILS */}
                                            <div className="visit-details-grid">
                                                <div className="visit-detail-box">
                                                    <span>Symptoms</span>
                                                    <p>{visit.symptoms || "-"}</p>
                                                </div>
                                                <div className="visit-detail-box">
                                                    <span>Clinical Examination</span>
                                                    <p>{visit.examination || "-"}</p>
                                                </div>
                                                <div className="visit-detail-box">
                                                    <span>Treatment Plan</span>
                                                    <p>{visit.treatment || "-"}</p>
                                                </div>
                                                <div className="visit-detail-box">
                                                    <span>Notes</span>
                                                    <p>{visit.notes || "-"}</p>
                                                </div>
                                            </div>

                                            {/* PRESCRIPTION SECTION BELOW VISIT */}
                                            <div className="visit-prescription-section">
                                                <div className="prescription-section-title">
                                                    <h5>Prescriptions for Visit #{vIdx + 1}</h5>
                                                    {hasPrescription && (
                                                        <span className="rx-count-tag">
                                                            {visitPrescriptions.length} Prescription(s) Linked
                                                        </span>
                                                    )}
                                                </div>

                                                {hasPrescription ? (
                                                    <div className="prescriptions-list-wrapper">
                                                        {visitPrescriptions.map((p, pIdx) => (
                                                            <div key={p._id || pIdx} className="prescription-record-card">
                                                                <div className="rx-meta-bar">
                                                                    <span>Issued: {formatDateTime(p.prescriptionDate)}</span>
                                                                    <span>Doctor: Dr. {getDoctorDisplayName(p.doctor?.name || doctor?.name)}</span>
                                                                </div>

                                                                <table className="rx-medicines-table">
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
                                                                        {(p.medicines || []).map((med, mIdx) => (
                                                                            <tr key={mIdx}>
                                                                                <td>
                                                                                    <strong>{med.medicineName}</strong>
                                                                                </td>
                                                                                <td>{med.dosage}</td>
                                                                                <td>
                                                                                    <span className="freq-badge">{med.frequency}</span>
                                                                                </td>
                                                                                <td>{med.duration}</td>
                                                                                <td>{med.instructions || "As advised"}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>

                                                                {p.additionalInstructions && (
                                                                    <div className="rx-instructions-box">
                                                                        <strong>Doctor Advice:</strong> {p.additionalInstructions}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="no-prescription-notice">
                                                        <p>No prescription has been added for this visit yet.</p>
                                                        <button
                                                            type="button"
                                                            className="inline-add-prescription-btn"
                                                            onClick={() =>
                                                                openPrescriptionModal(
                                                                    selectedRecordForView.patient,
                                                                    selectedRecordForView,
                                                                    visit
                                                                )
                                                            }
                                                        >
                                                            + Add Prescription Now
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="dash-modal-footer">
                            <button
                                type="button"
                                className="dash-modal-btn cancel"
                                onClick={() => setShowDetailsModal(false)}
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

export default DoctorDashboard;
