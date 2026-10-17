import { useEffect, useState } from "react";
import api from "../services/api";
import "./StaffManagement.css";

const emptyForm = {
    name: "",
    designation: "",
    department: "",
    phone: "",
    joiningDate: "",
    salary: "",
    status: "active"
};

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const [accountStaff, setAccountStaff] = useState(null);
    const [accountForm, setAccountForm] = useState({
        email: "",
        password: "",
        role: ""
    });

    const [accountSaving, setAccountSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchStaff = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/staff");
            setStaff(response.data.staff || response.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to fetch staff."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (editingId) {
                await api.put(`/staff/${editingId}`, form);
                setSuccess("Staff updated successfully.");
            } else {
                await api.post("/staff", form);
                setSuccess("Staff created successfully.");
            }

            setForm(emptyForm);
            setEditingId(null);

            await fetchStaff();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to save staff."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (member) => {
        setEditingId(member._id);

        setForm({
            name: member.name || "",
            designation: member.designation || "",
            department: member.department || "",
            phone: member.phone || "",
            joiningDate: member.joiningDate
                ? member.joiningDate.split("T")[0]
                : "",
            salary: member.salary || "",
            status: member.status || "active"
        });

        setError("");
        setSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this staff member?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(`/staff/${id}`);

            setSuccess("Staff deleted successfully.");

            if (editingId === id) {
                setEditingId(null);
                setForm(emptyForm);
            }

            if (accountStaff?._id === id) {
                setAccountStaff(null);
            }

            await fetchStaff();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete staff."
            );
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
    };

    const openAccountForm = (member) => {
        const designation = member.designation
            ?.toLowerCase()
            .trim();

        const roleMap = {
            manager: "manager",
            receptionist: "receptionist",
            doctor: "doctor",
            pharmacist: "pharmacist"
        };

        if (!roleMap[designation]) {
            setError(
                "Login account can only be created for Manager, Receptionist, Doctor, or Pharmacist."
            );
            return;
        }

        setAccountStaff(member);

        setAccountForm({
            email: "",
            password: "",
            role: roleMap[designation]
        });

        setError("");
        setSuccess("");
    };

    const handleAccountChange = (e) => {
        setAccountForm({
            ...accountForm,
            [e.target.name]: e.target.value
        });
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();

        if (!accountStaff) {
            return;
        }

        try {
            setAccountSaving(true);
            setError("");
            setSuccess("");

            await api.post("/auth/register", {
                staff: accountStaff._id,
                email: accountForm.email,
                password: accountForm.password,
                role: accountForm.role
            });

            setSuccess(
                `Login account created successfully for ${accountStaff.name}.`
            );

            setAccountStaff(null);

            setAccountForm({
                email: "",
                password: "",
                role: ""
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to create login account."
            );
        } finally {
            setAccountSaving(false);
        }
    };

    return (
        <div className="staff-page">

            <div className="page-heading">
                <h2>Staff Management</h2>
                <p>
                    Manage hospital staff members and login accounts.
                </p>
            </div>

            {error && (
                <div className="staff-message error">
                    {error}
                </div>
            )}

            {success && (
                <div className="staff-message success">
                    {success}
                </div>
            )}

            {/* Staff Form */}
            <div className="staff-form-card">

                <div className="section-title">
                    <h3>
                        {editingId
                            ? "Edit Staff"
                            : "Add Staff"}
                    </h3>

                    <span>
                        Staff information
                    </span>
                </div>

                <form onSubmit={handleSubmit}>

                    <div className="staff-form-grid">

                        <div className="form-field">
                            <label>Name</label>

                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Designation</label>

                            <input
                                type="text"
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                                placeholder="Doctor / Nurse / Cleaner..."
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Department</label>

                            <input
                                type="text"
                                name="department"
                                value={form.department}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Phone</label>

                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Joining Date</label>

                            <input
                                type="date"
                                name="joiningDate"
                                value={form.joiningDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Salary</label>

                            <input
                                type="number"
                                name="salary"
                                value={form.salary}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="form-field">
                            <label>Status</label>

                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                            >
                                <option value="active">
                                    Active
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </div>

                    </div>

                    <div className="form-actions">

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Update Staff"
                                    : "Add Staff"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </button>
                        )}

                    </div>

                </form>
            </div>

            {/* Account Form */}
            {accountStaff && (
                <div className="account-form-card">

                    <div className="section-title">

                        <h3>
                            Create Login Account
                        </h3>

                        <button
                            type="button"
                            className="close-account-button"
                            onClick={() => {
                                setAccountStaff(null);
                                setAccountForm({
                                    email: "",
                                    password: "",
                                    role: ""
                                });
                            }}
                        >
                            ×
                        </button>

                    </div>

                    <p className="account-info">
                        Create a login account for{" "}
                        <strong>
                            {accountStaff.name}
                        </strong>{" "}
                        ({accountStaff.designation}).
                    </p>

                    <form onSubmit={handleCreateAccount}>

                        <div className="staff-form-grid">

                            <div className="form-field">
                                <label>Email</label>

                                <input
                                    type="email"
                                    name="email"
                                    value={accountForm.email}
                                    onChange={handleAccountChange}
                                    placeholder="Enter login email"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Password</label>

                                <input
                                    type="password"
                                    name="password"
                                    value={accountForm.password}
                                    onChange={handleAccountChange}
                                    placeholder="Enter password"
                                    minLength="8"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Role</label>

                                <input
                                    type="text"
                                    value={accountForm.role}
                                    readOnly
                                />
                            </div>

                        </div>

                        <div className="form-actions">

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={accountSaving}
                            >
                                {accountSaving
                                    ? "Creating..."
                                    : "Create Account"}
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    setAccountStaff(null);
                                    setAccountForm({
                                        email: "",
                                        password: "",
                                        role: ""
                                    });
                                }}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* Staff Table */}
            <div className="staff-table-card">

                <div className="section-title">

                    <h3>All Staff</h3>

                    <span>
                        {staff.length} staff member
                        {staff.length !== 1 ? "s" : ""}
                    </span>

                </div>

                <div className="table-container">

                    {loading ? (
                        <div className="table-loading">
                            Loading staff...
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="empty-state">
                            No staff members found.
                        </div>
                    ) : (
                        <table>

                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Designation</th>
                                    <th>Department</th>
                                    <th>Phone</th>
                                    <th>Joining Date</th>
                                    <th>Salary</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {staff.map((member) => {

                                    const designation = member.designation
                                        ?.toLowerCase()
                                        .trim();

                                    const canCreateAccount = [
                                        "manager",
                                        "receptionist",
                                        "doctor",
                                        "pharmacist"
                                    ].includes(designation) && !member.hasAccount;

                                    return (
                                        <tr key={member._id}>

                                            <td>
                                                <strong>
                                                    {member.name}
                                                </strong>
                                            </td>

                                            <td>
                                                {member.designation || "-"}
                                            </td>

                                            <td>
                                                {member.department || "-"}
                                            </td>

                                            <td>
                                                {member.phone || "-"}
                                            </td>

                                            <td>
                                                {member.joiningDate
                                                    ? new Date(
                                                        member.joiningDate
                                                    ).toLocaleDateString()
                                                    : "-"}
                                            </td>

                                            <td>
                                                {member.salary !== undefined &&
                                                member.salary !== null
                                                    ? `₹${member.salary}`
                                                    : "-"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`status ${
                                                        member.status ===
                                                        "active"
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >
                                                    {member.status || "inactive"}
                                                </span>
                                            </td>

                                            <td>

                                                <div className="action-buttons">

                                                    <button
                                                        className="edit-button"
                                                        onClick={() =>
                                                            handleEdit(member)
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                member._id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                    {canCreateAccount && (
                                                        <button
                                                            className="account-button"
                                                            onClick={() =>
                                                                openAccountForm(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            Account
                                                        </button>
                                                    )}

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>
                    )}

                </div>

            </div>

        </div>
    );
};

export default StaffManagement;