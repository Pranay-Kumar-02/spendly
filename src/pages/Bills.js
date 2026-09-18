import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabase/supabase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const Bills = () => {
    const { user, darkMode, refreshBills } = useApp();
    const [bills, setBills] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [category, setCategory] = useState("Utilities");
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const CATEGORIES = ["Utilities", "Rent", "Insurance", "Subscription", "EMI", "Other"];

    const fetchBills = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from("bills").select("*").eq("user_id", user.id).order("due_date", { ascending: true });
            if (error) {
                console.error("Error fetching bills:", error);
                return;
            }
            if (data) setBills(data);
        } catch (err) {
            console.error("Error in fetchBills:", err);
        }
    }, [user]);

    useEffect(() => { fetchBills(); }, [fetchBills]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !amount || !user) return;
        setLoading(true);
        try {
            const { error } = await supabase.from("bills").insert({
                user_id: user.id,
                name,
                amount: Number(amount),
                due_date: dueDate || null,
                category,
                is_paid: false,
                created_at: new Date().toISOString()
            });
            if (error) throw error;
            await fetchBills();
            if (refreshBills) refreshBills();
            setName(""); setAmount(""); setDueDate(""); setCategory("Utilities"); setShowForm(false);
        } catch (err) {
            console.error("Error creating bill:", err);
        }
        setLoading(false);
    };

    const togglePaid = async (bill) => {
        try {
            const { error } = await supabase.from("bills").update({ is_paid: !bill.is_paid }).eq("id", bill.id);
            if (error) throw error;
            await fetchBills();
            if (refreshBills) refreshBills();
        } catch (err) {
            console.error("Error toggling bill status:", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase.from("bills").delete().eq("id", id);
            if (error) throw error;
            await fetchBills();
            if (refreshBills) refreshBills();
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Error deleting bill:", err);
        }
    };

    const getDaysUntil = (dateStr) => {
        if (!dateStr) return null;
        const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const unpaid = bills.filter(b => !b.is_paid);
    const paid = bills.filter(b => b.is_paid);
    const totalDue = unpaid.reduce((s, b) => s + Number(b.amount), 0);

    return (
        <div className={darkMode ? "dark-mode" : ""}>
            <Navbar title="Bills" />
            <div className="page-container">
                <motion.div className="card" style={{ background: "var(--gradient)", color: "white", textAlign: "center", padding: "20px", marginBottom: 16 }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ opacity: 0.9, margin: "0 0 6px", fontSize: 13 }}>Total Due</p>
                    <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>₹{totalDue.toLocaleString("en-IN")}</h2>
                    <p style={{ opacity: 0.8, margin: "6px 0 0", fontSize: 12 }}>{unpaid.length} unpaid bills</p>
                </motion.div>

                <motion.button onClick={() => setShowForm(!showForm)} whileTap={{ scale: 0.97 }} className="btn-primary"
                    style={{ width: "100%", padding: 13, borderRadius: 14, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                    {showForm ? "✕ Cancel" : "➕ Add Bill"}
                </motion.button>

                <AnimatePresence>
                    {showForm && (
                        <motion.div className="card" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 16 }}>
                            <form onSubmit={handleSubmit}>
                                {[{ label: "Bill Name", type: "text", val: name, set: setName, ph: "e.g. Electricity" },
                                { label: "Amount (₹)", type: "number", val: amount, set: setAmount, ph: "Enter amount" }].map(f => (
                                    <div key={f.label} style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
                                        <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} required
                                            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                    </div>
                                ))}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Category</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)}
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Due Date</label>
                                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
                                    {loading ? "Saving..." : "💾 Save Bill"}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {bills.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <p style={{ fontSize: 40, margin: "0 0 12px" }}>📅</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No bills added yet!</p>
                    </div>
                ) : (
                    [...unpaid, ...paid].map((bill, i) => {
                        const days = getDaysUntil(bill.due_date);
                        const urgent = days !== null && days <= 3 && !bill.is_paid;
                        return (
                            <motion.div key={bill.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                style={{ marginBottom: 10, padding: "14px 16px", opacity: bill.is_paid ? 0.6 : 1, border: urgent ? "1px solid #FCA5A5" : "1px solid var(--border)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <motion.div onClick={() => togglePaid(bill)} whileTap={{ scale: 0.9 }}
                                        style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${bill.is_paid ? "#10B981" : "var(--border)"}`, background: bill.is_paid ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "white", fontSize: 12, fontWeight: 800 }}>
                                        {bill.is_paid ? "✓" : ""}
                                    </motion.div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 2px", color: "var(--text-primary)", textDecoration: bill.is_paid ? "line-through" : "none" }}>{bill.name}</p>
                                        <p style={{ fontSize: 11, color: urgent ? "#EF4444" : "var(--text-secondary)", margin: 0 }}>
                                            {bill.category} {days !== null ? `• Due in ${days}d` : ""}
                                            {urgent && " ⚠️"}
                                        </p>
                                    </div>
                                    <p style={{ fontWeight: 700, color: bill.is_paid ? "#10B981" : "#EF4444", margin: 0, fontSize: 14, flexShrink: 0 }}>₹{Number(bill.amount).toLocaleString("en-IN")}</p>
                                    <button onClick={() => setDeleteConfirm(bill.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>🗑️</button>
                                </div>
                            </motion.div>
                        );
                    })
                )}

                <AnimatePresence>
                    {deleteConfirm && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)}
                                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 9998 }} />
                            <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
                                <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                                    style={{ background: "var(--card-bg)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                                    <p style={{ fontSize: 40, textAlign: "center", margin: "0 0 12px" }}>🗑️</p>
                                    <h3 style={{ textAlign: "center", color: "#EF4444", margin: "0 0 20px", fontFamily: "Poppins" }}>Delete Bill?</h3>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 12, border: "1px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text-secondary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                        <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: 12, border: "none", borderRadius: 10, background: "#EF4444", color: "white", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
export default Bills;