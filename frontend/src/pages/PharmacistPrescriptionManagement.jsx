import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./PharmacistPrescriptionManagement.css";

const PharmacistPrescriptionManagement = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dispensing, setDispensing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [dispenseQuantities, setDispenseQuantities] = useState({});

    /* =========================================
       FETCH PRESCRIPTIONS
    ========================================= */
    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/prescriptions");
            setPrescriptions(response.data?.prescriptions || []);
        } catch (err) {
            console.error("Error fetching prescriptions:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load prescriptions."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================================
       HELPER FUNCTIONS
    ========================================= */
    const getPatientName = (prescription) => {
        if (!prescription?.patient) return "Unknown Patient";
        if (typeof prescription.patient === "string") return prescription.patient;
        return (
            prescription.patient.name ||
            prescription.patient.fullName ||
            "Unknown Patient"
        );
    };

    const getPatientPhone = (prescription) => {
        if (!prescription?.patient || typeof prescription.patient === "string") {
            return "-";
        }
        return (
            prescription.patient.phone ||
            prescription.patient.contactNumber ||
            "-"
        );
    };

    const getDoctorName = (prescription) => {
        if (!prescription?.doctor) return "Unknown Doctor";
        if (typeof prescription.doctor === "string") return prescription.doctor;
        return prescription.doctor.name || "Unknown Doctor";
    };

    const getVisit = (prescription) => {
        const visits = prescription?.medicalRecord?.visits || [];
        return (
            visits.find(
                (visit) => String(visit._id) === String(prescription.visitId)
            ) || null
        );
    };

    const getDiagnosis = (prescription) => {
        const visit = getVisit(prescription);
        return visit?.diagnosis || "-";
    };

    const formatDate = (date) => {
        if (!date) return "-";
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) return "-";
        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const getStatusLabel = (status) => {
        return status === "dispensed" ? "Dispensed" : "Pending";
    };

    /* =========================================
       FILTER
    ========================================= */
    const filteredPrescriptions = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return prescriptions.filter((prescription) => {
            const patientName = getPatientName(prescription).toLowerCase();
            const doctorName = getDoctorName(prescription).toLowerCase();
            const diagnosis = getDiagnosis(prescription).toLowerCase();

            const matchesSearch =
                !search ||
                patientName.includes(search) ||
                doctorName.includes(search) ||
                diagnosis.includes(search);

            const status = prescription.dispensingStatus || "pending";
            const matchesStatus =
                statusFilter === "all" || status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [prescriptions, searchTerm, statusFilter]);

    /* =========================================
       OPEN PRESCRIPTION DETAILS
    ========================================= */
    const openPrescription = (prescription) => {
        setError("");
        setSuccess("");
        setSelectedPrescription(prescription);

        const quantities = {};
        prescription.medicines?.forEach((medicine, index) => {
            const medicineKey = `${medicine.medicineName}-${index}`;
            quantities[medicineKey] = "";
        });

        setDispenseQuantities(quantities);
    };

    const closePrescription = () => {
        if (dispensing) return;
        setSelectedPrescription(null);
        setDispenseQuantities({});
    };

    /* =========================================
       QUANTITY CHANGE
    ========================================= */
    const handleQuantityChange = (medicineKey, value) => {
        setDispenseQuantities((prev) => ({
            ...prev,
            [medicineKey]: value
        }));
    };

    /* =========================================
       DISPENSE
    ========================================= */
    const handleDispense = async () => {
        if (!selectedPrescription) return;

        try {
            setDispensing(true);
            setError("");
            setSuccess("");

            const medicines = selectedPrescription.medicines || [];
            if (medicines.length === 0) {
                throw new Error("This prescription has no medicines.");
            }

            const items = medicines.map((medicine, index) => {
                const medicineKey = `${medicine.medicineName}-${index}`;
                const quantity = Number(dispenseQuantities[medicineKey]);

                if (!Number.isInteger(quantity) || quantity <= 0) {
                    throw new Error(
                        `Enter a valid dispense quantity for ${medicine.medicineName}.`
                    );
                }

                return {
                    medicineName: medicine.medicineName,
                    quantity
                };
            });

            const response = await api.post(
                `/prescriptions/${selectedPrescription._id}/dispense`,
                { items }
            );

            const updatedPrescription = response.data?.prescription;

            if (updatedPrescription) {
                setPrescriptions((prev) =>
                    prev.map((p) =>
                        p._id === selectedPrescription._id
                            ? updatedPrescription
                            : p
                    )
                );
                setSelectedPrescription(updatedPrescription);
            } else {
                await fetchPrescriptions();
            }

            setSuccess(
                "Prescription dispensed successfully. Pharmacy stock has been updated."
            );
            setDispenseQuantities({});
        } catch (err) {
            console.error("Error dispensing prescription:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to dispense prescription."
            );
        } finally {
            setDispensing(false);
        }
    };

    const pendingCount = prescriptions.filter(
        (p) => (p.dispensingStatus || "pending") === "pending"
    ).length;

    const dispensedCount = prescriptions.filter(
        (p) => p.dispensingStatus === "dispensed"
    ).length;

    if (loading) {
        return (
            <div className="manager-dashboard">
                <div className="dashboard-loading">Loading prescriptions...</div>
            </div>
        );
    }

    return (
        <div className="manager-dashboard">
            {/* Page Header matching Manager style */}
            <div className="page-header-row">
                <div>
                    <h2>Prescription Management</h2>
                    <p>
                        Review doctor prescriptions, check dosages, and dispense prescribed medicines.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        className="btn-refresh"
                        onClick={fetchPrescriptions}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="prescription-alert prescription-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="prescription-alert prescription-success">
                    {success}
                </div>
            )}

            {/* Summary Stat Grid */}
            <div className="stats-grid-3">
                <div className="stat-card border-blue">
                    <h3>Total Prescriptions</h3>
                    <strong className="text-blue">{prescriptions.length}</strong>
                    <span className="stat-sub">All time doctor orders</span>
                </div>

                <div className="stat-card border-amber">
                    <h3>Pending Dispense</h3>
                    <strong className="text-amber">{pendingCount}</strong>
                    <span className="stat-sub">Waiting for pharmacist action</span>
                </div>

                <div className="stat-card border-emerald">
                    <h3>Dispensed</h3>
                    <strong className="text-emerald">{dispensedCount}</strong>
                    <span className="stat-sub">Fulfilled prescriptions</span>
                </div>
            </div>

            {/* Prescriptions List Card */}
            <div className="dashboard-card">
                <div className="card-top-header">
                    <div>
                        <h3>Prescriptions Queue</h3>
                        <p>
                            Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="prescription-toolbar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search patient, doctor, or diagnosis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Prescriptions</option>
                        <option value="pending">Pending</option>
                        <option value="dispensed">Dispensed</option>
                    </select>
                </div>

                {/* Table */}
                {filteredPrescriptions.length === 0 ? (
                    <div className="empty-state-box">
                        <h4>No Prescriptions Found</h4>
                        <p>
                            {prescriptions.length === 0
                                ? "Doctor prescriptions will appear here once created."
                                : "Try changing your search term or status filter."}
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="pharmacist-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Diagnosis</th>
                                    <th>Medicines</th>
                                    <th>Prescription Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrescriptions.map((prescription) => {
                                    const status =
                                        prescription.dispensingStatus || "pending";

                                    return (
                                        <tr key={prescription._id}>
                                            <td>
                                                <strong>{getPatientName(prescription)}</strong>
                                                <small>{getPatientPhone(prescription)}</small>
                                            </td>
                                            <td>{getDoctorName(prescription)}</td>
                                            <td>{getDiagnosis(prescription)}</td>
                                            <td>
                                                <span className="medicine-pill">
                                                    {prescription.medicines?.length || 0}{" "}
                                                    {prescription.medicines?.length === 1
                                                        ? "item"
                                                        : "items"}
                                                </span>
                                            </td>
                                            <td>
                                                {formatDate(
                                                    prescription.prescriptionDate ||
                                                    prescription.createdAt
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-pill ${
                                                        status === "dispensed"
                                                            ? "pill-completed"
                                                            : "pill-waiting"
                                                    }`}
                                                >
                                                    {getStatusLabel(status)}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn-action-view"
                                                    onClick={() => openPrescription(prescription)}
                                                >
                                                    {status === "dispensed"
                                                        ? "View"
                                                        : "Dispense"}
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

            {/* MODAL: PRESCRIPTION DETAILS & DISPENSE */}
            {selectedPrescription && (
                <div className="modal-overlay" onClick={closePrescription}>
                    <div
                        className="modal-box modal-box-large"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3>Prescription Details</h3>
                                <p>
                                    Patient: <strong>{getPatientName(selectedPrescription)}</strong> • Phone: {getPatientPhone(selectedPrescription)}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closePrescription}
                                disabled={dispensing}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body-content">
                            {/* Patient & Doctor Info Grid */}
                            <div className="info-summary-grid">
                                <div className="info-item">
                                    <span>Patient</span>
                                    <strong>{getPatientName(selectedPrescription)}</strong>
                                </div>
                                <div className="info-item">
                                    <span>Doctor</span>
                                    <strong>{getDoctorName(selectedPrescription)}</strong>
                                </div>
                                <div className="info-item">
                                    <span>Diagnosis</span>
                                    <strong>{getDiagnosis(selectedPrescription)}</strong>
                                </div>
                                <div className="info-item">
                                    <span>Prescription Date</span>
                                    <strong>
                                        {formatDate(
                                            selectedPrescription.prescriptionDate ||
                                            selectedPrescription.createdAt
                                        )}
                                    </strong>
                                </div>
                            </div>

                            {/* Prescribed Medicines Section */}
                            <div className="prescription-medicines-section">
                                <div className="section-subtitle">
                                    <h4>Prescribed Medicines ({selectedPrescription.medicines?.length || 0})</h4>
                                    {selectedPrescription.dispensingStatus !== "dispensed" && (
                                        <p>Enter the quantity of each medicine to dispense from inventory.</p>
                                    )}
                                </div>

                                <div className="medicines-card-list">
                                    {selectedPrescription.medicines?.map((medicine, index) => {
                                        const medicineKey = `${medicine.medicineName}-${index}`;
                                        const isDispensed =
                                            selectedPrescription.dispensingStatus === "dispensed";

                                        return (
                                            <div
                                                className="medicine-detail-card"
                                                key={medicineKey}
                                            >
                                                <div className="medicine-info-col">
                                                    <h5>{medicine.medicineName}</h5>
                                                    <div className="medicine-specs">
                                                        <span><strong>Dosage:</strong> {medicine.dosage}</span>
                                                        <span><strong>Frequency:</strong> {medicine.frequency}</span>
                                                        <span><strong>Duration:</strong> {medicine.duration}</span>
                                                    </div>
                                                    {medicine.instructions && (
                                                        <div className="medicine-note">
                                                            <strong>Instructions:</strong> {medicine.instructions}
                                                        </div>
                                                    )}
                                                </div>

                                                {!isDispensed && (
                                                    <div className="dispense-input-col">
                                                        <label>Dispense Qty *</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={dispenseQuantities[medicineKey] || ""}
                                                            onChange={(e) =>
                                                                handleQuantityChange(
                                                                    medicineKey,
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Qty"
                                                            disabled={dispensing}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Additional Instructions */}
                            {selectedPrescription.additionalInstructions && (
                                <div className="instructions-box">
                                    <strong>Additional Instructions:</strong>
                                    <p>{selectedPrescription.additionalInstructions}</p>
                                </div>
                            )}

                            {/* Dispensed Notice */}
                            {selectedPrescription.dispensingStatus === "dispensed" && (
                                <div className="dispensed-banner">
                                    <span className="badge-emerald">Dispensed</span>
                                    <div>
                                        <strong>Prescription has been dispensed</strong>
                                        <p>
                                            Dispensed on {formatDate(selectedPrescription.dispensedAt)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={closePrescription}
                                disabled={dispensing}
                            >
                                Close
                            </button>

                            {selectedPrescription.dispensingStatus !== "dispensed" && (
                                <button
                                    type="button"
                                    className="btn-dispense"
                                    onClick={handleDispense}
                                    disabled={dispensing}
                                >
                                    {dispensing
                                        ? "Dispensing..."
                                        : "Dispense Prescription"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacistPrescriptionManagement;