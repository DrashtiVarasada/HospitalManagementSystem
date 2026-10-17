import { useEffect, useState } from "react";
import api from "../services/api";
import "./DoctorManagement.css";

const emptyForm = {
    user: "",
    name: "",
    specialization: "",
    qualification: "",
    experience: "",
    phone: "",
    consultationFee: "",
    days: [],
    startTime: "",
    endTime: ""
};

const DoctorManagement = () => {
    const [doctors, setDoctors] = useState([]);
    const [doctorUsers, setDoctorUsers] = useState([]);

    const [form, setForm] = useState(emptyForm);

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];


    // FETCH ALL DOCTORS
    const fetchDoctors = async () => {
        try {
            setLoading(true);

            const response = await api.get("/doctors");

            setDoctors(
                response.data.doctors || []
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to fetch doctors."
            );

        } finally {
            setLoading(false);
        }
    };


    // FETCH AVAILABLE DOCTOR ACCOUNTS
    const fetchDoctorUsers = async () => {
        try {
            const response = await api.get(
                "/auth/doctor-users"
            );

            setDoctorUsers(
                response.data.doctorUsers || []
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to fetch doctor accounts."
            );
        }
    };


    // INITIAL LOAD
    useEffect(() => {
        fetchDoctors();
        fetchDoctorUsers();
    }, []);


    // HANDLE NORMAL INPUT CHANGE
    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    };


    // HANDLE DOCTOR ACCOUNT SELECTION
    const handleDoctorAccountChange = (e) => {
        const selectedUserId = e.target.value;

        const selectedDoctorUser =
            doctorUsers.find(
                (doctorUser) =>
                    doctorUser._id === selectedUserId
            );

        if (!selectedDoctorUser) {
            setForm({
                ...form,
                user: "",
                name: "",
                phone: ""
            });

            return;
        }

        setForm({
            ...form,

            user: selectedDoctorUser._id,

            // Automatically get name from Staff
            name:
                selectedDoctorUser.staff?.name || "",

            // Automatically get phone from Staff
            phone:
                selectedDoctorUser.staff?.phone || ""
        });
    };


    // HANDLE DAY SELECTION
    const handleDayChange = (day) => {
        setForm((previousForm) => {

            const alreadySelected =
                previousForm.days.includes(day);

            if (alreadySelected) {
                return {
                    ...previousForm,

                    days:
                        previousForm.days.filter(
                            (item) =>
                                item !== day
                        )
                };
            }

            return {
                ...previousForm,

                days: [
                    ...previousForm.days,
                    day
                ]
            };
        });
    };


    // OPEN ADD FORM
    const openAddForm = () => {
        setForm(emptyForm);

        setEditingId(null);
        setShowForm(true);

        setError("");
        setSuccess("");
    };


    // EDIT DOCTOR
    const handleEdit = (doctor) => {
        setEditingId(doctor._id);
        setShowForm(true);

        setError("");
        setSuccess("");

        setForm({
            user:
                doctor.user?._id ||
                doctor.user ||
                "",

            name:
                doctor.name || "",

            specialization:
                doctor.specialization || "",

            qualification:
                doctor.qualification || "",

            experience:
                doctor.experience ?? "",

            phone:
                doctor.phone || "",

            consultationFee:
                doctor.consultationFee ?? "",

            days:
                doctor.availability?.days || [],

            startTime:
                doctor.availability?.startTime ||
                "",

            endTime:
                doctor.availability?.endTime ||
                ""
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // CANCEL FORM
    const handleCancel = () => {
        setForm(emptyForm);

        setEditingId(null);
        setShowForm(false);

        setError("");
        setSuccess("");
    };


    // SUBMIT DOCTOR
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            setError("");
            setSuccess("");

            const doctorData = {
                user: form.user,

                name: form.name,

                specialization:
                    form.specialization,

                qualification:
                    form.qualification,

                experience:
                    Number(form.experience),

                phone: form.phone,

                consultationFee:
                    Number(form.consultationFee),

                availability: {
                    days: form.days,

                    startTime:
                        form.startTime,

                    endTime:
                        form.endTime
                }
            };


            if (editingId) {

                await api.put(
                    `/doctors/${editingId}`,
                    doctorData
                );

                setSuccess(
                    "Doctor updated successfully."
                );

            } else {

                await api.post(
                    "/doctors",
                    doctorData
                );

                setSuccess(
                    "Doctor created successfully."
                );
            }


            setForm(emptyForm);

            setEditingId(null);
            setShowForm(false);

            await fetchDoctors();
            await fetchDoctorUsers();

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Failed to save doctor."
            );

        } finally {
            setSaving(false);
        }
    };


    // DELETE DOCTOR
    const handleDelete = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this doctor profile?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await api.delete(
                `/doctors/${id}`
            );

            setSuccess(
                "Doctor deleted successfully."
            );

            await fetchDoctors();
            await fetchDoctorUsers();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete doctor."
            );
        }
    };


    return (
        <div className="doctor-page">

            {/* PAGE HEADING */}
            <div className="doctor-page-heading">

                <div>

                    <h2>
                        Doctor Management
                    </h2>

                    <p>
                        Manage doctor profiles
                        and availability.
                    </p>

                </div>

                {!showForm && (
                    <button
                        className="doctor-primary-button"
                        onClick={openAddForm}
                    >
                        + Add Doctor
                    </button>
                )}

            </div>


            {/* ERROR MESSAGE */}
            {error && (
                <div className="doctor-message error">
                    {error}
                </div>
            )}


            {/* SUCCESS MESSAGE */}
            {success && (
                <div className="doctor-message success">
                    {success}
                </div>
            )}


            {/* ADD / EDIT FORM */}
            {showForm && (
                <div className="doctor-form-card">

                    <div className="doctor-section-title">

                        <div>

                            <h3>
                                {editingId
                                    ? "Edit Doctor"
                                    : "Add Doctor"}
                            </h3>

                            <span>
                                Doctor profile information
                            </span>

                        </div>

                    </div>


                    <form onSubmit={handleSubmit}>

                        <div className="doctor-form-grid">


                            {/* DOCTOR ACCOUNT */}
                            <div className="doctor-form-field full-width">

                                <label>
                                    Doctor Account
                                </label>


                                {editingId ? (

                                    <input
                                        type="text"
                                        value={
                                            doctors.find(
                                                (doctor) =>
                                                    doctor._id ===
                                                    editingId
                                            )?.user?.email ||
                                            ""
                                        }
                                        readOnly
                                    />

                                ) : (

                                    <select
                                        name="user"
                                        value={form.user}
                                        onChange={
                                            handleDoctorAccountChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select Doctor Account
                                        </option>

                                        {doctorUsers.map(
                                            (doctorUser) => (

                                                <option
                                                    key={
                                                        doctorUser._id
                                                    }
                                                    value={
                                                        doctorUser._id
                                                    }
                                                >
                                                    {
                                                        doctorUser
                                                            .staff
                                                            ?.name
                                                    }{" "}
                                                    -{" "}
                                                    {
                                                        doctorUser.email
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                )}


                                {!editingId &&
                                    doctorUsers.length === 0 && (

                                        <small className="doctor-help-text">
                                            No available Doctor
                                            accounts. Create a
                                            Doctor account from
                                            Staff Management first.
                                        </small>

                                    )}

                            </div>


                            {/* NAME */}
                            <div className="doctor-form-field">

                                <label>
                                    Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    readOnly
                                />

                                <small className="doctor-help-text">
                                    Automatically taken from
                                    Staff information.
                                </small>

                            </div>


                            {/* PHONE */}
                            <div className="doctor-form-field">

                                <label>
                                    Phone
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    readOnly
                                />

                                <small className="doctor-help-text">
                                    Automatically taken from
                                    Staff information.
                                </small>

                            </div>


                            {/* SPECIALIZATION */}
                            <div className="doctor-form-field">

                                <label>
                                    Specialization
                                </label>

                                <input
                                    type="text"
                                    name="specialization"
                                    value={
                                        form.specialization
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. Cardiology"
                                    required
                                />

                            </div>


                            {/* QUALIFICATION */}
                            <div className="doctor-form-field">

                                <label>
                                    Qualification
                                </label>

                                <input
                                    type="text"
                                    name="qualification"
                                    value={
                                        form.qualification
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. MBBS, MD"
                                    required
                                />

                            </div>


                            {/* EXPERIENCE */}
                            <div className="doctor-form-field">

                                <label>
                                    Experience (Years)
                                </label>

                                <input
                                    type="number"
                                    name="experience"
                                    value={
                                        form.experience
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    required
                                />

                            </div>


                            {/* CONSULTATION FEE */}
                            <div className="doctor-form-field">

                                <label>
                                    Consultation Fee
                                </label>

                                <input
                                    type="number"
                                    name="consultationFee"
                                    value={
                                        form.consultationFee
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    step="1"
                                    placeholder="e.g. 15000"
                                    required
                                />

                            </div>

                        </div>


                        {/* AVAILABILITY */}
                        <div className="availability-section">

                            <h4>
                                Availability
                            </h4>


                            <label className="availability-label">
                                Working Days
                            </label>


                            <div className="days-container">

                                {daysOfWeek.map(
                                    (day) => (

                                        <label
                                            key={day}
                                            className="day-checkbox"
                                        >

                                            <input
                                                type="checkbox"
                                                checked={
                                                    form.days.includes(
                                                        day
                                                    )
                                                }
                                                onChange={() =>
                                                    handleDayChange(
                                                        day
                                                    )
                                                }
                                            />

                                            <span>
                                                {day}
                                            </span>

                                        </label>

                                    )
                                )}

                            </div>


                            <div className="time-grid">

                                {/* START TIME */}
                                <div className="doctor-form-field">

                                    <label>
                                        Start Time
                                    </label>

                                    <input
                                        type="time"
                                        name="startTime"
                                        value={
                                            form.startTime
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>


                                {/* END TIME */}
                                <div className="doctor-form-field">

                                    <label>
                                        End Time
                                    </label>

                                    <input
                                        type="time"
                                        name="endTime"
                                        value={
                                            form.endTime
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                            </div>

                        </div>


                        {/* FORM BUTTONS */}
                        <div className="doctor-form-actions">

                            <button
                                type="submit"
                                className="doctor-primary-button"
                                disabled={
                                    saving ||
                                    (
                                        !editingId &&
                                        doctorUsers.length === 0
                                    )
                                }
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Doctor"
                                        : "Create Doctor"}
                            </button>


                            <button
                                type="button"
                                className="doctor-secondary-button"
                                onClick={
                                    handleCancel
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>
            )}


            {/* DOCTOR TABLE */}
            <div className="doctor-table-card">

                <div className="doctor-section-title">

                    <div>

                        <h3>
                            All Doctors
                        </h3>

                        <span>
                            {doctors.length} doctor
                            {doctors.length !== 1
                                ? "s"
                                : ""}
                        </span>

                    </div>

                </div>


                <div className="doctor-table-container">

                    {loading ? (

                        <div className="doctor-table-message">
                            Loading doctors...
                        </div>

                    ) : doctors.length === 0 ? (

                        <div className="doctor-table-message">
                            No doctor profiles found.
                        </div>

                    ) : (

                        <table className="doctor-table">

                            <thead>

                                <tr>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Specialization
                                    </th>

                                    <th>
                                        Qualification
                                    </th>

                                    <th>
                                        Experience
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        Fee
                                    </th>

                                    <th>
                                        Availability
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {doctors.map(
                                    (doctor) => (

                                        <tr
                                            key={
                                                doctor._id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        doctor.name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        doctor
                                                            .user
                                                            ?.email
                                                    }
                                                </small>

                                            </td>


                                            <td>
                                                {
                                                    doctor.specialization
                                                }
                                            </td>


                                            <td>
                                                {
                                                    doctor.qualification
                                                }
                                            </td>


                                            <td>
                                                {
                                                    doctor.experience
                                                }{" "}
                                                years
                                            </td>


                                            <td>
                                                {
                                                    doctor.phone
                                                }
                                            </td>


                                            <td>
                                                ₹
                                                {
                                                    doctor.consultationFee
                                                }
                                            </td>


                                            <td>

                                                <div className="availability-display">

                                                    <span>
                                                        {
                                                            doctor
                                                                .availability
                                                                ?.days
                                                                ?.join(
                                                                    ", "
                                                                ) ||
                                                            "Not set"
                                                        }
                                                    </span>


                                                    {doctor
                                                        .availability
                                                        ?.startTime &&
                                                        doctor
                                                            .availability
                                                            ?.endTime && (

                                                            <small>
                                                                {
                                                                    doctor
                                                                        .availability
                                                                        .startTime
                                                                }{" "}
                                                                -
                                                                {
                                                                    doctor
                                                                        .availability
                                                                        .endTime
                                                                }
                                                            </small>

                                                        )}

                                                </div>

                                            </td>


                                            <td>

                                                <div className="doctor-action-buttons">

                                                    <button
                                                        className="doctor-edit-button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                doctor
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    <button
                                                        className="doctor-delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                doctor._id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </div>

        </div>
    );
};

export default DoctorManagement;