import { useEffect, useState } from "react";
import api from "../services/api";
import "./ManagerFinanceManagement.css";

const ManagerFinanceManagement = () => {
    const [transactions, setTransactions] = useState([]);

    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] =
        useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );

    const [form, setForm] = useState({
        type: "revenue",
        amount: "",
        description: "",
        category: "",
        transactionDate: new Date()
            .toISOString()
            .slice(0, 10),
        paymentStatus: "paid"
    });

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        try {
            setLoading(true);
            setError("");

            const [financeResponse, summaryResponse] =
                await Promise.all([
                    api.get("/finance"),
                    api.get("/finance/summary")
                ]);

            setTransactions(
                financeResponse.data.finance || []
            );

            setSummary({
                totalRevenue:
                    financeResponse.data.totalRevenue ??
                    summaryResponse.data.totalRevenue ??
                    0,

                totalExpenses:
                    financeResponse.data.totalExpenses ??
                    summaryResponse.data.totalExpenses ??
                    0,

                netIncome:
                    financeResponse.data.netIncome ??
                    summaryResponse.data.netIncome ??
                    0
            });

            // Use the actual summary API values.
            setSummary({
                totalRevenue:
                    summaryResponse.data.totalRevenue || 0,

                totalExpenses:
                    summaryResponse.data.totalExpenses || 0,

                netIncome:
                    summaryResponse.data.netIncome || 0
            });
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to load finance data"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const openAddModal = (type = "revenue") => {
        setEditingTransaction(null);

        setForm({
            type,
            amount: "",
            description: "",
            category: "",
            transactionDate: new Date()
                .toISOString()
                .slice(0, 10),
            paymentStatus: "paid"
        });

        setError("");
        setMessage("");
        setShowModal(true);
    };

    const openEditModal = (transaction) => {
        setEditingTransaction(transaction);

        setForm({
            type: transaction.type || "revenue",
            amount: transaction.amount ?? "",
            description: transaction.description || "",
            category: transaction.category || "",
            transactionDate: transaction.transactionDate
                ? new Date(transaction.transactionDate)
                    .toISOString()
                    .slice(0, 10)
                : new Date()
                    .toISOString()
                    .slice(0, 10),
            paymentStatus:
                transaction.paymentStatus || "paid"
        });

        setError("");
        setMessage("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingTransaction(null);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError("");
        setMessage("");

        try {
            if (
                !form.amount ||
                Number(form.amount) < 0
            ) {
                setError(
                    "Please enter a valid amount"
                );
                setSaving(false);
                return;
            }

            if (!form.description.trim()) {
                setError(
                    "Description is required"
                );
                setSaving(false);
                return;
            }

            const payload = {
                type: form.type,
                amount: Number(form.amount),
                description:
                    form.description.trim(),
                category:
                    form.category.trim(),
                transactionDate:
                    form.transactionDate,
                paymentStatus:
                    form.paymentStatus
            };

            if (editingTransaction) {
                const response = await api.put(
                    `/finance/${editingTransaction._id}`,
                    payload
                );

                setMessage(
                    response.data.message ||
                    "Finance transaction updated successfully"
                );
            } else {
                const response = await api.post(
                    "/finance",
                    payload
                );

                setMessage(
                    response.data.message ||
                    "Finance transaction created successfully"
                );
            }

            setShowModal(false);
            setEditingTransaction(null);

            await fetchFinanceData();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to save finance transaction"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (transaction) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this transaction?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            const response = await api.delete(
                `/finance/${transaction._id}`
            );

            setMessage(
                response.data.message ||
                "Finance transaction deleted successfully"
            );

            await fetchFinanceData();
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to delete finance transaction"
            );
        }
    };

    const formatCurrency = (amount) => {
        return `₹${Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const formatType = (type) => {
        if (!type) return "-";

        return (
            type.charAt(0).toUpperCase() +
            type.slice(1)
        );
    };

    const getTypeClass = (type) => {
        if (type === "revenue") {
            return "revenue";
        }

        if (type === "salary") {
            return "salary";
        }

        return "expense";
    };

    const getStatusClass = (status) => {
        if (status === "paid") {
            return "paid";
        }

        if (status === "pending") {
            return "pending";
        }

        return "cancelled";
    };

    const monthlyTransactions = transactions.filter(
        (transaction) => {
            if (!transaction.transactionDate) {
                return false;
            }

            const transactionMonth =
                new Date(
                    transaction.transactionDate
                )
                    .toISOString()
                    .slice(0, 7);

            return transactionMonth === selectedMonth;
        }
    );

    const monthlyRevenue =
        monthlyTransactions
            .filter(
                (transaction) =>
                    transaction.type === "revenue" &&
                    transaction.paymentStatus === "paid"
            )
            .reduce(
                (total, transaction) =>
                    total + Number(transaction.amount || 0),
                0
            );

    const monthlyExpenses =
        monthlyTransactions
            .filter(
                (transaction) =>
                    (
                        transaction.type === "expense" ||
                        transaction.type === "salary"
                    ) &&
                    transaction.paymentStatus === "paid"
            )
            .reduce(
                (total, transaction) =>
                    total + Number(transaction.amount || 0),
                0
            );

    const monthlyNetProfit =
        monthlyRevenue - monthlyExpenses;

    const revenueTransactions =
        transactions.filter(
            (transaction) =>
                transaction.type === "revenue"
        );

    const expenseTransactions =
        transactions.filter(
            (transaction) =>
                transaction.type === "expense"
        );

    const salaryTransactions =
        transactions.filter(
            (transaction) =>
                transaction.type === "salary"
        );

    return (
        <div className="manager-finance-page">

            <div className="finance-page-header">
                <div>
                    <h2>Finance Management</h2>
                    <p>
                        Manage hospital revenue, expenses
                        and financial reports.
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        className="revenue-button"
                        onClick={() =>
                            openAddModal("revenue")
                        }
                    >
                        Add Revenue
                    </button>

                    <button
                        className="expense-button"
                        onClick={() =>
                            openAddModal("expense")
                        }
                    >
                        Add Expense
                    </button>

                    <button
                        className="secondary-button"
                        onClick={fetchFinanceData}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="finance-summary">

                <div className="summary-card">
                    <span>Total Revenue</span>
                    <strong className="revenue-text">
                        {formatCurrency(
                            summary.totalRevenue
                        )}
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Total Expenses</span>
                    <strong className="expense-text">
                        {formatCurrency(
                            summary.totalExpenses
                        )}
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Net Profit</span>
                    <strong
                        className={
                            summary.netIncome >= 0
                                ? "profit-text"
                                : "loss-text"
                        }
                    >
                        {formatCurrency(
                            summary.netIncome
                        )}
                    </strong>
                </div>

                <div className="summary-card">
                    <span>Total Transactions</span>
                    <strong>
                        {transactions.length}
                    </strong>
                </div>

            </div>

            <div className="finance-statistics">

                <div className="stat-card">
                    <span>Revenue Transactions</span>
                    <strong>
                        {revenueTransactions.length}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>Expense Transactions</span>
                    <strong>
                        {expenseTransactions.length}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>Salary Transactions</span>
                    <strong>
                        {salaryTransactions.length}
                    </strong>
                </div>

            </div>

            <div className="monthly-report-card">

                <div className="report-header">
                    <div>
                        <h3>Monthly Financial Report</h3>
                        <p>
                            Revenue, expenses and net profit
                            for the selected month.
                        </p>
                    </div>

                    <div className="month-selector">
                        <label>
                            Select Month
                        </label>

                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) =>
                                setSelectedMonth(
                                    e.target.value
                                )
                            }
                        />
                    </div>
                </div>

                <div className="monthly-summary">

                    <div className="monthly-card">
                        <span>Monthly Revenue</span>
                        <strong className="revenue-text">
                            {formatCurrency(
                                monthlyRevenue
                            )}
                        </strong>
                    </div>

                    <div className="monthly-card">
                        <span>Monthly Expenses</span>
                        <strong className="expense-text">
                            {formatCurrency(
                                monthlyExpenses
                            )}
                        </strong>
                    </div>

                    <div className="monthly-card">
                        <span>Net Profit</span>
                        <strong
                            className={
                                monthlyNetProfit >= 0
                                    ? "profit-text"
                                    : "loss-text"
                            }
                        >
                            {formatCurrency(
                                monthlyNetProfit
                            )}
                        </strong>
                    </div>

                    <div className="monthly-card">
                        <span>Transactions</span>
                        <strong>
                            {
                                monthlyTransactions.length
                            }
                        </strong>
                    </div>

                </div>

            </div>

            <div className="transactions-card">

                <div className="card-header">
                    <div>
                        <h3>
                            Finance Transactions
                        </h3>

                        <p>
                            All hospital financial
                            transactions.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        Loading finance data...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state">
                        No finance transactions found.
                    </div>
                ) : (
                    <div className="table-wrapper">

                        <table className="finance-table">

                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Staff</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {transactions.map(
                                    (transaction) => (
                                        <tr
                                            key={
                                                transaction._id
                                            }
                                        >

                                            <td>
                                                {formatDate(
                                                    transaction.transactionDate
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`type-badge ${getTypeClass(
                                                        transaction.type
                                                    )}`}
                                                >
                                                    {formatType(
                                                        transaction.type
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="description-text">
                                                    {
                                                        transaction.description
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    transaction.category ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {transaction.staff
                                                    ?.name ||
                                                    "-"}
                                            </td>

                                            <td>
                                                <strong
                                                    className={
                                                        transaction.type ===
                                                        "revenue"
                                                            ? "revenue-text"
                                                            : "expense-text"
                                                    }
                                                >
                                                    {formatCurrency(
                                                        transaction.amount
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge ${getStatusClass(
                                                        transaction.paymentStatus
                                                    )}`}
                                                >
                                                    {formatType(
                                                        transaction.paymentStatus
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="action-buttons">

                                                    <button
                                                        className="edit-button"
                                                        onClick={() =>
                                                            openEditModal(
                                                                transaction
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                transaction
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

                    </div>
                )}

            </div>

            {showModal && (
                <div className="modal-overlay">

                    <div className="finance-modal">

                        <div className="modal-header">

                            <div>
                                <h3>
                                    {editingTransaction
                                        ? "Update Finance Transaction"
                                        : form.type === "revenue"
                                            ? "Add Revenue"
                                            : form.type === "expense"
                                                ? "Add Expense"
                                                : "Add Finance Transaction"}
                                </h3>

                                <p>
                                    Enter the financial
                                    transaction details.
                                </p>
                            </div>

                            <button
                                className="close-button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                ×
                            </button>

                        </div>

                        <form
                            className="finance-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-row">

                                <div className="form-group">
                                    <label>
                                        Transaction Type
                                    </label>

                                    <select
                                        name="type"
                                        value={form.type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="revenue">
                                            Revenue
                                        </option>

                                        <option value="expense">
                                            Expense
                                        </option>

                                        <option value="salary">
                                            Salary
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Amount
                                    </label>

                                    <input
                                        type="number"
                                        name="amount"
                                        value={form.amount}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>

                            </div>

                            <div className="form-row">

                                <div className="form-group">
                                    <label>
                                        Category
                                    </label>

                                    <input
                                        type="text"
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        placeholder={
                                            form.type ===
                                            "revenue"
                                                ? "Consultation / Room / Pharmacy"
                                                : "Medicine / Equipment / Utility"
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Transaction Date
                                    </label>

                                    <input
                                        type="date"
                                        name="transactionDate"
                                        value={
                                            form.transactionDate
                                        }
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                            </div>

                            <div className="form-group">
                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="Enter transaction description"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Payment Status
                                </label>

                                <select
                                    name="paymentStatus"
                                    value={
                                        form.paymentStatus
                                    }
                                    onChange={handleChange}
                                >
                                    <option value="paid">
                                        Paid
                                    </option>

                                    <option value="pending">
                                        Pending
                                    </option>

                                    <option value="cancelled">
                                        Cancelled
                                    </option>
                                </select>
                            </div>

                            {error && (
                                <div className="form-error">
                                    {error}
                                </div>
                            )}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingTransaction
                                            ? "Update Transaction"
                                            : "Save Transaction"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
};

export default ManagerFinanceManagement;