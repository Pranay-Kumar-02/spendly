import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const CreditCard = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [cards, setCards] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [cardName, setCardName] = useState("");
    const [bank, setBank] = useState("");
    const [limit, setLimit] = useState("");
    const [used, setUsed] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [dueAmount, setDueAmount] = useState("");
    const [loading, setLoading] = useState(false);

    // 3. SECURE, GRAMMATICALLY VERIFIED MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const ccLabels = {
        title: { English: "Credit Cards", "हिंदी": "क्रेडिट कार्ड", "తెలుగు": "క్రెడిట్ కార్డ్స్", "ಕನ್ನಡ": "ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್‌ಗಳು", "മലയാളം": "ക്രെഡിറ്റ് കാർഡുകൾ" }[currentLanguage] || "Credit Cards",
        totalLimit: { English: "Total Limit", "हिंदी": "कुल सीमा", "తెలుగు": "మొత్తం లిమిట్", "ಕನ್ನಡ": "ಒಟ್ಟು ಮಿತಿ" }[currentLanguage] || "Total Limit",
        totalUsed: { English: "Total Used", "हिंदी": "कुल उपयोग", "తెలుగు": "మొత్తం వినియోగం", "ಕನ್ನಡ": "ಒಟ್ಟು ಬಳಸಿದ ಮೊತ್ತ" }[currentLanguage] || "Total Used",
        totalDue: { English: "Total Due", "हिंदी": "कुल बकाया", "తెలుగు": "మొత్తం బకాయి", "ಕನ್ನಡ": "ಒಟ್ಟು ಬಾಕಿ ಮೊತ್ತ" }[currentLanguage] || "Total Due",
        addCardBtn: { English: "➕ Add Credit Card", "हिंदी": "➕ क्रेडिट कार्ड जोड़ें", "తెలుగు": "➕ క్రెడిట్ కార్డ్‌ని చేర్చు", "ಕನ್ನಡ": "➕ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಸೇರಿಸಿ" }[currentLanguage] || "➕ Add Credit Card",
        cancelBtn: { English: "✕ Cancel", "हिंदी": "✕ रद्द करें", "తెలుగు": "✕ రద్దు చేయి", "ಕನ್ನಡ": "✕ ರದ್ದುಗೊಳಿಸಿ" }[currentLanguage] || "✕ Cancel",
        newCardHeader: { English: "Add Credit Card", "हिंदी": "क्रेडिट कार्ड जोड़ें", "తెలుగు": "క్రెడిట్ కార్డ్ వివరాలు", "ಕನ್ನಡ": "ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಸೇರಿಸಿ" }[currentLanguage] || "Add Credit Card",
        cardNameLabel: { English: "Card Name", "हिंदी": "कार्ड का नाम", "తెలుగు": "కార్డ్ పేరు", "ಕನ್ನಡ": "ಕಾರ್ಡ್ ಹೆಸರು" }[currentLanguage] || "Card Name",
        bankLabel: { English: "Bank", "हिंदी": "बैंक", "తెలుగు": "బ్యాంకు", "ಕನ್ನಡ": "ಬ್ಯಾಂಕ್" }[currentLanguage] || "Bank",
        limitLabel: { English: "Credit Limit (₹)", "हिंदी": "क्रेडिट सीमा (₹)", "తెలుగు": "క్రెడిట్ పరిమితి (₹)", "ಕನ್ನಡ": "ಕ್ರೆಡಿಟ್ ಮಿತಿ (₹)" }[currentLanguage] || "Credit Limit (₹)",
        usedLabel: { English: "Amount Used (₹)", "हिंदी": "उपयोग की गई राशि (₹)", "తెలుగు": "వినియోగించిన మొత్తం (₹)", "ಕನ್ನಡ": "ಬಳಸಿದ ಮೊತ್ತ (₹)" }[currentLanguage] || "Amount Used (₹)",
        dueAmtLabel: { English: "Due Amount (₹)", "हिंदी": "बकाया राशि (₹)", "తెలుగు": "చెల్లించాల్సిన బకాయి (₹)", "ಕನ್ನಡ": "ಬಾಕಿ ಮೊತ್ತ (₹)" }[currentLanguage] || "Due Amount (₹)",
        dueDateLabel: { English: "Payment Due Date", "हिंदी": "नियत भुगतान तिथि", "తెలుగు": "చెల్లించాల్సిన ఆఖరి తేదీ", "ಕನ್ನಡ": "ಪಾವತಿಯ ಕೊನೆಯ ದಿನಾಂಕ" }[currentLanguage] || "Payment Due Date",
        saveCardBtn: { English: "Save Card", "हिंदी": "कार्ड सुरक्षित करें", "తెలుగు": "కార్డ్‌ను సేవ్ చేయి", "ಕನ್ನಡ": "ಕಾರ್ಡ್ ಉಳಿಸಿ" }[currentLanguage] || "Save Card",
        savingStatus: { English: "Saving...", "हिंदी": "सहेज रहा हूँ...", "తెలుగు": "సేవ్ చేస్తోంది...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ..." }[currentLanguage] || "Saving...",
        utilizationLabel: { English: "Credit Utilization", "हिंदी": "क्रेडिट उपयोग अनुपात", "తెలుగు": "క్రెడిట్ వినియోగం", "ಕನ್ನಡ": "ಕ್ರೆಡಿಟ್ ಬಳಕೆ ಪ್ರಮಾಣ" }[currentLanguage] || "Credit Utilization",
        availableLabel: { English: "Available", "हिंदी": "उपलब्ध", "తెలుగు": "అందుబాటులో ఉన్నది", "ಕನ್ನಡ": "ಲಭ್ಯವಿದೆ", "മലയാളം": "ലഭ്യമായത്" }[currentLanguage] || "Available",
        dueLabel: { English: "Due", "हिंदी": "बकाया", "తెలుగు": "బకాయి", "ಕನ್ನಡ": "ಬಾಕಿ", "മലയാളം": "അടയ്ക്കാനുള്ളത്" }[currentLanguage] || "Due",
        emptyStateHeader: { English: "💳 No credit cards added!", "हिंदी": "💳 कोई क्रेडिट कार्ड नहीं जोड़ा गया!", "తెలుగు": "💳 క్రెడిట్ కార్డ్‌లు ఏవీ ఇంకా చేర్చలేదు!", "ಕನ್ನಡ": "💳 ಇನ್ನು ಯಾವುದೇ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಸೇರಿಸಿಲ್ಲ!" }[currentLanguage] || "💳 No credit cards added!",
        emptyStateSub: { English: "Track your credit cards here", "हिंदी": "अपने क्रेडिट कार्ड को यहाँ ट्रैक करें", "తెలుగు": "మీ క్రెడిట్ కార్డ్‌ల బకాయిలను ఇక్కడ ట్రాక్ చేయండి", "ಕನ್ನಡ": "ನಿಮ್ಮ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್‌ಗಳನ್ನು ಇಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ" }[currentLanguage] || "Track your credit cards here",
        placeholderName: { English: "e.g. HDFC Millennia", "हिंदी": "जैसे: HDFC Millennia", "తెలుగు": "ఉదా: HDFC Millennia" }[currentLanguage] || "e.g. HDFC Millennia",
        placeholderBank: { English: "e.g. HDFC Bank", "हिंदी": "जैसे: HDFC Bank", "తెలుగు": "ఉదా: HDFC Bank" }[currentLanguage] || "e.g. HDFC Bank",
        placeholderLimit: { English: "e.g. 100000", "हिंदी": "जैसे: 100000", "తెలుగు": "ఉదా: 100000" }[currentLanguage] || "e.g. 100000",
        placeholderUsed: { English: "e.g. 25000", "हिंदी": "जैसे: 25000", "తెలుగు": "ఉదా: 25000" }[currentLanguage] || "e.g. 25000",
        placeholderDue: { English: "e.g. 15000", "हिंदी": "जैसे: 15000", "తెలుగు": "ఉదా: 15000" }[currentLanguage] || "e.g. 15000"
    };

    // 4. FIREBASE DATA LISTENERS TELEMETRY SYNCS
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "creditcards"), where("userId", "==", user.uid));
        return onSnapshot(q, snap => setCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [user]);

    // 5. DATABASE ACTION HANDLERS
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!cardName || !bank || !limit) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "creditcards"), {
                userId: user.uid,
                cardName, bank,
                limit: Number(limit),
                used: Number(used || 0),
                dueDate,
                dueAmount: Number(dueAmount || 0),
                createdAt: new Date().toISOString(),
            });
            setCardName(""); setBank(""); setLimit(""); setUsed(""); setDueDate(""); setDueAmount("");
            setShowForm(false);
        } catch (err) {
            console.error("Error committing dataset record to creditcards directory:", err);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "creditcards", id));
        } catch (err) {
            console.error("Error purging document structure from database storage:", err);
        }
    };

    const formatLocalizedDate = (dateString) => {
        if (!dateString) return "-";
        const dateObj = new Date(dateString);
        const localeCodes = { English: "en-IN", "हिंदी": "hi-IN", "తెలుగు": "te-IN", "ಕನ್ನಡ": "kn-IN", "മലയാളം": "ml-IN", "मराठी": "mr-IN", "ગુજરાતી": "gu-IN", "தமிழ்": "ta-IN" };
        const activeLocale = localeCodes[currentLanguage] || "en-IN";
        return dateObj.toLocaleDateString(activeLocale, { day: "numeric", month: "short", year: "numeric" });
    };

    const totalLimit = cards.reduce((sum, c) => sum + Number(c.limit || 0), 0);
    const totalUsed = cards.reduce((sum, c) => sum + Number(c.used || 0), 0);
    const totalDue = cards.reduce((sum, c) => sum + Number(c.dueAmount || 0), 0);

    const CARD_COLORS = ["#7C3AED", "#EC4899", "#10B981", "#3B82F6", "#F59E0B"];

    return (
        <div className={`credit-cards-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={ccLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Avoids rendering overlaps or vowel clipping in Indic characters */}
                <style>{`
                    .card h3, .card p, .btn-primary, label { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Top Summarized Aggregate Metrics Grid Dashboard */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                        { label: ccLabels.totalLimit, value: totalLimit, color: darkMode ? "rgba(91, 33, 182, 0.15)" : "#EDE9FE", text: darkMode ? "#C4B5FD" : "#5B21B6", bdr: "#5B21B6" },
                        { label: ccLabels.totalUsed, value: totalUsed, color: darkMode ? "rgba(153, 27, 27, 0.15)" : "#FEE2E2", text: darkMode ? "#FCA5A5" : "#991B1B", bdr: "#991B1B" },
                        { label: ccLabels.totalDue, value: totalDue, color: darkMode ? "rgba(146, 64, 14, 0.15)" : "#FEF3C7", text: darkMode ? "#FCD34D" : "#92400E", bdr: "#92400E" },
                    ].map(item => (
                        <motion.div key={item.label} className="card" style={{ textAlign: "center", background: item.color, padding: "12px 6px", border: darkMode ? `1px solid ${item.bdr}` : "1px solid var(--border)" }}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <p style={{ fontSize: 11, color: item.text, marginBottom: 4, marginTop: 0, fontWeight: 500 }}>{item.label}</p>
                            <h3 style={{ color: item.text, fontSize: 13, fontWeight: 700, margin: 0 }}>₹{item.value.toLocaleString("en-IN")}</h3>
                        </motion.div>
                    ))}
                </div>

                {/* Form Deployment Toggle Trigger Action Button */}
                <motion.button className="btn-primary" style={{ marginBottom: 16, width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px" }}
                    onClick={() => setShowForm(!showForm)} whileTap={{ scale: 0.95 }}>
                    {showForm ? ccLabels.cancelBtn : ccLabels.addCardBtn}
                </motion.button>

                {/* Insertion Canvas Interactive Workspace Card */}
                {showForm && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
                        <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "16px" }}>{ccLabels.newCardHeader}</h3>
                        <form onSubmit={handleAdd}>
                            {[
                                { label: ccLabels.cardNameLabel, placeholder: ccLabels.placeholderName, value: cardName, setter: setCardName, type: "text" },
                                { label: ccLabels.bankLabel, placeholder: ccLabels.placeholderBank, value: bank, setter: setBank, type: "text" },
                                { label: ccLabels.limitLabel, placeholder: ccLabels.placeholderLimit, value: limit, setter: setLimit, type: "number" },
                                { label: ccLabels.usedLabel, placeholder: ccLabels.placeholderUsed, value: used, setter: setUsed, type: "number" },
                                { label: ccLabels.dueAmtLabel, placeholder: ccLabels.placeholderDue, value: dueAmount, setter: setDueAmount, type: "number" },
                            ].map(field => (
                                <div key={field.label} style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{field.label}</label>
                                    <input type={field.type} placeholder={field.placeholder} value={field.value} onChange={e => field.setter(e.target.value)} required={field.label !== ccLabels.usedLabel && field.label !== ccLabels.dueAmtLabel} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                </div>
                            ))}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{ccLabels.dueDateLabel}</label>
                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}>
                                {loading ? ccLabels.savingStatus : ccLabels.saveCardBtn}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Mapping Active Cards Vector Grid List Output */}
                {cards.map((card, index) => {
                    const utilization = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
                    const available = Math.max(card.limit - card.used, 0);
                    return (
                        <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} style={{ marginBottom: 16 }}>

                            {/* Visual Credit Card Component Layout Frame */}
                            <div style={{ background: CARD_COLORS[index % CARD_COLORS.length], borderRadius: 20, padding: 24, color: "white", marginBottom: 8, position: "relative", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}>
                                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                                <div style={{ position: "absolute", bottom: -30, right: 30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                                <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 4, marginTop: 0, textTransform: "uppercase", fontWeight: 500 }}>{card.bank}</p>
                                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 18, marginTop: 0 }}>{card.cardName}</h3>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                    <div>
                                        <p style={{ fontSize: 11, opacity: 0.8, margin: "0 0 2px 0" }}>{ccLabels.limitLabel.replace(" (₹)", "")}</p>
                                        <p style={{ fontWeight: 700, margin: 0, fontSize: "14px" }}>₹{Number(card.limit).toLocaleString("en-IN")}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 11, opacity: 0.8, margin: "0 0 2px 0" }}>{ccLabels.availableLabel}</p>
                                        <p style={{ fontWeight: 700, margin: 0, fontSize: "14px" }}>₹{available.toLocaleString("en-IN")}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 11, opacity: 0.8, margin: "0 0 2px 0" }}>{ccLabels.dueLabel}</p>
                                        <p style={{ fontWeight: 700, margin: 0, fontSize: "14px" }}>₹{Number(card.dueAmount || 0).toLocaleString("en-IN")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Supplementary Usage Statistics Panel */}
                            <div className="card" style={{ padding: "16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{ccLabels.utilizationLabel}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: utilization > 70 ? "#EF4444" : "#10B981" }}>{utilization.toFixed(0)}%</span>
                                </div>
                                <div style={{ height: 8, background: "var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                                    <motion.div
                                        style={{ height: "100%", background: utilization > 70 ? "linear-gradient(135deg, #EF4444, #DC2626)" : "var(--gradient)", borderRadius: 8 }}
                                        initial={{ width: 0 }} animate={{ width: `${utilization}%` }} transition={{ duration: 1 }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{ccLabels.dueLabel}: {formatLocalizedDate(card.dueDate)}</p>
                                    <button type="button" onClick={() => handleDelete(card.id)}
                                        style={{ background: darkMode ? "rgba(239, 68, 68, 0.12)" : "#FEE2E2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", transition: "all 0.2s" }}>🗑️</button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Presentation Fallback Empty State Frame Wrapper */}
                {cards.length === 0 && (
                    <div className="empty-state card" style={{ textAlign: "center", padding: "36px 20px" }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "var(--text-secondary)", fontSize: "14px" }}>{ccLabels.emptyStateHeader}</p>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", opacity: 0.85 }}>{ccLabels.emptyStateSub}</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CreditCard;