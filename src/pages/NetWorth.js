import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#7C3AED", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6"];

const NetWorth = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [assets, setAssets] = useState({});
    const [liabilities, setLiabilities] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // 3. COMPREHENSIVE MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const nwLabels = {
        title: { English: "Net Worth", "हिंदी": "कुल संपत्ति", "తెలుగు": "నికర విలువ", "ಕನ್ನಡ": "ನಿವ್ವಳ ಮೌಲ್ಯ", "മലയാളം": "ആകെ ആസ്തി" }[currentLanguage] || "Net Worth",
        yourNetWorth: { English: "Your Net Worth", "हिंदी": "आपकी कुल संपत्ति", "తెలుగు": "మీ నికర విలువ", "ಕನ್ನಡ": "ನಿಮ್ಮ ನಿವ್ವಳ ಮೌಲ್ಯ", "മലയാളം": "നിങ്ങളുടെ ആകെ ആസ്തി" }[currentLanguage] || "Your Net Worth",
        assetsHeader: { English: "🟢 Assets", "हिंदी": "🟢 परिसंपत्तियां (Assets)", "తెలుగు": "🟢 ఆస్తులు", "ಕನ್ನಡ": "🟢 ಆಸ್ತಿಗಳು", "മലയാളം": "🟢 ആസ്തികൾ" }[currentLanguage] || "🟢 Assets",
        liabilitiesHeader: { English: "🔴 Liabilities", "हिंदी": "🔴 देयताएं (Liabilities)", "తెలుగు": "🔴 అప్పులు", "ಕನ್ನಡ": "🔴 ಬಾಧ್ಯತೆಗಳು", "മലയാളം": "🔴 ബാധ്യതകൾ" }[currentLanguage] || "🔴 Liabilities",
        assetsLabel: { English: "Assets", "हिंदी": "परिसंपत्तियां", "తెలుగు": "ఆస్తులు", "ಕನ್ನಡ": "ಆಸ್ತಿಗಳು", "മലയാളം": "ആസ്തികൾ" }[currentLanguage] || "Assets",
        liabilitiesLabel: { English: "Liabilities", "हिंदी": "देयताएं", "తెలుగు": "అప్పులు", "ಕನ್ನಡ": "ಬಾಧ್ಯತೆಗಳು", "മലയാളം": "ബാധ്യതകൾ" }[currentLanguage] || "Liabilities",
        assetBreakdown: { English: "Asset Breakdown", "हिंदी": "परिसंपत्ति विवरण", "తెలుగు": "ఆస్తుల విభజన", "ಕನ್ನಡ": "ಆಸ್ತಿಗಳ ವಿವರಣೆ", "മലയാളം": "ആസ്തികളുടെ വിവരണം" }[currentLanguage] || "Asset Breakdown",
        saveBtn: { English: "💾 Save Net Worth", "हिंदी": "💾 कुल संपत्ति सहेजें", "తెలుగు": "💾 నికర విలువను సేవ్ చేయి", "ಕನ್ನಡ": "💾 ನಿವ್ವಳ ಮೌಲ್ಯ ಉಳಿಸಿ", "മലയാളം": "💾 ആകെ ആസ്തി സേവ് ചെയ്യുക" }[currentLanguage] || "💾 Save Net Worth",
        saving: { English: "Saving...", "हिंदी": "सहेज रहा हूँ...", "తెలుగు": "సేవ్ చేస్తోంది...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", "മലയാളം": "സേവ് ചെയ്യുന്നു..." }[currentLanguage] || "Saving...",
        placeholderAsset: { English: "₹ Enter value", "हिंदी": "₹ मूल्य दर्ज करें", "తెలుగు": "₹ విలువను నమోదు చేయండి", "ಕನ್ನಡ": "₹ ಮೌಲ್ಯ ನಮೂದಿಸಿ" }[currentLanguage] || "₹ Enter value",
        placeholderLiability: { English: "₹ Enter amount", "हिंदी": "₹ राशि दर्ज करें", "తెలుగు": "₹ మొత్తాన్ని నమోదు చేయండి", "ಕನ್ನಡ": "₹ ಮೊತ್ತ ನಮೂದಿಸಿ" }[currentLanguage] || "₹ Enter amount"
    };

    // SYSTEM DYNAMICALLY TRANSLATED SECTORS FOR DRIVER MATRICES
    const ASSETS = [
        { key: "cash", label: { English: "Cash & Savings", "हिंदी": "नकद और बचत", "తెలుగు": "నగదు & పొదుపు", "ಕನ್ನಡ": "ನಗದು ಮತ್ತು ಉಳಿತಾಯ" }[currentLanguage] || "Cash & Savings", icon: "💵" },
        { key: "stocks", label: { English: "Stocks & MF", "हिंदी": "शेयर और म्यूचुअल फंड", "తెలుగు": "స్టాక్స్ & మ్యూచువల్ ఫండ్స్", "ಕನ್ನಡ": "ಷೇರುಗಳು ಮತ್ತು ಮ್ಯೂಚುಯಲ್ ಫಂಡ್" }[currentLanguage] || "Stocks & MF", icon: "📈" },
        { key: "property", label: { English: "Property", "हिंदी": "संपत्ति (रियल एस्टेट)", "తెలుగు": "స్థిరాస్తి", "ಕನ್ನಡ": "ಆಸ್ತಿ (Property)" }[currentLanguage] || "Property", icon: "🏠" },
        { key: "gold", label: { English: "Gold & Jewellery", "हिंदी": "सोना और आभूषण", "తెలుగు": "బంగారం & ఆభరణాలు", "ಕನ್ನಡ": "ಚಿನ್ನ ಮತ್ತು ಆಭರಣಗಳು" }[currentLanguage] || "Gold & Jewellery", icon: "💰" },
        { key: "fd", label: { English: "FD & RD", "हिंदी": "फिक्स्ड डिपॉजिट (FD)", "తెలుగు": "FD & RD డిపాజిట్లు", "ಕನ್ನಡ": "FD ಮತ್ತು RD" }[currentLanguage] || "FD & RD", icon: "🏦" },
        { key: "pf", label: { English: "PF & PPF", "हिंदी": "पीएफ और पीपीएफ", "తెలుగు": "PF & PPF పొదుపు", "ಕನ್ನಡ": "PF ಮತ್ತು PPF" }[currentLanguage] || "PF & PPF", icon: "🛡️" },
        { key: "other_assets", label: { English: "Other Assets", "हिंदी": "अन्य संपत्तियां", "తెలుగు": "ఇతర ఆస్తులు", "ಕನ್ನಡ": "ಇತರ ಆಸ್ತಿಗಳು" }[currentLanguage] || "Other Assets", icon: "📦" },
    ];

    const LIABILITIES = [
        { key: "home_loan", label: { English: "Home Loan", "हिंदी": "होम लोन", "తెలుగు": "ఇంటి రుణం (Home Loan)", "ಕನ್ನಡ": "ಗೃಹ ಸಾಲ" }[currentLanguage] || "Home Loan", icon: "🏠" },
        { key: "car_loan", label: { English: "Car Loan", "हिंदी": "कार लोन", "తెలుగు": "వాహన రుణం (Car Loan)", "ಕನ್ನಡ": "ಕಾರು ಸಾಲ" }[currentLanguage] || "Car Loan", icon: "🚗" },
        { key: "personal_loan", label: { English: "Personal Loan", "हिंदी": "व्यक्तिगत ऋण", "తెలుగు": "వ్యక్తిగత రుణం (Personal Loan)", "ಕನ್ನಡ": "ವೈಯಕ್ತಿಕ ಸಾಲ" }[currentLanguage] || "Personal Loan", icon: "💳" },
        { key: "credit_card", label: { English: "Credit Card Dues", "हिंदी": "क्रेडिट कार्ड का बकाया", "తెలుగు": "క్రెడిట్ కార్డ్ బకాయిలు", "ಕನ್ನಡ": "ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಬಾಕಿ" }[currentLanguage] || "Credit Card Dues", icon: "💳" },
        { key: "education_loan", label: { English: "Education Loan", "हिंदी": "शिक्षा ऋण", "తెలుగు": "విద్యా రుణం (Education Loan)", "ಕನ್ನಡ": "ಶಿಕ್ಷಣ ಸಾಲ" }[currentLanguage] || "Education Loan", icon: "🎓" },
        { key: "other_liabilities", label: { English: "Other Liabilities", "हिंदी": "अन्य देनदारियां", "తెలుగు": "ఇతర అప్పులు", "ಕನ್ನಡ": "ಇತರ ಬಾಧ್ಯತೆಗಳು" }[currentLanguage] || "Other Liabilities", icon: "📋" },
    ];

    // 4. FIREBASE INITIAL TELEMETRY FETCH
    useEffect(() => {
        if (!user) return;
        const fetchNetWorthData = async () => {
            try {
                const snap = await getDoc(doc(db, "networth", user.uid));
                if (snap.exists()) {
                    setAssets(snap.data().assets || {});
                    setLiabilities(snap.data().liabilities || {});
                    setSaved(true);
                }
            } catch (err) {
                console.error("Error fetching Net Worth logs:", err);
            }
        };
        fetchNetWorthData();
    }, [user]);

    // 5. DATABASE INSERTS INTERFACES
    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await setDoc(doc(db, "networth", user.uid), {
                assets,
                liabilities,
                updatedAt: new Date().toISOString()
            });
            setSaved(true);
        } catch (err) {
            console.error("Error committing Net Worth data:", err);
        }
        setLoading(false);
    };

    const totalAssets = Object.values(assets).reduce((sum, v) => sum + Number(v || 0), 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, v) => sum + Number(v || 0), 0);
    const netWorth = totalAssets - totalLiabilities;

    const assetData = ASSETS.filter(a => Number(assets[a.key]) > 0).map(a => ({
        name: a.label,
        value: Number(assets[a.key])
    }));

    return (
        <div className={`networth-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={nwLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Enforces safe line-height distributions to fix layout overlaps */}
                <style>{`
                    .card h3, .card p, .btn-primary, label { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Main Dynamic Summary Box Banner */}
                <motion.div className="card"
                    style={{
                        background: netWorth >= 0 ? "var(--gradient)" : "linear-gradient(135deg, #EF4444, #DC2626)",
                        color: "white",
                        textAlign: "center",
                        padding: "24px"
                    }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ opacity: 0.9, marginBottom: 8, marginTop: 0, fontSize: "14px", fontWeight: 500 }}>{nwLabels.yourNetWorth}</p>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>₹{netWorth.toLocaleString("en-IN")}</h2>
                    <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "14px" }}>
                        <div>
                            <p style={{ fontSize: 12, opacity: 0.8, margin: "0 0 4px 0" }}>{nwLabels.assetsLabel}</p>
                            <p style={{ fontWeight: 700, margin: 0, fontSize: "15px" }}>₹{totalAssets.toLocaleString("en-IN")}</p>
                        </div>
                        <div style={{ width: "1px", background: "rgba(255,255,255,0.2)" }} />
                        <div>
                            <p style={{ fontSize: 12, opacity: 0.8, margin: "0 0 4px 0" }}>{nwLabels.liabilitiesLabel}</p>
                            <p style={{ fontWeight: 700, margin: 0, fontSize: "15px" }}>₹{totalLiabilities.toLocaleString("en-IN")}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Pie Analytics Chart Render Blueprint */}
                {assetData.length > 0 && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
                        <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{nwLabels.assetBreakdown}</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={assetData} cx="50%" cy="40%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {assetData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                                <Legend wrapperStyle={{ fontFamily: "Poppins", fontSize: 12, paddingTop: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* Asset Values Processing Card Container */}
                <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{nwLabels.assetsHeader}</h3>
                    {ASSETS.map(asset => (
                        <div key={asset.key} style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{asset.icon} {asset.label}</label>
                            <input type="number" placeholder={nwLabels.placeholderAsset}
                                value={assets[asset.key] || ""}
                                onChange={e => setAssets({ ...assets, [asset.key]: e.target.value })}
                                style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                        </div>
                    ))}
                </motion.div>

                {/* Liabilities Values Processing Card Container */}
                <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{nwLabels.liabilitiesHeader}</h3>
                    {LIABILITIES.map(liability => (
                        <div key={liability.key} style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{liability.icon} {liability.label}</label>
                            <input type="number" placeholder={nwLabels.placeholderLiability}
                                value={liabilities[liability.key] || ""}
                                onChange={e => setLiabilities({ ...liabilities, [liability.key]: e.target.value })}
                                style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                        </div>
                    ))}
                </motion.div>

                {/* Secure Save Action Dispatch Trigger */}
                <button type="button" className="btn-primary" onClick={handleSave} disabled={loading} style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? nwLabels.saving : nwLabels.saveBtn}
                </button>

            </div>
        </div>
    );
};

export default NetWorth;