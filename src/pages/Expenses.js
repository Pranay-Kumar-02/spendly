import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabase/supabase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import "../styles/Expenses.css";

const CATEGORIES = [
    { name: "Groceries", icon: "🛒" }, { name: "Rent", icon: "🏠" },
    { name: "Transport", icon: "🚗" }, { name: "Food", icon: "🍕" },
    { name: "Health", icon: "💊" }, { name: "Entertainment", icon: "🎬" },
    { name: "Education", icon: "📚" }, { name: "Shopping", icon: "🛍️" },
    { name: "Utilities", icon: "💡" }, { name: "Other", icon: "💰" },
];

const Expenses = () => {
    const { user, darkMode, refreshExpenses } = useApp();
    const [expenses, setExpenses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Groceries");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchExpenses = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: false });
            if (error) {
                console.error("Error fetching expenses:", error);
                return;
            }
            if (data) setExpenses(data);
        } catch (err) {
            console.error("Error in fetchExpenses:", err);
        }
    }, [user]);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const getCategoryIcon = (cat) => CATEGORIES.find(c => c.name === cat)?.icon || "💰";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount) return;
        setLoading(true);
        try {
            if (editingExpense) {
                await supabase.from("expenses").update({
                    amount: Number(amount), category, description,
                    date: new Date(date).toISOString(),
                }).eq("id", editingExpense.id);
            } else {
                await supabase.from("expenses").insert({
                    user_id: user.id, amount: Number(amount),
                    category, description,
                    date: new Date(date).toISOString(),
                    created_at: new Date().toISOString(),
                });
            }
            await fetchExpenses();
            if (refreshExpenses) refreshExpenses();
            setAmount(""); setCategory("Groceries"); setDescription("");
            setDate(new Date().toISOString().split("T")[0]);
            setShowForm(false); setEditingExpense(null);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        await supabase.from("expenses").delete().eq("id", id);
        await fetchExpenses();
        if (refreshExpenses) refreshExpenses();
        setDeleteConfirm(null);
    };

    const handleEdit = (exp) => {
        setEditingExpense(exp);
        setAmount(exp.amount); setCategory(exp.category || "Other");
        setDescription(exp.description || "");
        setDate(exp.date ? exp.date.split("T")[0] : new Date().toISOString().split("T")[0]);
        setShowForm(true);
    };

    const filtered = expenses
        .filter(e => filter === "all" || e.category === filter)
        .filter(e => !searchQuery || (e.description || "").toLowerCase().includes(searchQuery.toLowerCase()) || (e.category || "").toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
            if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
            if (sortBy === "highest") return b.amount - a.amount;
            if (sortBy === "lowest") return a.amount - b.amount;
            return 0;
        });

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

    return (
        <div className={`expenses-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title="Expenses" />
            <div className="page-container">

                {/* Total Card */}
                <motion.div className="card" style={{ background: "var(--gradient)", color: "white", textAlign: "center", padding: "20px", marginBottom: 16 }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ opacity: 0.9, margin: "0 0 6px", fontSize: 13 }}>Total Expenses</p>
                    <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>₹{total.toLocaleString("en-IN")}</h2>
                    <p style={{ opacity: 0.8, margin: "6px 0 0", fontSize: 12 }}>{expenses.length} transactions</p>
                </motion.div>

                {/* Controls */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input placeholder="Search expenses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 13, outline: "none" }} />
                    <motion.button onClick={() => { setShowForm(!showForm); setEditingExpense(null); setAmount(""); setCategory("Groceries"); setDescription(""); }}
                        whileTap={{ scale: 0.95 }} className="btn-primary"
                        style={{ padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {showForm ? "✕ Cancel" : "➕ Add"}
                    </motion.button>
                </div>

                {/* Sort */}
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 13, marginBottom: 12, outline: "none" }}>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Amount</option>
                    <option value="lowest">Lowest Amount</option>
                </select>

                {/* Category filter */}
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
                    {["all", ...CATEGORIES.map(c => c.name)].map(cat => (
                        <button key={cat} onClick={() => setFilter(cat)}
                            style={{
                                padding: "6px 14px", borderRadius: 20, border: "none", whiteSpace: "nowrap", fontFamily: "Poppins", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                background: filter === cat ? "var(--gradient)" : "var(--background)",
                                color: filter === cat ? "white" : "var(--text-secondary)"
                            }}>
                            {cat === "all" ? "All" : cat}
                        </button>
                    ))}
                </div>

                {/* Add/Edit Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div className="card" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 16 }}>
                            <h3 style={{ margin: "0 0 16px", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>
                                {editingExpense ? "✏️ Edit Expense" : "➕ New Expense"}
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Amount (₹)</label>
                                    <input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} required
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Category</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)}
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                                        {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Description (optional)</label>
                                    <input type="text" placeholder="What was this for?" value={description} onChange={e => setDescription(e.target.value)}
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}
                                    style={{ width: "100%", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
                                    {loading ? "Saving..." : editingExpense ? "Update Expense" : "💾 Save Expense"}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Confirm Modal */}
                <AnimatePresence>
                    {deleteConfirm && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setDeleteConfirm(null)}
                                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 9998 }} />
                            <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
                                <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                                    style={{ background: "var(--card-bg)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                                    <p style={{ fontSize: 40, textAlign: "center", margin: "0 0 12px" }}>🗑️</p>
                                    <h3 style={{ textAlign: "center", color: "#EF4444", margin: "0 0 8px", fontFamily: "Poppins" }}>Delete Expense?</h3>
                                    <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, margin: "0 0 20px" }}>This cannot be undone.</p>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button onClick={() => setDeleteConfirm(null)}
                                            style={{ flex: 1, padding: 12, border: "1px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text-secondary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                        <button onClick={() => handleDelete(deleteConfirm)}
                                            style={{ flex: 1, padding: 12, border: "none", borderRadius: 10, background: "#EF4444", color: "white", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>

                {/* Expenses List */}
                {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <p style={{ fontSize: 40, margin: "0 0 12px" }}>😊</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{searchQuery ? "No expenses match!" : "No expenses yet!"}</p>
                    </div>
                ) : (
                    filtered.map((exp, i) => (
                        <motion.div key={exp.id} className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 8 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                {getCategoryIcon(exp.category)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, margin: "0 0 2px", fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {exp.description || exp.category}
                                </p>
                                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
                                    {exp.category} • {new Date(exp.date).toLocaleDateString("en-IN")}
                                </p>
                            </div>
                            <p style={{ fontWeight: 700, color: "#EF4444", margin: 0, fontSize: 15, flexShrink: 0 }}>-₹{Number(exp.amount).toLocaleString("en-IN")}</p>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                <button onClick={() => handleEdit(exp)}
                                    style={{ background: "var(--background)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: "var(--primary)" }}>✏️</button>
                                <button onClick={() => setDeleteConfirm(exp.id)}
                                    style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: "#EF4444" }}>🗑️</button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Expenses;