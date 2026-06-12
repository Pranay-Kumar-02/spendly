import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const Subscriptions = () => {
    const { user, darkMode, currentLanguage } = useApp();

    const [subscriptions, setSubscriptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: "", ok: true });

    // Form States
    const [subName, setSubName] = useState("");
    const [subAmount, setSubAmount] = useState("");
    const [subCategory, setSubCategory] = useState("Entertainment");
    const [subCycle, setSubCycle] = useState("Monthly");
    const [nextDate, setNextDate] = useState("");

    // 14-Language Dictionary
    const t = {
        title: { English: "Subscriptions", "हिंदी": "सदस्यता", "తెలుగు": "సబ్‌స్క్రిప్షన్లు", "ಕನ್ನಡ": "ಚಂದಾದಾರಿಕೆಗಳು" }[currentLanguage] || "Subscriptions",
        addBtn: { English: "+ New Subscription", "हिंदी": "+ नई सदस्यता", "తెలుగు": "+ కొత్త సబ్‌స్క్రిప్షన్", "ಕನ್ನಡ": "+ ಹೊಸ ಚಂದಾದಾರಿಕೆ" }[currentLanguage] || "+ New Subscription",
        monthlyCost: { English: "Total Monthly Cost", "हिंदी": "कुल मासिक लागत", "తెలుగు": "మొత్తం నెలవారీ ఖర్చు", "ಕನ್ನಡ": "ಒಟ್ಟು ಮಾಸಿಕ ವೆಚ್ಚ" }[currentLanguage] || "Total Monthly Cost",
        activeSubs: { English: "Active Subs", "हिंदी": "सक्रिय सदस्यता", "తెలుగు": "యాక్టివ్ సబ్‌స్క్రిప్షన్లు", "ಕನ್ನಡ": "ಸಕ್ರಿಯ ಚಂದಾದಾರಿಕೆಗಳು" }[currentLanguage] || "Active Subs",
        upcoming: { English: "Due in 7 Days", "हिंदी": "7 दिनों में देय", "తెలుగు": "7 రోజుల్లో చెల్లించాల్సినవి", "ಕನ್ನಡ": "7 ದಿನಗಳಲ್ಲಿ ಪಾವತಿಸಬೇಕಿದೆ" }[currentLanguage] || "Due in 7 Days",
        renewsOn: { English: "Renews on", "हिंदी": "नवीनीकरण", "తెలుగు": "పునరుద్ధరణ తేదీ", "ಕನ್ನಡ": "ನವೀಕರಣ ದಿನಾಂಕ" }[currentLanguage] || "Renews on",
        daysLeft: { English: "days left", "हिंदी": "दिन शेष", "తెలుగు": "రోజులు మిగిలి ఉన్నాయి", "ಕನ್ನಡ": "ದಿನಗಳು ಬಾಕಿ" }[currentLanguage] || "days left",
        today: { English: "Due Today!", "हिंदी": "आज देय", "తెలుగు": "ఈరోజే చెల్లించాలి!", "ಕನ್ನಡ": "ಇಂದು ಪಾವತಿಸಬೇಕು!" }[currentLanguage] || "Due Today!",
        cancelSub: { English: "Delete", "हिंदी": "हटाएं", "తెలుగు": "తొలగించు", "ಕನ್ನಡ": "ಅಳಿಸಿ" }[currentLanguage] || "Delete",
        saveBtn: { English: "Save Subscription", "हिंदी": "सहेजें", "తెలుగు": "సేవ్ చేయండి", "ಕನ್ನಡ": "ಉಳಿಸಿ" }[currentLanguage] || "Save Subscription",
    };

    const categories = ["Entertainment", "Utilities", "Rent", "Health", "Education", "Other"];

    const getIcon = (cat) => {
        const icons = { Entertainment: "🎬", Utilities: "💡", Rent: "🏠", Health: "💊", Education: "📚", Other: "🔁" };
        return icons[cat] || "🔁";
    };

    const toast = useCallback((text, ok = true) => {
        setMsg({ text, ok });
        setTimeout(() => setMsg({ text: "", ok: true }), 3500);
    }, []);

    // ── 1. FETCH SUBSCRIPTIONS ──
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "subscriptions"), where("userId", "==", user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setSubscriptions(data.sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate)));
        });
        return () => unsub();
    }, [user]);

    // ── 2. THE AUTOMATION ENGINE (CLIENT-SIDE) ──
    useEffect(() => {
        if (subscriptions.length === 0 || !user) return;

        const processDueSubscriptions = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize to start of day

            for (const sub of subscriptions) {
                const subDate = new Date(sub.nextDate);

                if (subDate <= today) {
                    try {
                        // 1. Auto-log the expense
                        await addDoc(collection(db, "expenses"), {
                            userId: user.uid,
                            amount: Number(sub.amount),
                            category: sub.category,
                            description: `Auto-Paid: ${sub.name}`,
                            date: new Date().toISOString(),
                            isAutoPaid: true
                        });

                        // 2. Calculate the next billing cycle
                        let newNextDate = new Date(sub.nextDate);
                        if (sub.cycle === "Monthly") newNextDate.setMonth(newNextDate.getMonth() + 1);
                        if (sub.cycle === "Yearly") newNextDate.setFullYear(newNextDate.getFullYear() + 1);

                        // 3. Update the subscription record in Firebase
                        await updateDoc(doc(db, "subscriptions", sub.id), {
                            nextDate: newNextDate.toISOString()
                        });

                        toast(`✅ Auto-paid ${sub.name} (₹${sub.amount})!`);
                    } catch (err) {
                        console.error("Auto-pay failed:", err);
                    }
                }
            }
        };

        processDueSubscriptions();
    }, [subscriptions, user, toast]);

    // ── 3. ADD NEW SUBSCRIPTION ──
    const handleAddSub = async (e) => {
        e.preventDefault();
        if (!subName || !subAmount || !nextDate) { toast("❌ Please fill all fields", false); return; }
        setLoading(true);
        try {
            await addDoc(collection(db, "subscriptions"), {
                userId: user.uid,
                name: subName,
                amount: Number(subAmount),
                category: subCategory,
                cycle: subCycle,
                nextDate: new Date(nextDate).toISOString(),
                createdAt: new Date().toISOString()
            });
            toast(`✅ ${subName} subscription added!`);
            setShowModal(false);
            setSubName(""); setSubAmount(""); setNextDate("");
        } catch (err) { toast("❌ Failed to add", false); }
        setLoading(false);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete ${name} subscription?`)) return;
        await deleteDoc(doc(db, "subscriptions", id));
        toast(`🗑️ ${name} deleted.`);
    };

    // Computations
    const totalMonthly = subscriptions.reduce((sum, s) => sum + (s.cycle === "Yearly" ? Number(s.amount) / 12 : Number(s.amount)), 0);
    const upcomingThisWeek = subscriptions.filter(s => {
        const diff = (new Date(s.nextDate) - new Date()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
    }).length;

    return (
        <div className={`reports-page ${darkMode ? "dark-mode" : ""}`} style={{ minHeight: "100vh", background: "var(--background)" }}>
            <Navbar title={t.title} />
            <div className="page-container">

                <style>{`
                    .sub-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
                    .sub-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.05); border-color: var(--primary); }
                    
                    .sub-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 999999; padding: 16px; }
                    .sub-modal-container { background: var(--card-bg); width: 100%; max-width: 440px; border-radius: 24px; box-shadow: 0 24px 50px rgba(0,0,0,0.3); display: flex; flex-direction: column; max-height: 90vh; border: 1px solid var(--border); overflow: hidden; }
                    
                    .premium-input-group { display: flex; align-items: center; background: var(--background); border: 2px solid var(--border); border-radius: 16px; padding: 14px 18px; transition: all 0.3s ease; margin-bottom: 16px; position: relative; }
                    .premium-input-group:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(124,58,237,0.1); background: var(--card-bg); }
                    .premium-input-group input, .premium-input-group select { flex: 1; background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 15px; font-weight: 500; width: 100%; font-family: 'Poppins', sans-serif; }
                    .premium-input-group select { appearance: none; -webkit-appearance: none; cursor: pointer; }
                    .custom-select-arrow { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); pointer-events: none; font-size: 12px; color: var(--text-secondary); }
                    
                    /* Hiding default number spinner arrows */
                    .premium-input-group input[type=number]::-webkit-inner-spin-button, .premium-input-group input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                `}</style>

                {/* Toast */}
                <AnimatePresence>
                    {msg.text && (
                        <motion.div initial={{ opacity: 0, y: -16, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16 }}
                            style={{ position: "sticky", top: 12, zIndex: 9999, padding: "14px 18px", borderRadius: 16, marginBottom: 16, fontWeight: 600, fontSize: 14, background: msg.ok ? "#D1FAE5" : "#FEE2E2", color: msg.ok ? "#065F46" : "#991B1B", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                            {msg.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Top Action & Stats */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{t.title}</h2>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
                        style={{ background: "var(--gradient)", color: "white", border: "none", padding: "10px 18px", borderRadius: 14, fontWeight: 600, fontFamily: "Poppins", cursor: "pointer", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)" }}>
                        {t.addBtn}
                    </motion.button>
                </div>

                <div className="summary-grid" style={{ marginBottom: 24 }}>
                    <div className="summary-card" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: "16px", borderRadius: "20px" }}>
                        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 4px 0", fontWeight: 600 }}>{t.monthlyCost}</p>
                        <h3 style={{ color: "var(--text-primary)", fontSize: 24, margin: 0, fontWeight: 800 }}>₹{Math.round(totalMonthly).toLocaleString("en-IN")}</h3>
                    </div>
                    <div className="summary-card" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: "16px", borderRadius: "20px" }}>
                        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 4px 0", fontWeight: 600 }}>{t.activeSubs}</p>
                        <h3 style={{ color: "var(--text-primary)", fontSize: 24, margin: 0, fontWeight: 800 }}>{subscriptions.length}</h3>
                    </div>
                    <div className="summary-card" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: "16px", borderRadius: "20px" }}>
                        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 4px 0", fontWeight: 600 }}>{t.upcoming}</p>
                        <h3 style={{ color: "#F59E0B", fontSize: 24, margin: 0, fontWeight: 800 }}>{upcomingThisWeek}</h3>
                    </div>
                </div>

                {/* Subscriptions List */}
                {subscriptions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--card-bg)", borderRadius: 20, border: "2px dashed var(--border)" }}>
                        <span style={{ fontSize: 44, display: "block", marginBottom: 12 }}>🤖</span>
                        <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: 18 }}>No active subscriptions.</p>
                        <p style={{ fontSize: 14, marginTop: 8, color: "var(--text-secondary)" }}>Add your recurring bills here to automate your expense tracking!</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {subscriptions.map((sub, i) => {
                            const daysDiff = Math.ceil((new Date(sub.nextDate) - new Date()) / (1000 * 60 * 60 * 24));
                            const isUrgent = daysDiff <= 3;

                            return (
                                <motion.div key={sub.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="sub-card">
                                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "1px solid var(--border)" }}>
                                            {getIcon(sub.category)}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{sub.name}</h4>
                                            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                                                {t.renewsOn}: <strong style={{ color: "var(--text-primary)" }}>{new Date(sub.nextDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</strong> • {sub.cycle}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                        <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>₹{Number(sub.amount).toLocaleString("en-IN")}</h4>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: isUrgent ? "#FEE2E2" : "var(--background)", color: isUrgent ? "#EF4444" : "var(--text-secondary)" }}>
                                                {daysDiff === 0 ? t.today : `${daysDiff} ${t.daysLeft}`}
                                            </span>
                                            <button onClick={() => handleDelete(sub.id, sub.name)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 14, padding: 4 }}>🗑️</button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* ── MODAL: ADD SUBSCRIPTION (Polished UI) ── */}
                <AnimatePresence>
                    {showModal && (
                        <div className="sub-modal-overlay">
                            <motion.div className="sub-modal-container" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>

                                <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
                                        🤖 Automate Bill
                                    </h3>
                                    <button onClick={() => setShowModal(false)} style={{ background: "var(--background)", border: "none", width: 36, height: 36, borderRadius: "50%", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", transition: "all 0.2s" }}>✕</button>
                                </div>

                                <form onSubmit={handleAddSub} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                                    <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>

                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Service Name</label>
                                        <div className="premium-input-group">
                                            <span style={{ marginRight: 12, fontSize: 20 }}>📝</span>
                                            <input type="text" placeholder="Netflix, Rent, Spotify..." value={subName} onChange={e => setSubName(e.target.value)} required />
                                        </div>

                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Amount (₹)</label>
                                        <div className="premium-input-group">
                                            <span style={{ marginRight: 12, fontSize: 18, color: "var(--text-primary)", fontWeight: 800 }}>₹</span>
                                            <input type="number" placeholder="499" value={subAmount} onChange={e => setSubAmount(e.target.value)} required />
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Category</label>
                                                <div className="premium-input-group">
                                                    <select value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <span className="custom-select-arrow">▼</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Cycle</label>
                                                <div className="premium-input-group">
                                                    <select value={subCycle} onChange={e => setSubCycle(e.target.value)}>
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="Yearly">Yearly</option>
                                                    </select>
                                                    <span className="custom-select-arrow">▼</span>
                                                </div>
                                            </div>
                                        </div>

                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Next Billing Date</label>
                                        <div className="premium-input-group">
                                            <span style={{ marginRight: 12, fontSize: 20 }}>📅</span>
                                            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
                                        </div>

                                        <div style={{ background: "var(--primary)15", borderRadius: 16, padding: "16px", border: "1px solid var(--primary)30", display: "flex", gap: 12, marginTop: 8 }}>
                                            <span style={{ fontSize: 20 }}>⚡</span>
                                            <p style={{ fontSize: 12, color: "var(--text-primary)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                                                On this exact date, Spendly will automatically log this as an expense and schedule the next cycle.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, background: "var(--background)" }}>
                                        <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "16px", border: "2px solid var(--border)", borderRadius: "16px", background: "transparent", color: "var(--text-secondary)", fontWeight: 700, cursor: "pointer", fontSize: "14px", transition: "all 0.2s" }}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: "16px", borderRadius: "16px", fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)" }}>
                                            {loading ? "Saving..." : t.saveBtn}
                                        </button>
                                    </div>

                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Subscriptions;