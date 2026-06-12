import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const Bills = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [bills, setBills] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Electricity");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    // 3. SECURE, GRAMMATICALLY VERIFIED MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const bLabels = {
        title: { English: "Bills & Reminders", "हिंदी": "बिल और अनुस्मारक", "తెలుగు": "బిల్లులు & రిమైండర్లు", "ಕನ್ನಡ": "ಬಿಲ್ಲುಗಳು ಮತ್ತು ಜ್ಞಾಪನೆಗಳು", "മലയാളം": "ബില്ലുകളും ഓർമ്മപ്പെടുത്തലുകളും" }[currentLanguage] || "Bills & Reminders",
        totalMonthlyBills: { English: "Total Monthly Bills", "हिंदी": "कुल मासिक बिल", "తెలుగు": "మొత్తం నెలవారీ బిల్లులు", "ಕನ್ನಡ": "ಒಟ್ಟು ಮಾಸಿಕ ಬಿಲ್ಲುಗಳು", "മലയാളം": "ആകെ പ്രതിമാസ ബില്ലുകൾ" }[currentLanguage] || "Total Monthly Bills",
        billsTracked: { English: "bills tracked", "हिंदी": "बिल ट्रैक किए गए", "తెలుగు": "బిల్లులు ట్రాక్ చేయబడ్డాయి", "ಕನ್ನಡ": "ಬಿಲ್ಲುಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗಿದೆ" }[currentLanguage] || "bills tracked",
        addBillBtn: { English: "➕ Add Bill", "हिंदी": "➕ बिल जोड़ें", "తెలుగు": "➕ బిల్లును చేర్చు", "ಕನ್ನಡ": "➕ ಬಿಲ್ಲು ಸೇರಿಸಿ", "മലയാളം": "➕ ബില്ല് ചേർക്കുക" }[currentLanguage] || "➕ Add Bill",
        cancelBtn: { English: "✕ Cancel", "हिंदी": "✕ रद्द करें", "తెలుగు": "✕ రద్దు చేయి", "ಕನ್ನಡ": "✕ ರದ್ದುಗೊಳಿಸಿ", "മലയാളം": "✕ റദ്ദാക്കുക" }[currentLanguage] || "✕ Cancel",
        newBillHeader: { English: "New Bill", "हिंदी": "नया बिल", "తెలుగు": "కొత్త బిల్లు", "ಕನ್ನಡ": "ಹೊಸ ಬಿಲ್ಲು", "മലയാളം": "പുതിയ ബില്ല്" }[currentLanguage] || "New Bill",
        billNameLabel: { English: "Bill Name", "हिंदी": "बिल का नाम", "తెలుగు": "బిల్లు పేరు", "ಕನ್ನಡ": "ಬಿಲ್ಲು ಹೆಸರು", "മലയാളം": "ബില്ലിന്റെ പേര്" }[currentLanguage] || "Bill Name",
        categoryLabel: { English: "Category", "हिंदी": "श्रेणी", "తెలుగు": "విభాగం", "ಕನ್ನಡ": "ವರ್ಗ", "മലയാളം": "വിഭാഗം" }[currentLanguage] || "Category",
        amountLabel: { English: "Amount (₹)", "हिंदी": "राशि (₹)", "తెలుగు": "మొత్తం (₹)", "ಕನ್ನಡ": "ಮೊತ್ತ (₹)", "മലയാളം": "തുക (₹)" }[currentLanguage] || "Amount (₹)",
        dueDateLabel: { English: "Due Date", "हिंदी": "नियत तारीख", "తెలుగు": "చెల్లించాల్సిన తేదీ", "ಕನ್ನಡ": "ಕೊನೆಯ ದಿನಾಂಕ", "മലയാളം": "അവസാന തീയതി" }[currentLanguage] || "Due Date",
        saveBillBtn: { English: "Save Bill", "हिंदी": "बिल सहेजें", "తెలుగు": "బిల్లును సేవ్ చేయి", "ಕನ್ನಡ": "ಬಿಲ್ಲು ಉಳಿಸಿ", "മലയാളം": "ബില്ല് സേവ് ചെയ്യുക" }[currentLanguage] || "Save Bill",
        savingStatus: { English: "Saving...", "हिंदी": "सहेज रहा हूँ...", "తెలుగు": "సేవ్ చేస్తోంది...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", "മലയാളം": "സേവ് ചെയ്യുന്നു..." }[currentLanguage] || "Saving...",
        dueLabel: { English: "Due", "हिंदी": "नियत तिथि", "తెలుగు": "తేదీ", "ಕನ್ನಡ": "ದಿನಾಂಕ", "മലയാളം": "തീയതി" }[currentLanguage] || "Due",
        dueToday: { English: "Due Today!", "हिंदी": "आज ही देय है!", "తెలుగు": "ఈరోజే ఆఖరి తేదీ!", "ಕನ್ನಡ": "ಇಂದೇ ಕೊನೆಯ ದಿನ!", "മലയാളം": "ഇന്ന് അവസാന തീയതി!" }[currentLanguage] || "Due Today!",
        overdueBy: { English: "Overdue by", "हिंदी": "देरी अवधि", "తెలుగు": "గడువు ముగిసి", "ಕನ್ನಡ": "ಗಡುವು ಮೀರಿ", "മലയാളം": "അവസാന തീയതി കഴിഞ്ഞു" }[currentLanguage] || "Overdue by",
        days: { English: "days", "हिंदी": "दिन", "తెలుగు": "రోజులు", "ಕನ್ನಡ": "ದಿನಗಳು", "മലയാളം": "ദിവസങ്ങൾ" }[currentLanguage] || "days",
        daysLeft: { English: "days left", "हिंदी": "दिन शेष", "తెలుగు": "రోజులు మిగిలి ఉన్నాయి", "ಕನ್ನಡ": "ದಿನಗಳು ಬಾಕಿ ಇವೆ", "മലയാളം": "ദിവസങ്ങൾ ബാക്കി" }[currentLanguage] || "days left",
        noBillsHeader: { English: "📅 No bills added yet!", "हिंदी": "📅 अभी कोई बिल नहीं जोड़ा गया!", "తెలుగు": "📅 బిల్లులు ఏవీ ఇంకా చేర్చలేదు!", "ಕನ್ನಡ": "📅 ಇನ್ನು ಯಾವುದೇ ಬಿಲ್ಲುಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ!" }[currentLanguage] || "📅 No bills added yet!",
        noBillsSub: { English: "Track your upcoming bills here", "हिंदी": "अपने आगामी बिलों को यहाँ ट्रैक करें", "తెలుగు": "మీ రాబోయే బిల్లుల వివరాలను ఇక్కడ ట్రాక్ చేయండి", "ಕನ್ನಡ": "ನಿಮ್ಮ ಮುಂಬರುವ ಬಿಲ್ಲುಗಳನ್ನು ಇಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ" }[currentLanguage] || "Track your upcoming bills here",
        placeholderName: { English: "e.g. Electricity Bill", "हिंदी": "जैसे: बिजली का बिल", "తెలుగు": "ఉదా: కరెంట్ బిల్లు", "ಕನ್ನಡ": "ಉದಾ: ವಿದ್ಯುತ್ ಬಿಲ್ಲು" }[currentLanguage] || "e.g. Electricity Bill",
        placeholderAmt: { English: "e.g. 1500", "हिंदी": "जैसे: 1500", "తెలుగు": "ఉదా: 1500", "ಕನ್ನಡ": "ಉದಾ: 1500" }[currentLanguage] || "e.g. 1500"
    };

    // CORE MASTER CATEGORIES TRANSLATION BLUEPRINTS MAP
    const BILL_CATEGORIES = [
        { value: "Electricity", name: { English: "Electricity", "हिंदी": "बिजली", "తెలుగు": "విద్యుత్", "ಕನ್ನಡ": "ವಿದ್ಯುತ್" }[currentLanguage] || "Electricity", icon: "💡" },
        { value: "Water", name: { English: "Water", "हिंदी": "पानी", "తెలుగు": "నీరు", "ಕನ್ನಡ": "ನೀರು" }[currentLanguage] || "Water", icon: "💧" },
        { value: "Internet", name: { English: "Internet", "हिंदी": "इंटरनेट", "తెలుగు": "ఇంటర్నెట్", "ಕನ್ನಡ": "ಅಂತರ್ಜಾಲ" }[currentLanguage] || "Internet", icon: "🌐" },
        { value: "Mobile", name: { English: "Mobile", "हिंदी": "मोबाइल", "తెలుగు": "మొబైల్", "ಕನ್ನಡ": "ಮೊಬೈಲ್" }[currentLanguage] || "Mobile", icon: "📱" },
        { value: "Rent", name: { English: "Rent", "हिंदी": "किराया", "తెలుగు": "అద్దె", "ಕನ್ನಡ": "ಬಾಡಿಗೆ" }[currentLanguage] || "Rent", icon: "🏠" },
        { value: "Insurance", name: { English: "Insurance", "हिंदी": "बीमा", "తెలుగు": "భీమా", "ಕನ್ನಡ": "ವಿಮೆ" }[currentLanguage] || "Insurance", icon: "🛡️" },
        { value: "OTT", name: { English: "OTT", "हिंदी": "ओटीटी", "తెలుగు": "OTT సబ్‌స్క్రిప్షన్", "ಕನ್ನಡ": "OTT ಚಂದಾದಾರಿಕೆ" }[currentLanguage] || "OTT", icon: "📺" },
        { value: "Other", name: { English: "Other", "हिंदी": "अन्य", "తెలుగు": "ఇతరాలు", "ಕನ್ನಡ": "ಇತರೆ" }[currentLanguage] || "Other", icon: "📋" },
    ];

    const translateCategory = (catValue) => {
        const found = BILL_CATEGORIES.find(c => c.value === catValue);
        return found ? found.name : catValue;
    };

    // 4. FIREBASE TELEMETRY EFFECT SNAPSHOT SYNCS
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "bills"), where("userId", "==", user.uid));
        return onSnapshot(q, snap => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [user]);

    // 5. DATA INSERTS & MUTATORS DISPATCH HANDLERS
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name || !amount || !dueDate) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "bills"), {
                userId: user.uid,
                name,
                amount: Number(amount),
                category,
                dueDate,
                createdAt: new Date().toISOString(),
            });
            setName(""); setAmount(""); setDueDate("");
            setShowForm(false);
        } catch (err) {
            console.error("Error creating document inside bills telemetry:", err);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "bills", id));
        } catch (err) {
            console.error("Error removing entry document from bills ledger:", err);
        }
    };

    const getDaysLeft = (dueDateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDateString);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatLocalizedDate = (dateString) => {
        const dateObj = new Date(dateString);
        const localeCodes = { English: "en-IN", "हिंदी": "hi-IN", "తెలుగు": "te-IN", "ಕನ್ನಡ": "kn-IN", "മലയാളം": "ml-IN", "मराठी": "mr-IN", "ગુજરાતી": "gu-IN", "தமிழ்": "ta-IN" };
        const activeLocale = localeCodes[currentLanguage] || "en-IN";
        return dateObj.toLocaleDateString(activeLocale, { day: "numeric", month: "short", year: "numeric" });
    };

    const sortedBills = [...bills].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const totalBills = bills.reduce((sum, b) => sum + Number(b.amount), 0);

    return (
        <div className={`bills-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={bLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Corrects vertical line-height offsets for complex scripts */}
                <style>{`
                    .card h3, .card p, .btn-primary, label, option { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input, select { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Monthly Bills Master Aggregate Card */}
                <motion.div className="card" style={{ background: "var(--gradient)", color: "white", textAlign: "center", padding: "24px" }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ opacity: 0.9, marginBottom: 8, marginTop: 0, fontSize: "14px", fontWeight: 500 }}>{bLabels.totalMonthlyBills}</p>
                    <h2 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 6px 0" }}>₹{totalBills.toLocaleString("en-IN")}</h2>
                    <p style={{ opacity: 0.8, fontSize: 13, margin: 0 }}>{bills.length} {bLabels.billsTracked}</p>
                </motion.div>

                {/* Form Expansion Toggle Switcher Action Button */}
                <motion.button className="btn-primary" style={{ marginBottom: 16, marginTop: 16, width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px" }}
                    onClick={() => setShowForm(!showForm)} whileTap={{ scale: 0.95 }}>
                    {showForm ? bLabels.cancelBtn : bLabels.addBillBtn}
                </motion.button>

                {/* New Log Registration Form Box Canvas */}
                {showForm && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
                        <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "16px" }}>{bLabels.newBillHeader}</h3>
                        <form onSubmit={handleAdd}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{bLabels.billNameLabel}</label>
                                <input type="text" placeholder={bLabels.placeholderName} value={name} onChange={e => setName(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{bLabels.categoryLabel}</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }}>
                                    {BILL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{bLabels.amountLabel}</label>
                                <input type="number" placeholder={bLabels.placeholderAmt} value={amount} onChange={e => setAmount(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{bLabels.dueDateLabel}</label>
                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}>
                                {loading ? bLabels.savingStatus : bLabels.saveBillBtn}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Chronological Active Tracked Items Mapping Iterations Grid */}
                {sortedBills.map((bill, index) => {
                    const daysLeft = getDaysLeft(bill.dueDate);
                    const isOverdue = daysLeft < 0;
                    const isUrgent = daysLeft === 0 || (daysLeft > 0 && daysLeft <= 3);

                    return (
                        <motion.div key={bill.id} className="card"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
                            style={{ borderLeft: `4px solid ${isOverdue ? "#EF4444" : isUrgent ? "#F59E0B" : "#10B981"}`, marginBottom: 12, padding: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <span style={{ fontSize: 26, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {BILL_CATEGORIES.find(c => c.value === bill.category)?.icon || "📋"}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px 0", fontSize: "14.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bill.name}</p>
                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px 0" }}>{bLabels.dueLabel}: {formatLocalizedDate(bill.dueDate)}</p>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: isOverdue ? "#EF4444" : isUrgent ? "#F59E0B" : "#10B981", margin: 0 }}>
                                        {isOverdue
                                            ? `${bLabels.overdueBy} ${Math.abs(daysLeft)} ${bLabels.days}`
                                            : daysLeft === 0
                                                ? bLabels.dueToday
                                                : `${daysLeft} ${bLabels.daysLeft}`
                                        }
                                    </p>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15, margin: "0 0 6px 0" }}>₹{Number(bill.amount).toLocaleString("en-IN")}</p>
                                    <button type="button" onClick={() => handleDelete(bill.id)}
                                        style={{ background: darkMode ? "rgba(239, 68, 68, 0.12)" : "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", transition: "all 0.2s" }}>🗑️</button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Empty State Presentation Layout Block Fallback */}
                {bills.length === 0 && (
                    <div className="empty-state card" style={{ textAlign: "center", padding: "36px 20px" }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>{bLabels.noBillsHeader}</p>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", opacity: 0.85 }}>{bLabels.noBillsSub}</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Bills;