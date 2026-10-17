import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await login(email, password);

            const role = response.user.role;

            if (role === "manager") {
                navigate("/manager");
            } else if (role === "receptionist") {
                navigate("/receptionist");
            } else if (role === "doctor") {
                navigate("/doctor");
            } else if (role === "pharmacist") {
                navigate("/pharmacist");
            } else {
                setError("Invalid user role.");
            }

        } catch (error) {
            console.error("Login error:", error);

            if (error.response) {
                setError(
                    error.response.data?.message ||
                    "Invalid email or password."
                );
            } else if (error.request) {
                setError(
                    "Cannot connect to the server. Please make sure the backend is running."
                );
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <div className="login-header">

                    <div className="logo-circle">
                        +
                    </div>

                    <h1>SmartCare AI</h1>

                    <p>
                        Hospital Management System
                    </p>

                </div>

                <div className="login-title">
                    <h2>Welcome Back</h2>

                    <p>
                        Login to your account
                    </p>
                </div>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter your email"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />

                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <div className="login-footer">
                    <p>
                        Authorized hospital staff only
                    </p>
                </div>

            </div>

        </div>
    );
};

export default Login;