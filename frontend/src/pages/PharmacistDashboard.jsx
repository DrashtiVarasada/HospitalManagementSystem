import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PharmacistDashboard.css";

const PharmacistDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalMedicines: 0,
        lowStock: 0,
        expiringSoon: 0,
        expired: 0
    });

    const [allPrescriptions, setAllPrescriptions] = useState([]);
    const [recentPrescriptions, setRecentPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                medicinesResponse,
                lowStockResponse,
                expiringResponse,
                expiredResponse,
                prescriptionsResponse
            ] = await Promise.all([
                api.get("/medicines"),
                api.get("/medicines/low-stock"),
                api.get("/medicines/expiring"),
                api.get("/medicines/expired"),
                api.get("/prescriptions")
            ]);

            const medicines = medicinesResponse.data?.medicines || [];
            const lowStock = lowStockResponse.data?.medicines || [];
            const expiring = expiringResponse.data?.medicines || [];
            const expired = expiredResponse.data?.medicines || [];
            const prescriptions = prescriptionsResponse.data?.prescriptions || [];

            setStats({
                totalMedicines: medicines.length,
                lowStock: lowStock.length,
                expiringSoon: expiring.length,
                expired: expired.length
            });

            setAllPrescriptions(prescriptions);

            const sortedPrescriptions = [...prescriptions]
                .sort(
                    (a, b) =>
                        new Date(b.prescriptionDate || b.createdAt) -
                        new Date(a.prescriptionDate || a.createdAt)
                )
                .slice(0, 5);

            setRecentPrescriptions(sortedPrescriptions);
        } catch (err) {
            console.error("Error loading pharmacist dashboard:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    };

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
        if (!prescription?.patient || typeof prescription.patient === "string") return "";
        return prescription.patient.phone || "";
    };

    const getDoctorName = (prescription) => {
        if (!prescription?.doctor) return "Unknown Doctor";
        if (typeof prescription.doctor === "string") return prescription.doctor;
        return prescription.doctor.name || "Unknown Doctor";
    };

    const getMedicineCount = (prescription) => {
        return prescription?.medicines?.length || 0;
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

    const pendingPrescriptionsCount = allPrescriptions.filter(
        (p) => (p.dispensingStatus || "pending") === "pending"
    ).length;

    const dispensedPrescriptionsCount = allPrescriptions.filter(
        (p) => p.dispensingStatus === "dispensed"
    ).length;

    const normalStockCount = Math.max(
        0,
        stats.totalMedicines - stats.lowStock - stats.expired
    );

    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="manager-dashboard">
            {/* Welcome Section */}
            <section className="welcome-section">
                <h2>Pharmacist Dashboard</h2>
                <p>
                    Here is an overview of pharmacy inventory, low-stock warnings, expiring medicines, and doctor prescriptions.
                </p>
            </section>

            {/* Error Message */}
            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            {/* Main Statistics Grid (With clean colors at right places, matching Manager/Doctor theme) */}
            <section className="stats-grid">
                <div className="stat-card border-blue">
                    <h3>Total Medicines</h3>
                    <strong className="text-blue">{stats.totalMedicines}</strong>
                    <span className="stat-sub">Active inventory items</span>
                </div>

                <div className="stat-card border-amber">
                    <h3>Low Stock Alerts</h3>
                    <strong className="text-amber">{stats.lowStock}</strong>
                    <span className="stat-sub">Items at or below reorder level</span>
                </div>

                <div className="stat-card border-purple">
                    <h3>Expiring Soon</h3>
                    <strong className="text-purple">{stats.expiringSoon}</strong>
                    <span className="stat-sub">Expiring within 30 days</span>
                </div>

                <div className="stat-card border-red">
                    <h3>Expired Medicines</h3>
                    <strong className="text-red">{stats.expired}</strong>
                    <span className="stat-sub">Requires removal or disposal</span>
                </div>
            </section>

            {/* Second Row Grid */}
            <section className="dashboard-grid">
                <div className="dashboard-card">
                    <h3>Prescription Queue</h3>
                    <p>
                        <span>Pending Dispense:</span>
                        <strong className="badge-amber">{pendingPrescriptionsCount}</strong>
                    </p>
                    <p>
                        <span>Dispensed:</span>
                        <strong className="badge-emerald">{dispensedPrescriptionsCount}</strong>
                    </p>
                    <p>
                        <span>Total Prescriptions:</span>
                        <strong>{allPrescriptions.length}</strong>
                    </p>
                </div>

                <div className="dashboard-card">
                    <h3>Stock Health</h3>
                    <p>
                        <span>Normal In-Stock:</span>
                        <strong className="badge-emerald">{normalStockCount}</strong>
                    </p>
                    <p>
                        <span>Low Stock Items:</span>
                        <strong className="badge-amber">{stats.lowStock}</strong>
                    </p>
                    <p>
                        <span>Expired Medicines:</span>
                        <strong className="badge-red">{stats.expired}</strong>
                    </p>
                </div>

                <div className="dashboard-card">
                    <h3>Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                        <button
                            type="button"
                            className="btn-quick-primary"
                            onClick={() => navigate("/pharmacist/medicines")}
                        >
                            Manage Medicines
                        </button>
                        <button
                            type="button"
                            className="btn-quick-secondary"
                            onClick={() => navigate("/pharmacist/prescriptions")}
                        >
                            View Prescriptions
                        </button>
                    </div>
                </div>
            </section>

            {/* Recent Prescriptions Table Card */}
            <section className="dashboard-section-box">
                <div className="section-box-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Recent Prescriptions</h3>
                        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
                            Latest doctor prescriptions awaiting or completed dispensing
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            type="button"
                            className="btn-refresh"
                            onClick={fetchDashboardData}
                        >
                            Refresh
                        </button>
                        <button
                            type="button"
                            className="btn-link"
                            onClick={() => navigate("/pharmacist/prescriptions")}
                        >
                            View All
                        </button>
                    </div>
                </div>

                {recentPrescriptions.length === 0 ? (
                    <div className="empty-state-box">
                        <h4>No Prescriptions Found</h4>
                        <p>Doctor prescriptions will appear here once created.</p>
                    </div>
                ) : (
                    <div className="table-responsive" style={{ marginTop: "16px" }}>
                        <table className="pharmacist-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Medicines</th>
                                    <th>Prescription Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPrescriptions.map((prescription) => (
                                    <tr key={prescription._id}>
                                        <td>
                                            <strong>{getPatientName(prescription)}</strong>
                                            {getPatientPhone(prescription) && (
                                                <small>{getPatientPhone(prescription)}</small>
                                            )}
                                        </td>
                                        <td>{getDoctorName(prescription)}</td>
                                        <td>
                                            <span className="medicine-pill">
                                                {getMedicineCount(prescription)}{" "}
                                                {getMedicineCount(prescription) === 1 ? "medicine" : "medicines"}
                                            </span>
                                        </td>
                                        <td>
                                            {formatDate(
                                                prescription.prescriptionDate || prescription.createdAt
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`status-pill ${
                                                    prescription.dispensingStatus === "dispensed"
                                                        ? "pill-completed"
                                                        : "pill-waiting"
                                                }`}
                                            >
                                                {prescription.dispensingStatus === "dispensed"
                                                    ? "Dispensed"
                                                    : "Pending"}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-action-view"
                                                onClick={() => navigate("/pharmacist/prescriptions")}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default PharmacistDashboard;