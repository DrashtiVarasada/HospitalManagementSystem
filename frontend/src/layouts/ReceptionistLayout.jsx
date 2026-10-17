import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ReceptionistLayout.css";

const ReceptionistLayout = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="receptionist-layout">

            {/* SIDEBAR */}
            <aside className="receptionist-sidebar">

                {/* LOGO */}
                <div className="receptionist-logo">
                    <h2>SmartCare AI</h2>
                    <p>Receptionist Panel</p>
                </div>

                {/* NAVIGATION */}
                <nav className="receptionist-nav">

                    <NavLink
                        to="/receptionist"
                        end
                        className={({ isActive }) =>
                            isActive
                                ? "receptionist-nav-link active"
                                : "receptionist-nav-link"
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/receptionist/patients"
                        className={({ isActive }) =>
                            isActive
                                ? "receptionist-nav-link active"
                                : "receptionist-nav-link"
                        }
                    >
                        Patients
                    </NavLink>

                    <NavLink
                        to="/receptionist/appointments"
                        className={({ isActive }) =>
                            isActive
                                ? "receptionist-nav-link active"
                                : "receptionist-nav-link"
                        }
                    >
                        Appointments
                    </NavLink>

                    <NavLink
                        to="/receptionist/rooms"
                        className={({ isActive }) =>
                            isActive
                                ? "receptionist-nav-link active"
                                : "receptionist-nav-link"
                        }
                    >
                        Rooms
                    </NavLink>

                    <NavLink
                        to="/receptionist/medical-records"
                        className={({ isActive }) =>
                            isActive
                                ? "receptionist-nav-link active"
                                : "receptionist-nav-link"
                        }
                    >
                        Medical Records
                    </NavLink>

                    <NavLink
                        to="/receptionist/prescriptions"
                        className={({ isActive }) =>
                            isActive
                                ? "receptionist-nav-link active"
                                : "receptionist-nav-link"
                        }
                    >
                        Prescriptions
                    </NavLink>

                </nav>

                {/* LOGOUT */}
                <button
                    className="receptionist-logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </aside>

            {/* MAIN CONTENT */}
            <main className="receptionist-main">

                {/* TOP BAR */}
                <header className="receptionist-topbar">
                    <div>
                        <h3>Receptionist Panel</h3>

                        <p>
                            Manage patients and hospital operations
                        </p>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <section className="receptionist-content">
                    <Outlet />
                </section>

            </main>

        </div>
    );
};

export default ReceptionistLayout;