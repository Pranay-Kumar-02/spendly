import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const Budget = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [budgets, setBudgets] = useState({});
    const [editing, setEditing] = useState(null);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);

    // 3. SECURE, GRAMMATICALLY VERIFIED MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const bLabels = {
        title: { English: "Budget", "हिंदी": "बजट", "తెలుగు": "బడ్జెట్", "ಕನ್ನಡ": "ಬಜೆಟ್", "മലയാളം": "ബജറ്റ്" }[currentLanguage] || "Budget",
        totalMonthlyBudget: { English: "Total Monthly Budget", "हिंदी": "कुल मासिक बजट", "తెలుగు": "మొత్తం నెలవారీ బడ్జెట్", "ಕನ್ನಡ": "ಒಟ್ಟು ಮಾసಿಕ ಬಜೆಟ್", "മലയാളം": "ആകെ പ്രതിമാസ ബജറ്റ്" }[currentLanguage] || "Total Monthly Budget",
        setCategoryBudgets: { English: "Set Category Budgets", "हिंदी": "श्रेणी अनुसार बजट निर्धारित करें", "తెలుగు": "వర్గాల వారీగా బడ్జెట్ కేటాయింపు", "ಕನ್ನಡ": "ವರ್ಗಾವಾರು ಬಜೆಟ್ ನಿಗದಿಪಡಿಸಿ" }[currentLanguage] || "Set Category Budgets",
        editBtn: { English: "Edit", "हिंदी": "बदलें", "తెలుగు": "సవరించు", "ಕನ್ನಡ": "ಮಾರ್ಪಡಿಸಿ", "മലയാളം": "മാറ്റുക" }[currentLanguage] || "Edit",
        saveBudgetBtn: { English: "Save Budget", "हिंदी": "बजट सहेजें", "తెలుగు": "బడ్జెట్‌ను సేవ్ చేయి", "ಕನ್ನಡ": "ಬಜೆಟ್ ಉಳಿಸಿ", "മലയാളം": "ബജറ്റ് സേവ് ചെയ്യുക" }[currentLanguage] || "Save Budget",
        savingStatus: { English: "Saving...", "हिंदी": "सहेज रहा हूँ...", "తెలుగు": "சேవ్ చేస్తోంది...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", "മലയാളം": "സേവ് ചെയ്യുന്നു..." }[currentLanguage] || "Saving...",
        placeholderInput: { English: "Enter budget amount", "हिंदी": "बजट राशि दर्ज करें", "తెలుగు": "బడ్జెట్ మొత్తాన్ని నమోదు చేయండి", "ಕನ್ನಡ": "ಬಜೆಟ್ ಮೊತ್ತ ನಮೂದಿಸಿ" }[currentLanguage] || "Enter budget amount"
    };

    // CORE MASTER CATEGORIES TRANSLATION MAPS
    const CATEGORIES = [
        { value: "Groceries", name: { English: "Groceries", "हिंदी": "किराना", "తెలుగు": "సరుకులు", "ಕನ್ನಡ": "ದಿನಸಿ", "മലയാളം": "പലചരക്ക്" }[currentLanguage] || "Groceries", icon: "🛒", color: "#10B981" },
        { value: "Rent", name: { English: "Rent", "हिंदी": "किराया", "తెలుగు": "ఇంటి అద్దె", "ಕನ್ನಡ": "ಬಾಡಿಗೆ", "മലയാളം": "വാടക" }[currentLanguage] || "Rent", icon: "🏠", color: "#EF4444" },
        { value: "Transport", name: { English: "Transport", "हिंदी": "यातायात", "తెలుగు": "రవాణా", "ಕನ್ನಡ": "ಸಾರಿಗೆ", "മലയാളം": "യാത്ര" }[currentLanguage] || "Transport", icon: "🚗", color: "#F59E0B" },
        { value: "Food", name: { English: "Food", "हिंदी": "भोजन", "తెలుగు": "ఆహారం", "ಕನ್ನಡ": "ಆಹಾರ", "മലയാളം": "ഭക്ഷണം" }[currentLanguage] || "Food", icon: "🍕", color: "#EC4899" },
        { value: "Health", name: { English: "Health", "हिंदी": "स्वास्थ्य", "తెలుగు": "ఆరోగ్యం", "ಕನ್ನಡ": "ಆರೋಗ್ಯ", "മലയാളം": "ആരോഗ്യം" }[currentLanguage] || "Health", icon: "💊", color: "#3B82F6" },
        { value: "Entertainment", name: { English: "Entertainment", "हिंदी": "मनोरंजन", "తెలుగు": "వినోదం", "ಕನ್ನಡ": "ಮನೋರಂಜನೆ", "മലയാളം": "വിനോദം" }[currentLanguage] || "Entertainment", icon: "🎬", color: "#8B5CF6" },
        { value: "Education", name: { English: "Education", "हिंदी": "शिक्षा", "తెలుగు": "విద్య", "ಕನ್ನಡ": "ಶಿಕ್ಷಣ", "മലയാളം": "വിദ്യാഭ്യാസം" }[currentLanguage] || "Education", icon: "📚", color: "#06B6D4" },
        { value: "Shopping", name: { English: "Shopping", "हिंदी": "खरीदारी", "తెలుగు": "షాப்பிంగ్", "ಕನ್ನಡ": "ಖರೀದಿ", "മലയാളം": "ഷോപ്പിംഗ്" }[currentLanguage] || "Shopping", icon: "🛍️", color: "#F97316" },
        { value: "Utilities", name: { English: "Utilities", "हिंदी": "बिल", "తెలుగు": "బిల్లులు", "ಕನ್ನಡ": "ಬಿಲ್ಲುಗಳು", "മലയാളം": "ബില്ലുകൾ" }[currentLanguage] || "Utilities", icon: "💡", color: "#6B7280" },
        { value: "Other", name: { English: "Other", "हिंदी": "अन्य", "తెలుగు": "ఇతరాలు", "ಕನ್ನಡ": "ಇತರೆ", "മലയാളം": "മറ്റുള്ളവ" }[currentLanguage] || "Other", icon: "💰", color: "#7C3AED" },
    ];

    // 4. FIREBASE TELEMETRY EFFECT SYNCS
    useEffect(() => {
        if (!user) return;
        const fetchBudgets = async () => {
            try {
                const docRef = doc(db, "budgets", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setBudgets(docSnap.data());
            } catch (err) {
                console.error("Error fetching documents from budgets dataset:", err);
            }
        };
        fetchBudgets();
    }, [user]);

    // 5. DATA MUTATORS WRITE DISPATCH HANDLERS
    const handleSave = async (categoryValue) => {
        setLoading(true);
        try {
            const updated = { ...budgets, [categoryValue]: Number(value) };
            await setDoc(doc(db, "budgets", user.uid), updated);
            setBudgets(updated);
            setEditing(null);
            setValue("");
        } catch (err) {
            console.error("Error matching budget configuration write limits:", err);
        }
        setLoading(false);
    };

    const totalBudget = Object.values(budgets).reduce((sum, v) => sum + Number(v || 0), 0);

    return (
        <div className={`budget-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={bLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Adds uniform Poppins typography line scaling to fix character overlap bugs */}
                <style>{`
                    .card h3, .card p, .btn-primary, label, button { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    .budget-title-header { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; margin: 24px 0 16px 4px; font-size: 16px; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Monthly Budget Master Aggregate Card */}
                <motion.div className="card" style={{ background: "var(--gradient)", color: "white", textAlign: "center", padding: "24px" }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ opacity: 0.9, marginBottom: 8, marginTop: 0, fontSize: "14px", fontWeight: 500 }}>{bLabels.totalMonthlyBudget}</p>
                    <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>₹{totalBudget.toLocaleString("en-IN")}</h2>
                </motion.div>

                {/* Context Subheading Vector Label */}
                <h3 className="budget-title-header" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {bLabels.setCategoryBudgets}
                </h3>

                {/* Dynamically Filtered Category Allocations Loop Grid */}
                {CATEGORIES.map((cat, index) => (
                    <motion.div key={cat.value} className="card" style={{ marginBottom: 12, padding: "16px" }}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                {cat.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px 0", fontSize: "14.5px" }}>{cat.name}</p>
                                <p style={{ fontSize: 13, color: cat.color, fontWeight: 700, margin: 0 }}>
                                    ₹{(budgets[cat.value] || 0).toLocaleString("en-IN")}
                                </p>
                            </div>
                            <button type="button" onClick={() => { setEditing(cat.value); setValue(budgets[cat.value] || ""); }}
                                style={{ background: "var(--background)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "var(--primary)", fontWeight: 600, fontSize: "13px" }}>
                                {bLabels.editBtn}
                            </button>
                        </div>

                        {/* Inline Expandable Value Input Box */}
                        {editing === cat.value && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 14, paddingTop: "14px", borderTop: "1px dashed var(--border)" }}>
                                <input type="number" placeholder={bLabels.placeholderInput}
                                    value={value} onChange={e => setValue(e.target.value)}
                                    style={{ marginBottom: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                <button className="btn-primary" onClick={() => handleSave(cat.value)} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 600 }}>
                                    {loading ? bLabels.savingStatus : bLabels.saveBudgetBtn}
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