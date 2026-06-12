import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const GOAL_ICONS = ["🏠", "🚗", "✈️", "📱", "💍", "🎓", "💰", "🏖️", "🏋️", "🎯"];

const Goals = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [target, setTarget] = useState("");
    const [saved, setSaved] = useState("");
    const [icon, setIcon] = useState("🎯");
    const [deadline, setDeadline] = useState("");
    const [loading, setLoading] = useState(false);
    const [addAmount, setAddAmount] = useState({});

    // 3. SECURE MULTILINGUAL LOCALIZATION STRINGS MATRIX FOR ALL LAYOUT BLOCKS
    const gLabels = {
        title: { English: "My Financial Goals", "हिंदी": "मेरे वित्तीय लक्ष्य", "తెలుగు": "నా ఆర్థిక లక్ష్యాలు", "ಕನ್ನಡ": "ನನ್ನ ಹಣಕಾಸು ಗುರಿಗಳು", "മലയാളം": "എന്റെ സാമ്പത്തിക ലക്ഷ്യങ്ങൾ" }[currentLanguage] || "My Financial Goals",
        addGoalBtn: { English: "➕ Add New Goal", "हिंदी": "➕ नया लक्ष्य जोड़ें", "తెలుగు": "➕ కొత్త లక్ష్యాన్ని చేర్చు", "ಕನ್ನಡ": "➕ ಹೊಸ ಗುರಿ ಸೇರಿಸಿ", "മലയാളം": "➕ പുതിയ ലക്ഷ്യം ചേർക്കുക" }[currentLanguage] || "➕ Add New Goal",
        cancelBtn: { English: "✕ Cancel", "हिंदी": "✕ रद्द करें", "తెలుగు": "✕ రద్దు చేయi", "ಕನ್ನಡ": "✕ ರದ್ದುಗೊಳಿಸಿ", "മലയാളം": "✕ റദ്ദാക്കുക" }[currentLanguage] || "✕ Cancel",
        newGoalHeader: { English: "New Goal", "हिंदी": "नया लक्ष्य", "తెలుగు": "కొత్త లక్ష్యం", "ಕನ್ನಡ": "ಹೊಸ ಗುರಿ", "മലയാളം": "പുതിയ ലക്ഷ്യം" }[currentLanguage] || "New Goal",
        chooseIconLabel: { English: "Choose Icon", "हिंदी": "आइकन चुनें", "తెలుగు": "ఐకాన్ ఎంచుకోండి", "ಕನ್ನಡ": "ಚಿಹ್ನೆ ಆಯ್ಕೆಮಾಡಿ", "മലയാളം": "ഐക്കൺ തിരഞ്ഞെടുക്കുക" }[currentLanguage] || "Choose Icon",
        goalNameLabel: { English: "Goal Name", "हिंदी": "लक्ष्य का नाम", "తెలుగు": "లక్ష్యం పేరు", "ಕನ್ನಡ": "ಗುರಿಯ ಹೆಸರು", "മലയാളം": "ലക്ഷ്യത്തിന്റെ പേര്" }[currentLanguage] || "Goal Name",
        targetAmountLabel: { English: "Target Amount (₹)", "हिंदी": "लक्ष्य राशि (₹)", "తెలుగు": "లక్ష్యం మొత్తం (₹)", "ಕನ್ನಡ": "ನಿಗದಿತ ಒಟ್ಟು ಮೊತ್ತ (₹)", "മലയാളം": "ലക്ഷ്യമിടുന്ന തുക (₹)" }[currentLanguage] || "Target Amount (₹)",
        alreadySavedLabel: { English: "Already Saved (₹)", "हिंदी": "पहले से सहेजा गया (₹)", "తెలుగు": "ఇప్పటివరకు దాచిన మొత్తం (₹)", "ಕನ್ನಡ": "ಈಗಾಗಲೇ ಉಳಿತಾಯ ಮಾಡಿರುವ ಮೊತ್ತ (₹)", "മലയാളം": "നിലവിൽ ശേഖരിച്ച തുക (₹)" }[currentLanguage] || "Already Saved (₹)",
        targetDateLabel: { English: "Target Date", "हिंदी": "लक्ष्य तिथि", "తెలుగు": "గడువు తేదీ", "ಕನ್ನಡ": "ಗುರಿಯ ದಿನಾಂಕ", "മലയാളം": "ലക്ഷ്യമിടുന്ന തീയതി" }[currentLanguage] || "Target Date",
        saveGoalBtn: { English: "Save Goal", "हिंदी": "लक्ष्य सहेजें", "తెలుగు": "లక్ష్యాన్ని సేవ్ చేయి", "ಕನ್ನಡ": "ಗುರಿ ಉಳಿಸಿ", "മലയാളം": "ലക്ഷ്യം സേവ് ചെയ്യുക" }[currentLanguage] || "Save Goal",
        savingStatus: { English: "Saving...", "हिंदी": "सहेज रहा हूँ...", "తెలుగు": "సేవ్ చేస్తోంది...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", "മലയാളം": "സേവ് ചെയ്യുന്നു..." }[currentLanguage] || "Saving...",
        noGoalsHeader: { English: "🎯 No goals yet!", "हिंदी": "🎯 अभी तक कोई लक्ष्य नहीं है!", "తెలుగు": "🎯 లక్ష్యాలు ఏవీ ఇంకా చేర్చలేదు!", "ಕನ್ನಡ": "🎯 ಇನ್ನು ಯಾವುದೇ ಗುರಿಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ!" }[currentLanguage] || "🎯 No goals yet!",
        noGoalsSub: { English: "Start by adding a savings goal", "हिंदी": "एक बचत लक्ष्य जोड़कर शुरुआत करें", "తెలుగు": "ఒక కొత్త ఆర్థిక లక్ష్యాన్ని చేర్చి ప్రారంభించండి", "ಕನ್ನಡ": "ಒಂದು ಉಳಿತಾಯದ ಗುರಿಯನ್ನು ಸೇರಿಸುವ ಮೂಲಕ ಪ್ರಾರಂಭಿಸಿ" }[currentLanguage] || "Start by adding a savings goal",
        byDeadline: { English: "By", "हिंदी": "तक", "తెలుగు": "గడువు తేదీ", "ಕನ್ನಡ": "ಒಳಗಾಗಿ", "മലയാളം": "തീയതിക്കുള്ളിൽ" }[currentLanguage] || "By",
        savedText: { English: "saved", "हिंदी": "सहेजा गया", "తెలుగు": "దాచారు", "ಕನ್ನಡ": "ಉಳಿತಾಯ ಮಾಡಲಾಗಿದೆ", "മലയാളം": "ശേഖരിച്ചു" }[currentLanguage] || "saved",
        completeText: { English: "complete", "हिंदी": "पूरा हुआ", "తెలుగు": "పూర్తయింది", "ಕನ್ನಡ": "ಪೂರ್ಣಗೊಂಡಿದೆ", "മലയാളം": "പൂർത്തിയായി" }[currentLanguage] || "complete",
        remainingText: { English: "remaining", "हिंदी": "शेष", "తెలుగు": "మిగిలి ఉంది", "ಕನ್ನಡ": "ಬಾಕಿ ಇದೆ", "മലയാളം": "ബാക്കിയുള്ളത്" }[currentLanguage] || "remaining",
        addAmountPlaceholder: { English: "Add amount", "हिंदी": "राशि जोड़ें", "తెలుగు": "మొత్తాన్ని చేర్చండి", "ಕನ್ನಡ": "ಮೊತ್ತ ಸೇರಿಸಿ", "മലയാളം": "തുക നൽകുക" }[currentLanguage] || "Add amount",
        addBtnText: { English: "Add", "हिंदी": "जोड़ें", "తెలుగు": "చేర్చు", "ಕನ್ನಡ": "ಸೇರಿಸಿ", "മലയാളം": "ചേർക്കുക" }[currentLanguage] || "Add",
        placeholderName: { English: "e.g. Buy a Car", "हिंदी": "जैसे: कार खरीदना", "తెలుగు": "ఉదా: కారు కొనడం", "ಕನ್ನಡ": "ಉದಾ: ಕಾರು ಖರೀದಿಸುವುದು" }[currentLanguage] || "e.g. Buy a Car",
        placeholderTarget: { English: "e.g. 500000", "हिंदी": "जैसे: 500000", "తెలుగు": "ఉదా: 500000", "ಕನ್ನಡ": "ಉದಾ: 500000" }[currentLanguage] || "e.g. 500000",
        placeholderSaved: { English: "e.g. 50000", "हिंदी": "जैसे: 50000", "తెలుగు": "ఉదా: 50000", "ಕನ್ನಡ": "ಉದಾ: 50000" }[currentLanguage] || "e.g. 50000"
    };

    // 4. FIREBASE SYNCS DATA STREAM ATTACHMENTS
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "goals"), where("userId", "==", user.uid));
        return onSnapshot(q, snap => setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [user]);

    // 5. DATABASE MUTATION WORK FLOWS
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name || !target) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "goals"), {
                userId: user.uid,
                name,
                target: Number(target),
                saved: Number(saved || 0),
                icon,
                deadline,
                createdAt: new Date().toISOString(),
            });
            setName(""); setTarget(""); setSaved(""); setDeadline("");
            setIcon("🎯");
            setShowForm(false);
        } catch (err) {
            console.error("Error writing entity schema to goals firebase collection:", err);
        }
        setLoading(false);
    };

    const handleAddSaving = async (goalId, currentSaved) => {
        const amount = Number(addAmount[goalId] || 0);
        if (!amount) return;
        try {
            await updateDoc(doc(db, "goals", goalId), { saved: currentSaved + amount });
            setAddAmount({ ...addAmount, [goalId]: "" });
        } catch (err) {
            console.error("Error executing operational savings adjustment trigger:", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "goals", id));
        } catch (err) {
            console.error("Error clearing targeted document item from ledger registry:", err);
        }
    };

    const formatLocalizedDate = (dateString) => {
        const dateObj = new Date(dateString);
        const localeCodes = { English: "en-IN", "हिंदी": "hi-IN", "తెలుగు": "te-IN", "ಕನ್ನಡ": "kn-IN", "മലയാളം": "ml-IN", "मराठी": "mr-IN", "ગુજરાતી": "gu-IN", "தமிழ்": "ta-IN" };
        const activeLocale = localeCodes[currentLanguage] || "en-IN";
        return dateObj.toLocaleDateString(activeLocale, { day: "numeric", month: "short", year: "numeric" });
    };

    return (
        <div className={`goals-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={gLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Avoids script compression errors across unique font families */}
                <style>{`
                    .card h3, .card p, .btn-primary, label { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Form Expand Trigger Action Panel Button */}
                <motion.button className="btn-primary" style={{ marginBottom: 16, width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px" }}
                    onClick={() => setShowForm(!showForm)} whileTap={{ scale: 0.95 }}>
                    {showForm ? gLabels.cancelBtn : gLabels.addGoalBtn}
                </motion.button>

                {/* New Goal Registration Workflow Frame */}
                {showForm && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
                        <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "16px" }}>{gLabels.newGoalHeader}</h3>

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8, fontWeight: 500 }}>{gLabels.chooseIconLabel}</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", background: "var(--background)", padding: "10px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                                {GOAL_ICONS.map(i => (
                                    <button type="button" key={i} onClick={() => setIcon(i)}
                                        style={{ fontSize: 22, background: icon === i ? "var(--primary)" : "transparent", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleAdd}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{gLabels.goalNameLabel}</label>
                                <input type="text" placeholder={gLabels.placeholderName} value={name} onChange={e => setName(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{gLabels.targetAmountLabel}</label>
                                <input type="number" placeholder={gLabels.placeholderTarget} value={target} onChange={e => setTarget(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{gLabels.alreadySavedLabel}</label>
                                <input type="number" placeholder={gLabels.placeholderSaved} value={saved} onChange={e => setSaved(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{gLabels.targetDateLabel}</label>
                                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}>
                                {loading ? gLabels.savingStatus : gLabels.saveGoalBtn}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Empty State Presentation Component Framework */}
                {goals.length === 0 ? (
                    <div className="empty-state card" style={{ textAlign: "center", padding: "36px 20px" }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>{gLabels.noGoalsHeader}</p>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", opacity: 0.85 }}>{gLabels.noGoalsSub}</p>
                    </div>
                ) : (
                    // Core Active Metric Cards Stream Layout Loops
                    goals.map((goal, index) => {
                        const progress = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
                        const remaining = Math.max(goal.target - goal.saved, 0);

                        return (
                            <motion.div key={goal.id} className="card"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                style={{ marginBottom: 14, padding: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                                    <span style={{ fontSize: 30, width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>{goal.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px 0", fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{goal.name}</h3>
                                        {goal.deadline && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{gLabels.byDeadline} {formatLocalizedDate(goal.deadline)}</p>}
                                    </div>
                                    <button type="button" onClick={() => handleDelete(goal.id)}
                                        style={{ background: darkMode ? "rgba(239, 68, 68, 0.12)" : "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>🗑️</button>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>₹{goal.saved.toLocaleString("en-IN")} {gLabels.savedText}</span>
                                        <span style={{ color: "var(--primary)", fontWeight: 700 }}>₹{goal.target.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div style={{ height: 10, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
                                        <motion.div
                                            style={{ height: "100%", background: "var(--gradient)", borderRadius: 10 }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1 }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 5, fontWeight: 500 }}>
                                        <span style={{ color: "var(--text-secondary)" }}>{progress.toFixed(0)}% {gLabels.completeText}</span>
                                        <span style={{ color: "#EF4444" }}>₹{remaining.toLocaleString("en-IN")} {gLabels.remainingText}</span>
                                    </div>
                                </div>

                                {/* Quick Incremental Deposit Block Setup */}
                                <div style={{ display: "flex", gap: 10, paddingTop: "8px", borderTop: "1px dashed var(--border)" }}>
                                    <input type="number" placeholder={gLabels.addAmountPlaceholder}
                                        value={addAmount[goal.id] || ""}
                                        onChange={e => setAddAmount({ ...addAmount, [goal.id]: e.target.value })}
                                        style={{ flex: 1, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", padding: "10px" }} />
                                    <button type="button" onClick={() => handleAddSaving(goal.id, goal.saved)}
                                        style={{ background: "var(--gradient)", color: "white", border: "none", borderRadius: 10, padding: "0 18px", cursor: "pointer", fontFamily: "Poppins", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>
                                        {gLabels.addBtnText} ₹
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}

            </div>
        </div>
    );
};

export default Goals;