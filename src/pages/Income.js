import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, orderBy, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const Income = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [incomes, setIncomes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("Salary");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);

    // 3. SECURE, GRAMMATICALLY VERIFIED MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const incLabels = {
        title: { English: "Income", "हिंदी": "आय", "తెлкуగు": "ఆదాయం", "తెలుగు": "ఆదాయం", "ಕನ್ನಡ": "ಆದಾಯ", "മലയാളം": "വരുമാനം" }[currentLanguage] || "Income",
        totalIncomeLabel: { English: "Total Income", "हिंदी": "कुल आय", "తెలుగు": "మొత్తం ఆదాయం", "ಕನ್ನಡ": "ಒಟ್ಟು ಆದಾಯ", "മലയാളം": "ആകെ വരുമാനം" }[currentLanguage] || "Total Income",
        entriesTracked: { English: "entries", "हिंदी": "प्रविष्टियां", "తెలుగు": "నమోదులు", "ಕನ್ನಡ": "ನಮೂದುಗಳು", "മലയാളം": "രേഖപ്പെടുത്തലുകൾ" }[currentLanguage] || "entries",
        addIncomeBtn: { English: "➕ Add Income", "हिंदी": "➕ आय जोड़ें", "తెలుగు": "➕ ఆదాయాన్ని చేర్చు", "ಕನ್ನಡ": "➕ ಆದಾಯ ಸೇರಿಸಿ", "മലയാളം": "➕ വരുമാനം ചേർക്കുക" }[currentLanguage] || "➕ Add Income",
        cancelBtn: { English: "✕ Cancel", "हिंदी": "✕ रद्द करें", "తెలుగు": "✕ రద్దు చేయి", "ಕನ್ನಡ": "✕ ರದ್ದುಗೊಳಿಸಿ", "മലയാളം": "✕ റദ്ദാക്കുക" }[currentLanguage] || "✕ Cancel",
        newIncomeHeader: { English: "New Income", "हिंदी": "नई आय", "తెలుగు": "కొత్త ఆదాయం", "ಕನ್ನಡ": "ಹೊಸ ಆದಾಯ", "മലയാളം": "പുതിയ വരുമാനം" }[currentLanguage] || "New Income",
        amountLabel: { English: "Amount (₹)", "हिंदी": "राशि (₹)", "తెలుగు": "మొత్తం (₹)", "ಕನ್ನಡ": "ಮೊತ್ತ (₹)", "മലയാളം": "തുക (₹)" }[currentLanguage] || "Amount (₹)",
        typeLabel: { English: "Type", "हिंदी": "प्रकार", "తెలుగు": "ఆదాయ మార్గం", "ಕನ್ನಡ": "ಮೂಲ", "മലയാളം": "തരം" }[currentLanguage] || "Type",
        descLabel: { English: "Description", "हिंदी": "विवरण", "తెలుగు": "వివరణ", "ಕನ್ನಡ": "ವಿವರಣೆ", "മലയാളം": "വിവരണം" }[currentLanguage] || "Description",
        dateLabel: { English: "Date", "हिंदी": "दिनांक", "తెలుగు": "తేదీ", "ಕನ್ನಡ": "ದಿನಾಂಕ", "മലയാളം": "തീയതി" }[currentLanguage] || "Date",
        saveIncomeBtn: { English: "Save Income", "हिंदी": "आय सहेजें", "తెలుగు": "ఆదాయాన్ని సేవ్ చేయి", "ಕನ್ನಡ": "ಆದಾಯ ಉಳಿಸಿ", "മലയാളം": "വരുമാനം സേവ് ചെയ്യുക" }[currentLanguage] || "Save Income",
        savingStatus: { English: "Saving...", "हिंदी": "सहेज रहा हूँ...", "తెలుగు": "సేవ్ చేస్తోంది...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", "മലയാളം": "സേവ് ചെയ്യുന്നു..." }[currentLanguage] || "Saving...",
        placeholderAmt: { English: "Enter amount", "हिंदी": "राशि दर्ज करें", "తెలుగు": "మొత్తాన్ని నమోదు చేయండి", "ಕನ್ನಡ": "ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ" }[currentLanguage] || "Enter amount",
        placeholderDesc: { English: "Description", "हिंदी": "विवरण (वैकल्पिक)", "తెలుగు": "వివరణ (ఐచ్ఛికం)", "ಕನ್ನಡ": "ವಿವರಣೆ (ಐಚ್ಛಿಕ)" }[currentLanguage] || "Description",
        noIncomeHeader: { English: "💰 No income tracking entries found!", "हिंदी": "💰 कोई आय प्रविष्टि नहीं मिली!", "తెలుగు": "💰 ఆదాయ వివరాలు ఏవీ ఇంకా చేర్చలేదు!", "ಕನ್ನಡ": "💰 ಆದಾಯದ ವಿವರಗಳು ಇನ್ನು ಲಭ್ಯವಿಲ್ಲ!" }[currentLanguage] || "💰 No income tracking entries found!"
    };

    // CORE MASTER INCOME TYPES TRANSLATION BLUEPRINTS MAP
    const INCOME_TYPES = [
        { value: "Salary", name: { English: "Salary", "हिंदी": "वेतन (Salary)", "తెలుగు": "జీతం", "ಕನ್ನಡ": "ಸಂಬಳ" }[currentLanguage] || "Salary", icon: "💼" },
        { value: "Freelance", name: { English: "Freelance", "हिंदी": "फ्रीलांसिंग", "తెలుగు": "ఫ్రీలాన్స్", "ಕನ್ನಡ": "ಫ್ರೀಲಾನ್ಸ್" }[currentLanguage] || "Freelance", icon: "💻" },
        { value: "Business", name: { English: "Business", "हिंदी": "व्यापार", "తెలుగు": "వ్యాపారం", "ಕನ್ನಡ": "ವ್ಯಾಪಾರ" }[currentLanguage] || "Business", icon: "🏢" },
        { value: "Investment", name: { English: "Investment", "हिंदी": "निवेश", "తెలుగు": "పెట్టుబడులు", "ಕನ್ನಡ": "ಹೂಡಿಕೆ" }[currentLanguage] || "Investment", icon: "📈" },
        { value: "Rental", name: { English: "Rental", "हिंदी": "किराया (Rent)", "తెలుగు": "అద్దె ఆదాయం", "ಕನ್ನಡ": "ಬಾಡಿಗೆ ಆಸ್ತಿ" }[currentLanguage] || "Rental", icon: "🏠" },
        { value: "Pension", name: { English: "Pension", "हिंदी": "पेंशन", "తెలుగు": "పెన్షన్", "ಕನ್ನಡ": "ಪಿಂಚಣಿ" }[currentLanguage] || "Pension", icon: "👴" },
        { value: "Other", name: { English: "Other", "हिंदी": "अन्य स्रोत", "తెలుగు": "ఇతరాలు", "ಕನ್ನಡ": "ಇತರೆ" }[currentLanguage] || "Other", icon: "💰" },
    ];

    const translateType = (typeValue) => {
        const found = INCOME_TYPES.find(t => t.value === typeValue);
        return found ? found.name : typeValue;
    };

    // 4. FIREBASE TELEMETRY EFFECT SYNCS DATA LOADERS
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "income"),
            where("userId", "==", user.uid),
            orderBy("date", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setIncomes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user]);

    // 5. DATA INSERTS & MUTATORS DISPATCH HANDLERS
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!amount || !type) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "income"), {
                userId: user.uid,
                amount: Number(amount),
                type,
                description,
                date: new Date(date).toISOString(),
                createdAt: new Date().toISOString(),
            });
            setAmount("");
            setDescription("");
            setShowForm(false);
        } catch (err) {
            console.error("Error committing record entry onto cloud storage income schema collection:", err);
        }
        setLoading(true);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "income", id));
        } catch (err) {
            console.error("Error purging document entity structural row inside income registry:", err);
        }
    };

    const formatLocalizedDate = (dateString) => {
        if (!dateString) return "-";
        const dateObj = new Date(dateString);
        const localeCodes = { English: "en-IN", "हिंदी": "hi-IN", "తెలుగు": "te-IN", "ಕನ್ನಡ": "kn-IN", "മലയാളം": "ml-IN", "मराठी": "mr-IN", "ગુજરાતી": "gu-IN", "தமிழ்": "ta-IN" };
        const activeLocale = localeCodes[currentLanguage] || "en-IN";
        return dateObj.toLocaleDateString(activeLocale, { day: "numeric", month: "short", year: "numeric" });
    };

    const total = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    return (
        <div className={`income-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={incLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Adds a custom text box layout parameter to avoid overlap crashes */}
                <style>{`
                    .card h3, .card p, .btn-primary, label, option { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input, select { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Total Monthly Income Aggregator Card */}
                <motion.div className="card" style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "white", textAlign: "center", padding: "24px" }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ opacity: 0.9, marginBottom: 8, marginTop: 0, fontSize: "14px", fontWeight: 500 }}>{incLabels.totalIncomeLabel}</p>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 6px 0" }}>₹{total.toLocaleString("en-IN")}</h2>
                    <p style={{ opacity: 0.8, fontSize: 13, margin: 0 }}>{incomes.length} {incLabels.entriesTracked}</p>
                </motion.div>

                {/* Form Trigger Conditional Deployment Switch Button */}
                <motion.button className="btn-primary" onClick={() => setShowForm(!showForm)} whileTap={{ scale: 0.95 }}
                    style={{ marginBottom: 16, marginTop: 16, width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px" }}>
                    {showForm ? incLabels.cancelBtn : incLabels.addIncomeBtn}
                </motion.button>

                {/* Insertion Canvas Interactive Workspace Card */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div className="card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16 }}>
                            <h3 style={{ marginBottom: 16, marginTop: 0, fontWeight: 600, fontSize: "16px", color: "var(--text-primary)" }}>{incLabels.newIncomeHeader}</h3>
                            <form onSubmit={handleAdd}>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{incLabels.amountLabel}</label>
                                    <input type="number" placeholder={incLabels.placeholderAmt} value={amount} onChange={e => setAmount(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                </div>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{incLabels.typeLabel}</label>
                                    <select value={type} onChange={e => setType(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }}>
                                        {INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{incLabels.descLabel}</label>
                                    <input type="text" placeholder={incLabels.placeholderDesc} value={description} onChange={e => setDescription(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{incLabels.dateLabel}</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}>
                                    {loading ? incLabels.savingStatus : incLabels.saveIncomeBtn}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mapping Active Entries History Stream Vectors */}
                {incomes.map((income, index) => (
                    <motion.div key={income.id} className="card" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, padding: "14px 18px" }}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} layout>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--background)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                            {INCOME_TYPES.find(t => t.value === income.type)?.icon || "💰"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, margin: "0 0 3px 0", fontSize: "14.5px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {income.description || translateType(income.type)}
                            </p>
                            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                                {formatLocalizedDate(income.date)}
                            </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                            <p style={{ fontWeight: 700, color: "var(--success)", fontSize: 15, margin: 0 }}>+₹{Number(income.amount).toLocaleString("en-IN")}</p>
                            <button type="button" onClick={() => handleDelete(income.id)} style={{ background: darkMode ? "rgba(239, 68, 68, 0.12)" : "#FEE2E2", border: "none", borderRadius: 8, padding: "5px 9px", cursor: "pointer", transition: "all 0.2s" }}>🗑️</button>
                        </div>
                    </motion.div>
                ))}

                {/* Presentation Fallback Empty State Layout */}
                {incomes.length === 0 && (
                    <div className="empty-state card" style={{ textAlign: "center", padding: "36px 20px" }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>{incLabels.noIncomeHeader}</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Income;