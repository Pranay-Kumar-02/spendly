import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabase/supabase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const Goals = () => {
    const { user, darkMode } = useApp();
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [target, setTarget] = useState("");
    const [saved, setSaved] = useState("");
    const [deadline, setDeadline] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [addingTo, setAddingTo] = useState(null);
    const [addAmount, setAddAmount] = useState("");

    const fetchGoals = async () => {
        if (!user) return;
        const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (data) setGoals(data);
    };

    useEffect(() => { fetchGoals(); }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !target) return;
        setLoading(true);
        await supabase.from("goals").insert({ user_id: user.id, name, target: Number(target), saved: Number(saved) || 0, deadline, created_at: new Date().toISOString() });
        await fetchGoals();
        setName(""); setTarget(""); setSaved(""); setDeadline(""); setShowForm(false);
        setLoading(false);
    };

    const handleAddAmount = async (goal) => {
        if (!addAmount) return;
        const newSaved = Number(goal.saved) + Number(addAmount);
        await supabase.from("goals").update({ saved: newSaved }).eq("id", goal.id);
        await fetchGoals();
        setAddingTo(null); setAddAmount("");
    };

    const handleDelete = async (id) => {
        await supabase.from("goals").delete().eq("id", id);
        await fetchGoals();
        setDeleteConfirm(null);
    };

    return (
        <div className={darkMode ? "dark-mode" : ""}>
            <Navbar title="Goals" />
            <div className="page-container">
                <motion.button onClick={() => setShowForm(!showForm)} whileTap={{ scale: 0.97 }} className="btn-primary"
                    style={{ width: "100%", padding: 13, borderRadius: 14, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                    {showForm ? "✕ Cancel" : "🎯 Add New Goal"}
                </motion.button>

                <AnimatePresence>
                    {showForm && (
                        <motion.div className="card" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 16 }}>
                            <h3 style={{ margin: "0 0 16px", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>🎯 New Goal</h3>
                            <form onSubmit={handleSubmit}>
                                {[{ label: "Goal Name", type: "text", val: name, set: setName, ph: "e.g. Emergency Fund" },
                                { label: "Target Amount (₹)", type: "number", val: target, set: setTarget, ph: "e.g. 100000" },
                                { label: "Already Saved (₹)", type: "number", val: saved, set: setSaved, ph: "0" }].map(f => (
                                    <div key={f.label} style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
                                        <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} required={f.label !== "Already Saved (₹)"}
                                            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                    </div>
                                ))}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6, fontWeight: 600 }}>Deadline (optional)</label>
                                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                                        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
                                    {loading ? "Saving..." : "💾 Save Goal"}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {goals.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎯</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No goals yet! Set your first financial goal.</p>
                    </div>
                ) : goals.map((goal, i) => {
                    const pct = Math.min((Number(goal.saved) / Number(goal.target)) * 100, 100);
                    return (
                        <motion.div key={goal.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ marginBottom: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 2px", color: "var(--text-primary)" }}>{goal.name}</p>
                                    {goal.deadline && <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>📅 {new Date(goal.deadline).toLocaleDateString("en-IN")}</p>}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => setAddingTo(addingTo === goal.id ? null : goal.id)}
                                        style={{ background: "#D1FAE5", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#065F46" }}>+ Add</button>
                                    <button onClick={() => setDeleteConfirm(goal.id)}
                                        style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: "#EF4444" }}>🗑️</button>
                                </div>
                            </div>
                            <div style={{ height: 8, background: "var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                                    style={{ height: "100%", background: pct >= 100 ? "#10B981" : "var(--gradient)", borderRadius: 10 }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>₹{Number(goal.saved).toLocaleString("en-IN")} saved</p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", margin: 0 }}>{pct.toFixed(0)}% of ₹{Number(goal.target).toLocaleString("en-IN")}</p>
                            </div>
                            <AnimatePresence>
                                {addingTo === goal.id && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 12, display: "flex", gap: 8 }}>
                                        <input type="number" placeholder="Amount to add" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                                            style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 13, outline: "none" }} />
                                        <button onClick={() => handleAddAmount(goal)} className="btn-primary" style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>Add</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}

                <AnimatePresence>
                    {deleteConfirm && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)}
                                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 9998 }} />
                            <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
                                <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                                    style={{ background: "var(--card-bg)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                                    <p style={{ fontSize: 40, textAlign: "center", margin: "0 0 12px" }}>🗑️</p>
                                    <h3 style={{ textAlign: "center", color: "#EF4444", margin: "0 0 20px", fontFamily: "Poppins" }}>Delete Goal?</h3>
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
export default Goals;