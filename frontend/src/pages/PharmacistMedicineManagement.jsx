import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./PharmacistMedicineManagement.css";

const initialFormData = {
    name: "",
    category: "",
    quantity: "",
    unitPrice: "",
    expiryDate: "",
    supplier: "",
    reorderLevel: ""
};

const PharmacistMedicineManagement = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [showForm, setShowForm] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [formData, setFormData] = useState(initialFormData);

    const [showStockModal, setShowStockModal] = useState(false);
    const [stockMedicine, setStockMedicine] = useState(null);
    const [stockQuantity, setStockQuantity] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [medicineToDelete, setMedicineToDelete] = useState(null);

    /* =========================================
       FETCH MEDICINES
    ========================================= */
    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/medicines");
            setMedicines(response.data?.medicines || []);
        } catch (err) {
            console.error("Error fetching medicines:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load medicines."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================================
       DATE HELPERS
    ========================================= */
    const getToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    const getExpiryDate = (medicine) => {
        if (!medicine?.expiryDate) return null;
        const expiryDate = new Date(medicine.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate;
    };

    const getDaysUntilExpiry = (medicine) => {
        const expiryDate = getExpiryDate(medicine);
        if (!expiryDate) return null;
        const today = getToday();
        const difference = expiryDate.getTime() - today.getTime();
        return Math.ceil(difference / (1000 * 60 * 60 * 24));
    };

    /* =========================================
       MEDICINE STATUS
    ========================================= */
    const getMedicineStatus = (medicine) => {
        const daysUntilExpiry = getDaysUntilExpiry(medicine);

        if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
            return "expired";
        }
        if (Number(medicine.quantity) <= Number(medicine.reorderLevel)) {
            return "low-stock";
        }
        if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
            return "expiring";
        }
        return "normal";
    };

    const getStatusLabel = (medicine) => {
        const status = getMedicineStatus(medicine);
        if (status === "expired") return "Expired";
        if (status === "low-stock") return "Low Stock";
        if (status === "expiring") return "Expiring Soon";
        return "In Stock";
    };

    /* =========================================
       FILTER MEDICINES
    ========================================= */
    const filteredMedicines = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return medicines.filter((medicine) => {
            const matchesSearch =
                !search ||
                medicine.name?.toLowerCase().includes(search) ||
                medicine.category?.toLowerCase().includes(search) ||
                medicine.supplier?.toLowerCase().includes(search);

            const status = getMedicineStatus(medicine);
            const matchesStatus =
                statusFilter === "all" || status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [medicines, searchTerm, statusFilter]);

    /* =========================================
       FORM HANDLERS
    ========================================= */
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingMedicine(null);
        setShowForm(false);
    };

    const openAddForm = () => {
        setSuccess("");
        setError("");
        setEditingMedicine(null);
        setFormData(initialFormData);
        setShowForm(true);
    };

    const openEditForm = (medicine) => {
        setSuccess("");
        setError("");
        setEditingMedicine(medicine);
        setFormData({
            name: medicine.name || "",
            category: medicine.category || "",
            quantity: medicine.quantity ?? "",
            unitPrice: medicine.unitPrice ?? "",
            expiryDate: medicine.expiryDate
                ? medicine.expiryDate.substring(0, 10)
                : "",
            supplier: medicine.supplier || "",
            reorderLevel: medicine.reorderLevel ?? ""
        });
        setShowForm(true);
    };

    /* =========================================
       ADD / UPDATE MEDICINE
    ========================================= */
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                name: formData.name.trim(),
                category: formData.category.trim(),
                quantity: Number(formData.quantity),
                unitPrice: Number(formData.unitPrice),
                expiryDate: formData.expiryDate,
                supplier: formData.supplier.trim(),
                reorderLevel: Number(formData.reorderLevel)
            };

            if (!payload.name) {
                throw new Error("Medicine name is required.");
            }
            if (!payload.category) {
                throw new Error("Category is required.");
            }
            if (!Number.isFinite(payload.quantity) || payload.quantity < 0) {
                throw new Error("Quantity must be 0 or greater.");
            }
            if (!Number.isFinite(payload.unitPrice) || payload.unitPrice < 0) {
                throw new Error("Unit price must be 0 or greater.");
            }
            if (!payload.expiryDate) {
                throw new Error("Expiry date is required.");
            }
            if (!Number.isFinite(payload.reorderLevel) || payload.reorderLevel < 0) {
                throw new Error("Reorder level must be 0 or greater.");
            }

            if (editingMedicine) {
                const response = await api.put(
                    `/medicines/${editingMedicine._id}`,
                    payload
                );

                const updatedMedicine = response.data?.medicine;
                if (updatedMedicine) {
                    setMedicines((prev) =>
                        prev.map((m) =>
                            m._id === editingMedicine._id ? updatedMedicine : m
                        )
                    );
                } else {
                    await fetchMedicines();
                }

                setSuccess("Medicine updated successfully.");
            } else {
                const response = await api.post("/medicines", payload);
                const newMedicine = response.data?.medicine;

                if (newMedicine) {
                    setMedicines((prev) => [newMedicine, ...prev]);
                } else {
                    await fetchMedicines();
                }

                setSuccess("Medicine added successfully.");
            }

            resetForm();
        } catch (err) {
            console.error("Error saving medicine:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to save medicine."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =========================================
       STOCK MODAL
    ========================================= */
    const openStockModal = (medicine) => {
        setError("");
        setSuccess("");
        setStockMedicine(medicine);
        setStockQuantity(medicine.quantity ?? "");
        setShowStockModal(true);
    };

    const closeStockModal = () => {
        setShowStockModal(false);
        setStockMedicine(null);
        setStockQuantity("");
    };

    const handleStockUpdate = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const quantity = Number(stockQuantity);
            if (!Number.isFinite(quantity) || quantity < 0) {
                throw new Error("Stock quantity must be 0 or greater.");
            }

            const response = await api.put(
                `/medicines/${stockMedicine._id}/stock`,
                { quantity }
            );

            const updatedMedicine = response.data?.medicine;
            if (updatedMedicine) {
                setMedicines((prev) =>
                    prev.map((m) =>
                        m._id === stockMedicine._id ? updatedMedicine : m
                    )
                );
            } else {
                await fetchMedicines();
            }

            closeStockModal();
            setSuccess("Stock quantity updated successfully.");
        } catch (err) {
            console.error("Error updating stock:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update stock."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =========================================
       DELETE MODAL
    ========================================= */
    const openDeleteModal = (medicine) => {
        setError("");
        setSuccess("");
        setMedicineToDelete(medicine);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setMedicineToDelete(null);
    };

    const handleDelete = async () => {
        if (!medicineToDelete) return;

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await api.delete(`/medicines/${medicineToDelete._id}`);

            setMedicines((prev) =>
                prev.filter((m) => m._id !== medicineToDelete._id)
            );

            closeDeleteModal();
            setSuccess("Medicine deleted successfully.");
        } catch (err) {
            console.error("Error deleting medicine:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete medicine."
            );
        } finally {
            setSaving(false);
        }
    };

    /* =========================================
       DATE FORMAT
    ========================================= */
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

    /* =========================================
       SUMMARY COUNTS
    ========================================= */
    const lowStockCount = medicines.filter(
        (m) => getMedicineStatus(m) === "low-stock"
    ).length;

    const expiringCount = medicines.filter(
        (m) => getMedicineStatus(m) === "expiring"
    ).length;

    const expiredCount = medicines.filter(
        (m) => getMedicineStatus(m) === "expired"
    ).length;

    if (loading) {
        return (
            <div className="manager-dashboard">
                <div className="dashboard-loading">Loading medicines...</div>
            </div>
        );
    }

    return (
        <div className="manager-dashboard">
            {/* Header row matching Manager pages */}
            <div className="page-header-row">
                <div>
                    <h2>Medicine Management</h2>
                    <p>
                        Manage pharmacy inventory, stock reorder levels, unit pricing, and suppliers.
                    </p>
                </div>

                <div>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={openAddForm}
                    >
                        + Add Medicine
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="medicine-alert medicine-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="medicine-alert medicine-success">
                    {success}
                </div>
            )}

            {/* Summary Stat Grid */}
            <div className="stats-grid">
                <div className="stat-card border-blue">
                    <h3>Total Medicines</h3>
                    <strong className="text-blue">{medicines.length}</strong>
                    <span className="stat-sub">Active catalog items</span>
                </div>

                <div className="stat-card border-amber">
                    <h3>Low Stock</h3>
                    <strong className="text-amber">{lowStockCount}</strong>
                    <span className="stat-sub">At or below reorder level</span>
                </div>

                <div className="stat-card border-purple">
                    <h3>Expiring Soon</h3>
                    <strong className="text-purple">{expiringCount}</strong>
                    <span className="stat-sub">Expiring within 30 days</span>
                </div>

                <div className="stat-card border-red">
                    <h3>Expired</h3>
                    <strong className="text-red">{expiredCount}</strong>
                    <span className="stat-sub">Requires removal</span>
                </div>
            </div>

            {/* Medicines List Card */}
            <div className="dashboard-card">
                <div className="card-top-header">
                    <div>
                        <h3>Medicines Inventory</h3>
                        <p>
                            Showing {filteredMedicines.length} of {medicines.length} items
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            type="button"
                            className="btn-refresh"
                            onClick={fetchMedicines}
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="medicine-toolbar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search medicine, category or supplier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="normal">In Stock</option>
                        <option value="low-stock">Low Stock</option>
                        <option value="expiring">Expiring Soon</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>

                {/* Table */}
                {filteredMedicines.length === 0 ? (
                    <div className="empty-state-box">
                        <h4>No Medicines Found</h4>
                        <p>
                            {medicines.length === 0
                                ? "Add your first medicine to get started."
                                : "Try changing your search or status filter."}
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="pharmacist-table">
                            <thead>
                                <tr>
                                    <th>Medicine</th>
                                    <th>Category</th>
                                    <th>Stock Level</th>
                                    <th>Unit Price</th>
                                    <th>Expiry Date</th>
                                    <th>Supplier</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMedicines.map((medicine) => {
                                    const status = getMedicineStatus(medicine);
                                    const daysUntilExpiry = getDaysUntilExpiry(medicine);
                                    const isLow =
                                        Number(medicine.quantity) <=
                                        Number(medicine.reorderLevel);

                                    return (
                                        <tr key={medicine._id}>
                                            <td>
                                                <strong>{medicine.name}</strong>
                                                <small>
                                                    Reorder level: {medicine.reorderLevel}
                                                </small>
                                            </td>
                                            <td>{medicine.category}</td>
                                            <td>
                                                <strong
                                                    style={{
                                                        color: isLow
                                                            ? "#d97706"
                                                            : "#1e293b"
                                                    }}
                                                >
                                                    {medicine.quantity} units
                                                </strong>
                                            </td>
                                            <td>
                                                ₹{Number(medicine.unitPrice).toFixed(2)}
                                            </td>
                                            <td>
                                                <span>{formatDate(medicine.expiryDate)}</span>
                                                {daysUntilExpiry !== null &&
                                                    daysUntilExpiry >= 0 &&
                                                    daysUntilExpiry <= 30 && (
                                                        <small style={{ color: "#d97706" }}>
                                                            {daysUntilExpiry === 0
                                                                ? "Expires today"
                                                                : `${daysUntilExpiry} days left`}
                                                        </small>
                                                    )}
                                                {daysUntilExpiry !== null &&
                                                    daysUntilExpiry < 0 && (
                                                        <small style={{ color: "#dc2626" }}>
                                                            Expired
                                                        </small>
                                                    )}
                                            </td>
                                            <td>{medicine.supplier || "-"}</td>
                                            <td>
                                                <span
                                                    className={`status-pill pill-${status}`}
                                                >
                                                    {getStatusLabel(medicine)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        type="button"
                                                        className="btn-action-stock"
                                                        onClick={() => openStockModal(medicine)}
                                                    >
                                                        Stock
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-action-edit"
                                                        onClick={() => openEditForm(medicine)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-action-delete"
                                                        onClick={() => openDeleteModal(medicine)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL: ADD / EDIT MEDICINE */}
            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>
                                    {editingMedicine
                                        ? "Edit Medicine"
                                        : "Add New Medicine"}
                                </h3>
                                <p>
                                    {editingMedicine
                                        ? "Update medicine information and pricing."
                                        : "Enter details for the new medicine item."}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={resetForm}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Medicine Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Paracetamol"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category *</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Tablet, Syrup, Injection"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Quantity in Stock *</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        min="0"
                                        step="1"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Unit Price (₹) *</label>
                                    <input
                                        type="number"
                                        name="unitPrice"
                                        min="0"
                                        step="0.01"
                                        value={formData.unitPrice}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Expiry Date *</label>
                                    <input
                                        type="date"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Reorder Level *</label>
                                    <input
                                        type="number"
                                        name="reorderLevel"
                                        min="0"
                                        step="1"
                                        value={formData.reorderLevel}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 10"
                                        required
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Supplier Name</label>
                                    <input
                                        type="text"
                                        name="supplier"
                                        value={formData.supplier}
                                        onChange={handleInputChange}
                                        placeholder="e.g. MedSupply Co."
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={resetForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingMedicine
                                            ? "Update Medicine"
                                            : "Add Medicine"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: UPDATE STOCK */}
            {showStockModal && stockMedicine && (
                <div className="modal-overlay" onClick={closeStockModal}>
                    <div
                        className="modal-box"
                        style={{ maxWidth: "450px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3>Update Stock Level</h3>
                                <p>{stockMedicine.name}</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeStockModal}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleStockUpdate} className="modal-form">
                            <div className="current-stock-info">
                                <span>Current Stock:</span>
                                <strong>{stockMedicine.quantity} units</strong>
                            </div>

                            <div className="form-group">
                                <label>New Stock Quantity *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={stockQuantity}
                                    onChange={(e) => setStockQuantity(e.target.value)}
                                    placeholder="Enter new quantity"
                                    required
                                />
                                <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                                    This replaces the current stock value.
                                </small>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeStockModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Updating..." : "Update Stock"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DELETE CONFIRMATION */}
            {showDeleteModal && medicineToDelete && (
                <div className="modal-overlay" onClick={closeDeleteModal}>
                    <div
                        className="modal-box"
                        style={{ maxWidth: "450px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h3>Confirm Delete</h3>
                                <p>Delete medicine from inventory</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeDeleteModal}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: "18px 24px" }}>
                            <p style={{ margin: "0 0 12px", color: "#334155", fontSize: "14px" }}>
                                Are you sure you want to delete{" "}
                                <strong>{medicineToDelete.name}</strong>?
                            </p>
                            <p style={{ margin: 0, color: "#dc2626", fontSize: "13px" }}>
                                This action cannot be undone.
                            </p>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={closeDeleteModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleDelete}
                                disabled={saving}
                            >
                                {saving ? "Deleting..." : "Delete Medicine"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacistMedicineManagement;