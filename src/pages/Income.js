import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabase/supabase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const INCOME_TYPES = [
    { name: "Salary", icon: "💼" }, { name: "Freelance", icon: "💻" },
    { name: "Business", icon: "🏢" }, { name: "Investment", icon: "📈" },
    { name: "Other", icon: "💰" },
];

const Income = () => {
    const { user, darkMode, refreshIncomes } = useApp();
    const [incomes, setIncomes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("Salary");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchIncomes = async () => {
        if (!user) return;
        const { data } = await supabase.from("income").select("*").eq("user_id", user.id).order("date", { ascending: false });
        if (data) setIncomes(data);
    };

    useEffect(() => { fetchIncomes(); }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount) return;
        setLoading(true);
        try {
            if (editingIncome) {
                await supabase.from("income").update({ amount: Number(amount), type, description, date: new Date(date).toISOString() }).eq("id", editingIncome.id);
            } else {
                await supabase.from("income").insert({ user_id: user.id, amount: Number(amount), type, description, date: new Date(date).toISOString(), created_at: new Date().toISOString() });
            }
            await fetchIncomes();
            if (refreshIncomes) refreshIncomes();
            setAmount(""); setType("Salary"); setDescription(""); setDate(new Date().toISOString().split("T")[0]);
            setShowForm(false); setEditingIncome(null);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        await supabase.from("income").delete().eq("id", id);
        await fetchIncomes();
        if (refreshIncomes) refreshIncomes();
        setDeleteConfirm(null);
    };

    const handleEdit = (inc) => {
        setEditingIncome(inc); setAmount(inc.amount); setType(inc.type || "Salary");
        setDescription(inc.description || ""); setDate(inc.date ? inc.date.split("T")[0] : new Date().toISOString().split("T")[0]);
        setShowForm(true);
    };

    const total = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const getIcon = (t) => INCOME_TYPES.find(i => i.name === t)?.icon || "💰";

    return (
        <div className={darkMode ? "dark-mode" : ""}>
            <Navbar title="Income" />
            <div className="page-container">
                <motion.div className="card" style={{ background: "var(--gradient)", color: "white", textAlign: "center", padding: "20px", marginBottom: 16 }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ opacity: 0.9, margin: "0 0 6px", fontSize: 13 }}>Total Income</p>
                    <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>₹{total.toLocaleString("en-IN")}</h2>
                    <p style={{ opacity: 0.8, margin: "6px 0 0", fontSize: 12 }}>{incomes.length} transactions</p>
                </motion.div>

                <motion.button onClick={() => { setShowForm(!showForm); setEditingIncome(null); setAmount(""); setType("Salary"); setDescription(""); }}
                    whileTap={{ scale: 0.97 }} className="btn-primary"
                    style={{ width: "100%", padding: 13, borderRadius: 14, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                    {showForm ? "✕ Cancel" : "➕ Add Income"}
                </motion.button>

                <AnimatePresence>
                    {showForm && (
                        <motion.div className="card" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 16 }}>
                            <h3 style={{ margin: "0 0 16px", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{editingIncome ? "✏️ Edit Income" : "➕ New Income"}</h3>
                            <form onSubmit={handleSubmit}>
                                {[{ label: "Amount (₹)", type: "number", val: amount, set: setAmount, ph: "Enter amount" },
                                { label: "Description (optional)", type: "text", val: description, set: setDescription, ph: "What was this for?" }].map(f => (
                                    <div key={f.label} style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
                                        <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} required={f.type === "number"}
                                            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                    </div>
                                ))}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Type</label>
                                    <select value={type} onChange={e => setType(e.target.value)}
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                                        {INCOME_TYPES.map(i => <option key={i.name} value={i.name}>{i.icon} {i.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
                                    {loading ? "Saving..." : editingIncome ? "Update Income" : "💾 Save Income"}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {deleteConfirm && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)}
                                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 9998 }} />
                            <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
                                <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                                    style={{ background: "var(--card-bg)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                                    <p style={{ fontSize: 40, textAlign: "center", margin: "0 0 12px" }}>🗑️</p>
                                    <h3 style={{ textAlign: "center", color: "#EF4444", margin: "0 0 8px", fontFamily: "Poppins" }}>Delete Income?</h3>
                                    <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, margin: "0 0 20px" }}>This cannot be undone.</p>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 12, border: "1px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text-secondary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                        <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: 12, border: "none", borderRadius: 10, background: "#EF4444", color: "white", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>

                {incomes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <p style={{ fontSize: 40, margin: "0 0 12px" }}>💰</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No income yet! Add your first one.</p>
                    </div>
                ) : (
                    incomes.map((inc, i) => (
                        <motion.div key={inc.id} className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 8 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{getIcon(inc.type)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, margin: "0 0 2px", fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.description || inc.type}</p>
                                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{inc.type} • {new Date(inc.date).toLocaleDateString("en-IN")}</p>
                            </div>
                            <p style={{ fontWeight: 700, color: "#10B981", margin: 0, fontSize: 15, flexShrink: 0 }}>+₹{Number(inc.amount).toLocaleString("en-IN")}</p>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                <button onClick={() => handleEdit(inc)} style={{ background: "var(--background)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 }}>✏️</button>
                                <button onClick={() => setDeleteConfirm(inc.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 }}>🗑️</button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
export default Income;