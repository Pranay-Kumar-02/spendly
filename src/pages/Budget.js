import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabase/supabase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const CATEGORIES = [
    { value: "Groceries", name: "Groceries", icon: "🛒", color: "#10B981" },
    { value: "Rent", name: "Rent", icon: "🏠", color: "#EF4444" },
    { value: "Transport", name: "Transport", icon: "🚗", color: "#F59E0B" },
    { value: "Food", name: "Food", icon: "🍕", color: "#EC4899" },
    { value: "Health", name: "Health", icon: "💊", color: "#3B82F6" },
    { value: "Entertainment", name: "Entertainment", icon: "🎬", color: "#8B5CF6" },
    { value: "Education", name: "Education", icon: "📚", color: "#06B6D4" },
    { value: "Shopping", name: "Shopping", icon: "🛍️", color: "#F97316" },
    { value: "Utilities", name: "Utilities", icon: "💡", color: "#6B7280" },
    { value: "Other", name: "Other", icon: "💰", color: "#7C3AED" },
];

const Budget = () => {
    const { user, darkMode, refreshBudget } = useApp();
    const [budgets, setBudgets] = useState({});
    const [editing, setEditing] = useState(null);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchBudgets = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from("budgets").select("*").eq("id", user.id).maybeSingle();
            if (error) {
                console.error("Error fetching budgets:", error);
                return;
            }
            if (data) setBudgets(data);
        } catch (err) {
            console.error("Error in fetchBudgets:", err);
        }
    }, [user]);

    useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

    const handleSave = async (categoryValue) => {
        if (!user) return;
        setLoading(true);
        try {
            const updated = { ...budgets, id: user.id, [categoryValue]: Number(value) };
            const { error } = await supabase.from("budgets").upsert(updated);
            if (error) throw error;
            setBudgets(updated);
            setEditing(null);
            setValue("");
            if (refreshBudget) refreshBudget();
        } catch (err) {
            console.error("Error updating budget category:", err);
        }
        setLoading(false);
    };

    const totalBudget = CATEGORIES.reduce((s, c) => s + Number(budgets[c.value] || 0), 0);

    return (
        <div className={darkMode ? "dark-mode" : ""}>
            <Navbar title="Budget" />
            <div className="page-container">
                <motion.div className="card" style={{ background: "var(--gradient)", color: "white", textAlign: "center", padding: "24px", marginBottom: 16 }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ opacity: 0.9, marginBottom: 8, marginTop: 0, fontSize: "14px" }}>Total Monthly Budget</p>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>₹{totalBudget.toLocaleString("en-IN")}</h2>
                </motion.div>

                <h3 style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px", fontSize: 15 }}>Set Category Budgets</h3>

                {CATEGORIES.map((cat, index) => (
                    <motion.div key={cat.value} className="card" style={{ marginBottom: 10, padding: "14px 16px" }}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{cat.icon}</div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px", fontSize: 14 }}>{cat.name}</p>
                                <p style={{ fontSize: 13, color: cat.color, fontWeight: 700, margin: 0 }}>₹{(budgets[cat.value] || 0).toLocaleString("en-IN")}</p>
                            </div>
                            <button onClick={() => { setEditing(cat.value); setValue(budgets[cat.value] || ""); }}
                                style={{ background: "var(--background)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "var(--primary)", fontWeight: 600, fontSize: 13, fontFamily: "Poppins" }}>
                                Edit
                            </button>
                        </div>
                        {editing === cat.value && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
                                <input type="number" placeholder="Enter budget amount" value={value} onChange={e => setValue(e.target.value)}
                                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
                                <button className="btn-primary" onClick={() => handleSave(cat.value)} disabled={loading}
                                    style={{ width: "100%", padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                                    {loading ? "Saving..." : "Save Budget"}
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
export default Budget;