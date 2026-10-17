import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ManagerLayout.css";

const ManagerLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="manager-layout">

            {/* Sidebar */}
            <aside className="manager-sidebar">

                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        +
                    </div>

                    <div>
                        <h2>SmartCare AI</h2>
                        <span>Manager</span>
                    </div>
                </div>

                <nav className="sidebar-nav">

                    <NavLink
                        to="/manager"
                        end
                        className={({ isActive }) =>
                            isActive
                                ? "nav-item active"
                                : "nav-item"
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/manager/staff"
                        className="nav-item"
                    >
                        Staff
                    </NavLink>

                    <NavLink
                        to="/manager/doctors"
                        className="nav-item"
                    >
                        Doctors
                    </NavLink>

                    <NavLink
                        to="/manager/patients"
                        className="nav-item"
                    >
                        Patients
                    </NavLink>

                    <NavLink
                        to="/manager/appointments"
                        className="nav-item"
                    >
                        Appointments
                    </NavLink>

                    <NavLink
                        to="/manager/rooms"
                        className="nav-item"
                    >
                        Rooms
                    </NavLink>

                    <NavLink
                        to="/manager/finance"
                        className="nav-item"
                    >
                        Finance
                    </NavLink>

                </nav>

                <div className="sidebar-bottom">

                    <div className="manager-user">
                        <strong>Manager</strong>
                        <span>{user?.email}</span>
                    </div>

                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </aside>

            {/* Main Content */}
            <main className="manager-main">

                <header className="manager-topbar">

                    <div>
                        <h1>Manager Panel</h1>
                        <p>Hospital Management System</p>
                    </div>

                </header>

                <div className="manager-content">
                    <Outlet />
                </div>

            </main>

        </div>
    );
};

export default ManagerLayout;