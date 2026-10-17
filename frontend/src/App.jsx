import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import ManagerLayout from "./layouts/ManagerLayout";
import ManagerDashboard from "./pages/ManagerDashboard";
import StaffManagement from "./pages/StaffManagement";
import DoctorManagement from "./pages/DoctorManagement";
import PatientManagement from "./pages/PatientManagement";
import ManagerRoomManagement from "./pages/ManagerRoomManagement";
import ManagerAppointmentManagement from "./pages/ManagerAppointmentManagement";
import ManagerFinanceManagement from "./pages/ManagerFinanceManagement";

import ReceptionistLayout from "./layouts/ReceptionistLayout";
import ReceptionistPatientManagement from "./pages/ReceptionistPatientManagement";
import ReceptionistAppointmentManagement from "./pages/ReceptionistAppointmentManagement";
import ReceptionistRoomManagement from "./pages/ReceptionistRoomManagement";
import ReceptionistMedicalRecordManagement from "./pages/ReceptionistMedicalRecordManagement";

import DoctorLayout from "./layouts/DoctorLayout";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorMedicalRecordManagement from "./pages/DoctorMedicalRecordManagement";
import DoctorPrescriptionManagement from "./pages/DoctorPrescriptionManagement";

import PharmacistLayout from "./layouts/PharmacistLayout";
import PharmacistDashboard from "./pages/PharmacistDashboard";
import PharmacistMedicineManagement
    from "./pages/PharmacistMedicineManagement";
import PharmacistPrescriptionManagement
    from "./pages/PharmacistPrescriptionManagement";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>

                {/* =========================
                    LOGIN
                ========================= */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* =========================
                    MANAGER
                ========================= */}

                <Route
                    path="/manager"
                    element={
                        <ProtectedRoute
                            allowedRoles={["manager"]}
                        >
                            <ManagerLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        index
                        element={<ManagerDashboard />}
                    />

                    <Route
                        path="staff"
                        element={<StaffManagement />}
                    />

                    <Route
                        path="doctors"
                        element={<DoctorManagement />}
                    />

                    <Route
                        path="patients"
                        element={<PatientManagement />}
                    />

                    <Route
                        path="appointments"
                        element={<ManagerAppointmentManagement />}
                    />

                    <Route
                        path="rooms"
                        element={<ManagerRoomManagement />}
                    />

                    <Route
                        path="finance"
                        element={<ManagerFinanceManagement />}
                    />
                </Route>


                {/* =========================
                    RECEPTIONIST
                ========================= */}

                <Route
                    path="/receptionist"
                    element={
                        <ProtectedRoute
                            allowedRoles={["receptionist"]}
                        >
                            <ReceptionistLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        index
                        element={
                            <h2>
                                Receptionist Dashboard
                            </h2>
                        }
                    />

                    <Route
                        path="patients"
                        element={
                            <ReceptionistPatientManagement />
                        }
                    />

                    <Route
                        path="appointments"
                        element={
                            <ReceptionistAppointmentManagement />
                        }
                    />

                    <Route
                        path="rooms"
                        element={
                            <ReceptionistRoomManagement />
                        }
                    />

                    <Route
                        path="medical-records"
                        element={
                            <ReceptionistMedicalRecordManagement />
                        }
                    />

                    <Route
                        path="prescriptions"
                        element={
                            <h2>
                                Prescriptions
                            </h2>
                        }
                    />
                </Route>


                {/* =========================
                    DOCTOR
                ========================= */}

                <Route
                    path="/doctor"
                    element={
                        <ProtectedRoute
                            allowedRoles={["doctor"]}
                        >
                            <DoctorLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        index
                        element={<DoctorDashboard />}
                    />

                    <Route
                        path="medical-records"
                        element={
                            <DoctorMedicalRecordManagement />
                        }
                    />

                    <Route
                        path="prescriptions"
                        element={
                            <DoctorPrescriptionManagement />
                        }
                    />
                </Route>


                {/* =========================
                    PHARMACIST
                ========================= */}

                <Route
                    path="/pharmacist"
                    element={
                        <ProtectedRoute
                            allowedRoles={["pharmacist"]}
                        >
                            <PharmacistLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        index
                        element={
                            <PharmacistDashboard />
                        }
                    />

                    <Route
                        path="medicines"
                        element={
                            <PharmacistMedicineManagement />
                        }
                    />

                    <Route
                        path="prescriptions"
                        element={
                            <PharmacistPrescriptionManagement />
                        }
                    />
                </Route>


                {/* =========================
                    INVALID ROUTE
                ========================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
};

export default App;