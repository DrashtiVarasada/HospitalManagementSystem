import { useEffect, useState } from "react";
import api from "../services/api";
import "./ManagerDashboard.css";

const ManagerDashboard = () => {

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get("/dashboard");

                setDashboard(response.data);
            } catch (error) {
                console.error("Dashboard error:", error);

                setError(
                    error.response?.data?.message ||
                    "Failed to load dashboard data."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    

    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                {error}
            </div>
        );
    }

    return (
        <div className="manager-dashboard">

            

            {/* Welcome */}
            <section className="welcome-section">
                <h2>Welcome, Manager 👋</h2>
                <p>
                    Here's an overview of your hospital.
                </p>
            </section>

            {/* Main Statistics */}
            <section className="stats-grid">

                <div className="stat-card">
                    <h3>Total Patients</h3>
                    <strong>
                        {dashboard?.patients?.total ?? 0}
                    </strong>
                </div>

                <div className="stat-card">
                    <h3>Total Doctors</h3>
                    <strong>
                        {dashboard?.doctors?.total ?? 0}
                    </strong>
                </div>

                <div className="stat-card">
                    <h3>Total Staff</h3>
                    <strong>
                        {dashboard?.staff?.total ?? 0}
                    </strong>
                </div>

                <div className="stat-card">
                    <h3>Total Appointments</h3>
                    <strong>
                        {dashboard?.appointments?.total ?? 0}
                    </strong>
                </div>

            </section>

            {/* Second Row */}
            <section className="dashboard-grid">

                <div className="dashboard-card">
                    <h3>Appointments</h3>

                    <p>
                        Waiting:
                        <strong>
                            {dashboard?.appointments?.waiting ?? 0}
                        </strong>
                    </p>

                    <p>
                        Completed:
                        <strong>
                            {dashboard?.appointments?.completed ?? 0}
                        </strong>
                    </p>

                    <p>
                        Cancelled:
                        <strong>
                            {dashboard?.appointments?.cancelled ?? 0}
                        </strong>
                    </p>
                </div>

                <div className="dashboard-card">
                    <h3>Rooms</h3>

                    <p>
                        Total:
                        <strong>
                            {dashboard?.rooms?.total ?? 0}
                        </strong>
                    </p>

                    <p>
                        Available:
                        <strong>
                            {dashboard?.rooms?.available ?? 0}
                        </strong>
                    </p>

                    <p>
                        Occupied:
                        <strong>
                            {dashboard?.rooms?.occupied ?? 0}
                        </strong>
                    </p>

                    <p>
                        Maintenance:
                        <strong>
                            {dashboard?.rooms?.maintenance ?? 0}
                        </strong>
                    </p>
                </div>

                <div className="dashboard-card">
                    <h3>Medicines</h3>

                    <p>
                        Total Medicines:
                        <strong>
                            {dashboard?.medicines?.total ?? 0}
                        </strong>
                    </p>

                    <p>
                        Low Stock:
                        <strong>
                            {dashboard?.medicines?.lowStock ?? 0}
                        </strong>
                    </p>
                </div>

            </section>

            {/* Finance */}
            <section className="finance-section">

                <h2>Finance Overview</h2>

                <div className="finance-grid">

                    <div className="finance-card">
                        <span>Total Revenue</span>
                        <strong>
                            ₹{dashboard?.finance?.totalRevenue ?? 0}
                        </strong>
                    </div>

                    <div className="finance-card">
                        <span>Total Expenses</span>
                        <strong>
                            ₹{dashboard?.finance?.totalExpenses ?? 0}
                        </strong>
                    </div>

                    <div className="finance-card">
                        <span>Net Income</span>
                        <strong>
                            ₹{dashboard?.finance?.netIncome ?? 0}
                        </strong>
                    </div>

                </div>

            </section>

        </div>
    );
};

export default ManagerDashboard;