import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./DoctorLayout.css";

const DoctorLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [doctorProfile, setDoctorProfile] = useState(null);

    useEffect(() => {
        const fetchDoctorProfile = async () => {
            try {
                const response = await api.get("/doctors/me");
                setDoctorProfile(response.data.doctor);
            } catch (error) {
                console.error("Could not fetch doctor profile:", error);
            }
        };

        fetchDoctorProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const rawDoctorName = doctorProfile?.name || user?.name || "Doctor";
    const doctorName = rawDoctorName.replace(/^Dr\.\s*/i, "").trim() || "Doctor";

    return (
        <div className="doctor-layout">
            {/* Sidebar */}
            <aside className="doctor-sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">+</div>
                    <div>
                        <h2>SmartCare AI</h2>
                        <span>Doctor</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/doctor"
                        end
                        className={({ isActive }) =>
                            isActive ? "nav-item active" : "nav-item"
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/doctor/medical-records"
                        className={({ isActive }) =>
                            isActive ? "nav-item active" : "nav-item"
                        }
                    >
                        Medical Records
                    </NavLink>

                    <NavLink
                        to="/doctor/prescriptions"
                        className={({ isActive }) =>
                            isActive ? "nav-item active" : "nav-item"
                        }
                    >
                        Prescriptions
                    </NavLink>
                </nav>

                <div className="sidebar-bottom">
                    <div className="doctor-user">
                        <strong>Dr. {doctorName}</strong>
                        <span>{user?.email}</span>
                    </div>

                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="doctor-main">
                <header className="doctor-topbar">
                    <div>
                        <h1>Doctor Panel</h1>
                        <p>Hospital Management System</p>
                    </div>
                </header>

                <div className="doctor-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DoctorLayout;