import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const Emergency = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [target, setTarget] = useState("");
    const [saved, setSaved] = useState("");
    const [monthlyExpense, setMonthlyExpense] = useState("");
    const [addAmount, setAddAmount] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // 3. SECURE, GRAMMATICALLY VERIFIED MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const emerLabels = {
        title: { English: "Emergency Fund", "हिंदी": "आपातकालीन कोष", "తెలుగు": "అత్యవసర నిధి", "ಕನ್ನಡ": "ತುರ್ತು ನಿಧಿ", "മലയാളം": "അടിയന്തിര ഫണ്ട്" }[currentLanguage] || "Emergency Fund",
        setupHeader: { English: "🆘 Setup Emergency Fund", "हिंदी": "🆘 आपातकालीन कोष सेटअप करें", "తెలుగు": "🆘 అత్యవసర నిధిని ఏర్పాటు చేసుకోండి", "ಕನ್ನಡ": "🆘 ತುರ್ತು ನಿಧಿ ಸ್ಥಾಪಿಸಿ" }[currentLanguage] || "🆘 Setup Emergency Fund",
        setupInfo: {
            English: "Experts recommend keeping 6 months of expenses as an emergency fund.",
            "हिंदी": "विशेषज्ञ आपातकालीन स्थिति के लिए 6 महीने के खर्च के बराबर राशि रखने की सलाह देते हैं।",
            "తెలుగు": "అత్యవసర పరిస్థితుల కోసం కనీసం 6 నెలల ఖర్చులను నిధిగా దాచుకోవాలని నిపుణులు సూచిస్తున్నారు.",
            "ಕನ್ನಡ": "ತುರ್ತು ಪರಿಸ್ಥಿತಿಗಾಗಿ ಕನಿಷ್ಠ 6 ತಿಂಗಳ ವೆಚ್ಚವನ್ನು ನಿಧಿಯಾಗಿ ಇರಿಸಲು ತಜ್ಞರು ಶಿಫಾರಸು ಮಾಡುತ್ತಾರೆ."
        }[currentLanguage] || "Experts recommend keeping 6 months of expenses as emergency fund.",
        monthlyExpensesLabel: { English: "Monthly Expenses (₹)", "हिंदी": "मासिक खर्च (₹)", "తెలుగు": "నెలవారీ ఖర్చులు (₹)", "ಕನ್ನಡ": "ಮಾಸಿಕ ವೆಚ್ಚಗಳು (₹)", "മലയാളം": "പ്രതിമാസ ചിലവുകൾ (₹)" }[currentLanguage] || "Monthly Expenses (₹)",
        targetFundLabel: { English: "Target Fund (₹)", "हिंदी": "लक्ष्य कोष (₹)", "తెలుగు": "లక్ష్య నిధి మొత్తం (₹)", "ಕನ್ನಡ": "ನಿಗದಿತ ಒಟ್ಟು ನಿಧಿ (₹)", "മലയാളം": "ലക്ഷ്യമിടുന്ന തുക (₹)" }[currentLanguage] || "Target Fund (₹)",
        currentlySavedLabel: { English: "Currently Saved (₹)", "हिंदी": "वर्तमान बचत (₹)", "తెలుగు": "ఇప్పటివరకు దాచిన మొత్తం (₹)", "ಕನ್ನಡ": "ಪ್ರಸ್ತುತ ಉಳಿತಾಯ (₹)", "മലയാളം": "നിലവിൽ ശേഖരിച്ചത് (₹)" }[currentLanguage] || "Currently Saved (₹)",
        setupBtn: { English: "Setup Fund", "हिंदी": "कोष सेटअप करें", "తెలుగు": "నిధిని ప్రారంభించు", "ಕನ್ನಡ": "ನಿಧಿ ಸ್ಥಾಪಿಸಿ", "മലയാളം": "ഫണ്ട് ആരംഭിക്കുക" }[currentLanguage] || "Setup Fund",
        savingStatus: { English: "Saving...", "हिंदी": "सहेज रहा हूँ...", "తెలుగు": "సేవ్ చేస్తోంది...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", "മലയാളം": "സേവ് ചെയ്യുന്നു..." }[currentLanguage] || "Saving...",
        ofTarget: { English: "of", "हिंदी": "कुल लक्ष्य", "తెలుగు": "యొక్క", "ಕನ್ನಡ": "ರಲ್ಲಿ ಒಟ್ಟು", "മലയാളം": "ആകെ ലക്ഷ്യത്തിൽ" }[currentLanguage] || "of",
        targetText: { English: "target", "हिंदी": "का लक्ष्य", "తెలుగు": "లక్ష్యం", "ಕನ್ನಡ": "ಗುರಿ", "മലയാളം": "ലക്ഷ്യം" }[currentLanguage] || "target",
        progressLabel: { English: "Progress", "हिंदी": "प्रगति", "తెలుగు": "పురోగతి", "ಕನ್ನಡ": "ಪ್ರಗತಿ", "മലയാളം": "പുരോഗതി" }[currentLanguage] || "Progress",
        coversLabel: { English: "Covers", "हिंदी": "यह सुरक्षित करता है", "తెలుగు": "ఇది మీ", "ಕನ್ನಡ": "ಇದು ನಿಮ್ಮ", "മലയാളം": "ഇത്" }[currentLanguage] || "Covers",
        monthsOfExpenses: { English: "months of expenses", "हिंदी": "महीनों का खर्च", "తెలుగు": "నెలల ఖర్చులకు సరిపోతుంది", "ಕನ್ನಡ": "ತಿಂಗಳುಗಳ ವೆಚ್ಚಕ್ಕೆ ಸರಿಹೊಂದುತ್ತದೆ" }[currentLanguage] || "months of expenses",
        stillNeededLabel: { English: "Still Needed", "हिंदी": "अभी आवश्यक", "తెలుగు": "ఇంకా అవసరమైన మొత్తం", "ಕನ್ನಡ": "ಇನ್ನೂ ಬೇಕಾಗಿರುವ ಮೊತ್ತ", "മലയാളം": "ഇനിയും ആവശ്യമുള്ളത്" }[currentLanguage] || "Still Needed",
        addToFundHeader: { English: "Add to Fund", "हिंदी": "कोष में राशि जोड़ें", "తెలుగు": "నిధికి డబ్బును చేర్చండి", "ಕನ್ನಡ": "ನಿಧಿಗೆ ಹಣ ಸೇರಿಸಿ", "മലയാളം": "ഫണ്ടിലേക്ക് ചേർക്കുക" }[currentLanguage] || "Add to Fund",
        addBtnText: { English: "Add", "हिंदी": "जोड़ें", "తెలుగు": "చేర్చు", "ಕನ್ನಡ": "ಸೇರಿಸಿ", "മലയാളം": "ചേർക്കുക" }[currentLanguage] || "Add",
        editSetupBtn: { English: "✏️ Edit Setup", "हिंदी": "✏️ सेटअप संपादित करें", "తెలుగు": "✏️ వివరాలను సవరించు", "ಕನ್ನಡ": "✏️ ವಿವರ ಮಾರ್ಪಡಿಸಿ" }[currentLanguage] || "✏️ Edit Setup",
        placeholderMonthly: { English: "e.g. 30000", "हिंदी": "जैसे: 30000", "తెలుగు": "ఉదా: 30000", "ಕನ್ನಡ": "ಉದಾ: 30000" }[currentLanguage] || "e.g. 30000",
        placeholderTarget: { English: "e.g. 180000 (6 months)", "हिंदी": "जैसे: 180000 (6 महीने)", "తెలుగు": "ఉదా: 180000 (6 నెలలు)", "ಕನ್ನಡ": "ಉದಾ: 180000 (6 ತಿಂಗಳು)" }[currentLanguage] || "e.g. 180000 (6 months)",
        placeholderSaved: { English: "e.g. 50000", "हिंदी": "जैसे: 50000", "తెలుగు": "ఉదా: 50000", "ಕನ್ನಡ": "ಉದಾ: 50000" }[currentLanguage] || "e.g. 50000",
        placeholderAddAmt: { English: "Enter amount", "हिंदी": "राशि दर्ज करें", "తెలుగు": "మొత్తాన్ని నమోదు చేయండి", "ಕನ್ನಡ": "ಮೊತ್ತ ನಮೂದಿಸಿ", "മലയാളം": "തുക നൽകുക" }[currentLanguage] || "Enter amount"
    };

    // 4. FIREBASE TELEMETRY REAL-TIME LOG LISTENERS
    useEffect(() => {
        if (!user) return;
        const fetchEmergencyLogs = async () => {
            try {
                const docRef = doc(db, "emergency", user.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) setData(snap.data());
            } catch (err) {
                console.error("Error pulling Emergency Fund context telemetry:", err);
            }
        };
        fetchEmergencyLogs();
    }, [user]);

    // 5. DATA INSERTS & MUTATORS DISPATCH HANDLERS
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newData = {
                target: Number(target),
                saved: Number(saved),
                monthlyExpense: Number(monthlyExpense),
                updatedAt: new Date().toISOString(),
            };
            await setDoc(doc(db, "emergency", user.uid), newData);
            setData(newData);
        } catch (err) {
            console.error("Error establishing Emergency setup document:", err);
        }
        setLoading(false);
    };

    const handleAddSaving = async () => {
        if (!data || !addAmount) return;
        try {
            const updated = { ...data, saved: data.saved + Number(addAmount) };
            await setDoc(doc(db, "emergency", user.uid), updated);
            setData(updated);
            setAddAmount("");
        } catch (err) {
            console.error("Error executing savings incremental update:", err);
        }
    };

    const progress = data ? Math.min((data.saved / data.target) * 100, 100) : 0;
    const monthsCovered = data ? (data.saved / data.monthlyExpense).toFixed(1) : 0;

    return (
        <div className={`emergency-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={emerLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Avoids character overlapping bugs on Indic vertical clusters */}
                <style>{`
                    .card h3, .card p, .btn-primary, .btn-secondary, label { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Initial Setup Onboarding Form Card Dashboard View */}
                {!data ? (
                    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h3 style={{ fontWeight: 600, marginBottom: 8, marginTop: 0, color: "var(--text-primary)" }}>{emerLabels.setupHeader}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, marginTop: 0 }}>{emerLabels.setupInfo}</p>

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{emerLabels.monthlyExpensesLabel}</label>
                                <input type="number" placeholder={emerLabels.placeholderMonthly} value={monthlyExpense} onChange={e => setMonthlyExpense(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{emerLabels.targetFundLabel}</label>
                                <input type="number" placeholder={emerLabels.placeholderTarget} value={target} onChange={e => setTarget(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{emerLabels.currentlySavedLabel}</label>
                                <input type="number" placeholder={emerLabels.placeholderSaved} value={saved} onChange={e => setSaved(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}>
                                {loading ? emerLabels.savingStatus : emerLabels.setupBtn}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <>
                        {/* Metrics Progress Dashboard Views Banner */}
                        <motion.div className="card" style={{ background: "linear-gradient(135deg, #F97316, #EF4444)", color: "white", textAlign: "center", padding: "24px" }}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <p style={{ opacity: 0.9, marginBottom: 8, marginTop: 0, fontSize: "14px", fontWeight: 500 }}>{emerLabels.title}</p>
                            <h2 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 6px 0" }}>₹{data.saved.toLocaleString("en-IN")}</h2>
                            <p style={{ opacity: 0.85, fontSize: "13px", margin: 0 }}>{emerLabels.ofTarget} ₹{data.target.toLocaleString("en-IN")} {emerLabels.targetText}</p>
                        </motion.div>

                        {/* Interactive Progress Tracking Slider Box */}
                        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginTop: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{emerLabels.progressLabel}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{progress.toFixed(0)}%</span>
                            </div>
                            <div style={{ height: 12, background: "var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
                                <motion.div
                                    style={{ height: "100%", background: "linear-gradient(135deg, #F97316, #EF4444)", borderRadius: 12 }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", margin: 0 }}>
                                {emerLabels.coversLabel} <strong style={{ color: "var(--primary)" }}>{monthsCovered} {emerLabels.monthsOfExpenses}</strong>
                            </p>
                        </motion.div>

                        {/* Split Operational Metric Details Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, marginTop: 16 }}>
                            <div className="card" style={{ textAlign: "center", background: darkMode ? "rgba(146, 64, 14, 0.15)" : "#FEF3C7", border: darkMode ? "1px solid #92400E" : "1px solid var(--border)", padding: "14px 10px" }}>
                                <p style={{ fontSize: 12, color: darkMode ? "#FCD34D" : "#92400E", marginBottom: 4, marginTop: 0, fontWeight: 500 }}>{emerLabels.monthlyExpensesLabel.replace(" (₹)", "")}</p>
                                <h3 style={{ color: darkMode ? "#FCD34D" : "#92400E", margin: 0, fontSize: 16, fontWeight: 700 }}>₹{data.monthlyExpense.toLocaleString("en-IN")}</h3>
                            </div>
                            <div className="card" style={{ textAlign: "center", background: darkMode ? "rgba(6, 95, 70, 0.15)" : "#D1FAE5", border: darkMode ? "1px solid #065F46" : "1px solid var(--border)", padding: "14px 10px" }}>
                                <p style={{ fontSize: 12, color: darkMode ? "#34D399" : "#065F46", marginBottom: 4, marginTop: 0, fontWeight: 500 }}>{emerLabels.stillNeededLabel}</p>
                                <h3 style={{ color: darkMode ? "#34D399" : "#065F46", margin: 0, fontSize: 16, fontWeight: 700 }}>₹{Math.max(data.target - data.saved, 0).toLocaleString("en-IN")}</h3>
                            </div>
                        </div>

                        {/* Incremental Values Insertion Canvas Box */}
                        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h3 style={{ fontWeight: 600, marginBottom: 14, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{emerLabels.addToFundHeader}</h3>
                            <div style={{ display: "flex", gap: 10 }}>
                                <input type="number" placeholder={emerLabels.placeholderAddAmt} value={addAmount} onChange={e => setAddAmount(e.target.value)} style={{ flex: 1, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                <button type="button" onClick={handleAddSaving}
                                    style={{ background: "var(--gradient)", color: "white", border: "none", borderRadius: 10, padding: "0 22px", cursor: "pointer", fontFamily: "Poppins", fontSize: "14px", fontWeight: 600, flexShrink: 0 }}>
                                    {emerLabels.addBtnText} ₹
                                </button>
                            </div>
                        </motion.div>

                        {/* Configuration Rollback Reset Interface Control Button */}
                        <button type="button" onClick={() => { setMonthlyExpense(data.monthlyExpense); setTarget(data.target); setSaved(data.saved); setData(null); }} className="btn-secondary" style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: "12px", fontWeight: 600, fontSize: "13.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {emerLabels.editSetupBtn}
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};

export default Emergency;