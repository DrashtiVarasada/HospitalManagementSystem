import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./PharmacistLayout.css";

const PharmacistLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="pharmacist-layout">
            {/* Sidebar */}
            <aside className="pharmacist-sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">+</div>
                    <div>
                        <h2>SmartCare AI</h2>
                        <span>Pharmacist</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/pharmacist"
                        end
                        className={({ isActive }) =>
                            isActive ? "nav-item active" : "nav-item"
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/pharmacist/medicines"
                        className={({ isActive }) =>
                            isActive ? "nav-item active" : "nav-item"
                        }
                    >
                        Medicines
                    </NavLink>

                    <NavLink
                        to="/pharmacist/prescriptions"
                        className={({ isActive }) =>
                            isActive ? "nav-item active" : "nav-item"
                        }
                    >
                        Prescriptions
                    </NavLink>
                </nav>

                <div className="sidebar-bottom">
                    <div className="pharmacist-user">
                        <strong>{user?.name || "Pharmacist"}</strong>
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
            <main className="pharmacist-main">
                <header className="pharmacist-topbar">
                    <div>
                        <h1>Pharmacist Panel</h1>
                        <p>Hospital Management System</p>
                    </div>
                </header>

                <div className="pharmacist-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default PharmacistLayout;