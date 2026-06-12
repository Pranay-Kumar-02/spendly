import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import "../styles/Navbar.css";

const Navbar = ({ title }) => {
    const { darkMode, setDarkMode, currentLanguage, expenses = [], budget = 0, bills = [] } = useApp();
    const [showTopNotif, setShowTopNotif] = useState(false);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [isClearedManually, setIsClearedManually] = useState(false);

    // SYSTEM LOCALIZATION MATRIX FOR CORE WARNING REMINDERS
    const UI_LABELS = {
        notifTitle: { English: "Notifications center", "हिंदी": "सूचना केंद्र", "తెలుగు": "నోటిఫికేషన్స్", "ಕನ್ನಡ": "ಅಧಿಸೂಚನೆಗಳು" }[currentLanguage] || "Notifications",
        clearAllBtn: { English: "Clear All", "हिंदी": "सब साफ़ करें", "తెలుగు": "అన్నీ క్లియర్ చేయి", "ಕನ್ನಡ": "ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ" }[currentLanguage] || "Clear All",
        noNotif: { English: "Your financial health profile is currently stable. No warnings flagged.", "हिंदी": "कोई नई सूचनाएं नहीं हैं।", "తెలుగు": "లావాదేవీల హెచ్చరికలు ఏవీ లేవు.", "ಕನ್ನಡ": "ಯಾವುದೇ ಹೊಸ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ." }[currentLanguage] || "No new alerts.",
        budgetWarn: { English: "⚠️ High Spending Alert! You have crossed 80% of your allocated monthly budget tier.", "हिंदी": "⚠️ बजट चेतावनी: आपने अपने मासिक बजट का 80% से अधिक खर्च कर दिया है।", "తెలుగు": "⚠️ బడ్జెట్ హెచ్చరిక! మీరు మీ నెలవారీ బడ్జెట్‌లో 80% కంటే ఎక్కువ ఖర్చు చేశారు.", "ಕನ್ನಡ": "⚠️ வெಚ್ಚದ ಎಚ್ಚರಿಕೆ! ನಿಮ್ಮ ಬಜೆಟ್‌ನ ಶೇ. 80 ಕ್ಕಿಂತ ಹೆಚ್ಚು ಬಳಸಲಾಗಿದೆ." }[currentLanguage] || "⚠️ Budget warning triggered.",
        billSoon: { English: "🔔 Upcoming Due: Bill entry is matching its payment target date within 3 days.", "हिंदी": "🔔 बिल भुगतान अनुस्मारक: 3 दिनों के भीतर देय तिथि।", "తెలుగు": "🔔 బిల్ రిమైండర్: 3 రోజుల్లో బిల్లు గడువు ముగుస్తుంది.", "ಕನ್ನಡ": "🔔 ಬಿಲ್ ಜ್ಞಾಪನೆ: 3 ದಿನಗಳಲ್ಲಿ ಬಿಲ್ ಪಾವತಿಸಬೇಕಾಗಿದೆ." }[currentLanguage] || "🔔 Invoice due milestone incoming."
    };

    // DYNAMIC TITLE TRANSLATION DICTIONARY MATRIX
    const translateTitle = (inputTitle) => {
        if (!inputTitle) return "";

        const titleTranslations = {
            "Settings": {
                English: "Settings", "हिंदी": "प्राथमिकताएं", "తెలుగు": "ప్రాధాన్యతలు", "தமிழ்": "விருப்பங்கள்",
                "मराठी": "पसंती", "বাংলা": "পছন্দসমূহ", "ગુજરાતી": "पसंदगियों", "ಕನ್ನಡ": "ಆದಾಯಗಳು",
                "മലയാളം": "മുൻഗണനകൾ", "ਪੰਜਾਬੀ": "ਤਰਜੀਹਾਂ", Français: "Préférences", Español: "Preferencias",
                Deutsch: "Einstellungen", "العربية": "الإعدادات"
            },
            "Dashboard": {
                English: "Dashboard", "हिंदी": "डैशबोर्ड", "తెలుగు": "డ్యాష్‌బోర్డ్", "தமிழ்": "டாஷ்போர்டு",
                "मराठी": "डॅशबोर्ड", "বাংলা": "ড্যাশবোর্ড", "ગુજરાતી": "ડૅशબોર્ડ", "ಕನ್ನಡ": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                "മലയാളം": "ഡാഷ്‌ബോർഡ്", "ਪੰਜਾਬੀ": "ਡੈਸ਼ಬೋರ್ಡ", Français: "Tableau de bord", Español: "Tablero",
                Deutsch: "Dashboard", "العربية": "لوحة القيادة"
            },
            "Income": {
                English: "Income Streams", "हिंदी": "आय के स्रोत", "తెలుగు": "ఆదాయ వనరులు", "தமிழ்": "வருமான வழிகள்",
                "मराठी": "उत्पन्नाचे स्त्रोत", "বাংলা": "আয়ের উৎস", "ગુજરાતી": "આવકના સ્ત્રોતો", "ಕನ್ನಡ": "ಆದಾಯದ ಮೂಲಗಳು",
                "മലയാളം": "വരുമാന മാർഗ്ಗങ്ങൾ", "ਪੰਜਾਬੀ": "ਆਮਦਨ ਦੇ ਸਰೋਤ", Français: "Flux de revenus", Español: "Fuentes de ingresos",
                Deutsch: "Einnahmequellen", "العربية": "مصادر الدخل"
            },
            "Expenses": {
                English: "Expenses Management", "हिंदी": "व्यय प्रबंधन", "తెలుగు": "ఖర్చుల నిర్వహణ", "தமிழ்": "செலவு மேலாண்மை",
                "मराठी": "खर्च व्यवस्थापन", "বাংলা": "ব্যয় ব্যবস্থাপনা", "ગુજરાતી": "ಖರ್ಚ್ વ્યવસ્થાપન", "ಕನ್ನಡ": "ವೆಚ್ಚ ನಿರ್ವಹಣೆ",
                "മലയാളം": "ചെലവ് മാനേജ്മെന്റ്", "ਪੰਜਾਬੀ": "ਖਰਚ ਪ੍ਰಬੰಧਨ", Français: "Gestion des dépenses", Español: "Gestión de gastos",
                Deutsch: "Ausgabenverwaltung", "العربية": "إدارة المصروفات"
            }
        };

        const normalizedTitle = inputTitle.trim();
        if (titleTranslations[normalizedTitle]) {
            return titleTranslations[normalizedTitle][currentLanguage] || titleTranslations[normalizedTitle].English;
        }
        return normalizedTitle;
    };

    // ACTIVE LIVE ENGINE SCANNER FOR TOP BAR Reminders
    useEffect(() => {
        if (isClearedManually) return;

        const alertsList = [];
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        if (budget > 0 && (totalExpenses / budget) >= 0.8) {
            alertsList.push({ id: "top_budget_alert", text: UI_LABELS.budgetWarn, isCritical: true });
        }

        bills.forEach((bill, idx) => {
            const today = new Date();
            const targetDue = new Date(bill.dueDate);
            const diffDays = Math.ceil((targetDue - today) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3) {
                alertsList.push({
                    id: `top_bill_${idx}`,
                    text: `${UI_LABELS.billSoon} (${bill.name || "Bill"}: ₹${Number(bill.amount).toLocaleString("en-IN")})`,
                    isCritical: false
                });
            }
        });

        setActiveAlerts(alertsList);
    }, [expenses, budget, bills, currentLanguage, isClearedManually]);

    // Automatically re-arm metrics scanning if dashboard items change values
    useEffect(() => {
        setIsClearedManually(false);
    }, [expenses.length, bills.length]);

    const handleClearAll = () => {
        setActiveAlerts([]);
        setIsClearedManually(true);
    };

    return (
        <>
            {/* VIEWPORT CENTERED CRITICAL NOTIFICATIONS OVERLAY BLOCK */}
            <style>{`
                .navbar-notif-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); z-index: 999998; }
                .navbar-fixed-modal-wrapper { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 999999; padding: 20px; pointer-events: none; }
                .navbar-modal-frame { background: var(--card-bg); width: 100%; max-width: 420px; border-radius: 24px; padding: 26px; border: 1px solid var(--border); box-shadow: 0 20px 60px rgba(0,0,0,0.3); pointer-events: auto; box-sizing: border-box; }
                .navbar-modal-frame h3, .navbar-modal-frame p, .navbar-modal-frame button { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                .navbar-alert-item { padding: 14px; border-radius: 14px; border: 1px solid var(--border); background: var(--background); margin-bottom: 10px; display: flex; align-items: flex-start; gap: 10px; }
                .navbar-alert-item.critical { border-left: 4px solid #EF4444; background: rgba(239, 68, 68, 0.02); }
                .navbar-alert-item.standard { border-left: 4px solid #3B82F6; background: rgba(59, 130, 246, 0.02); }
                .navbar-btn-container { position: relative; display: flex; align-items: center; justify-content: center; }
                .top-badge-dot { position: absolute; top: 2px; right: 2px; width: 9px; height: 9px; background-color: #EF4444; border: 1.5px solid var(--card-bg); border-radius: 50%; }
                .navbar-clear-btn { background: rgba(239, 68, 68, 0.1); border: none; border-radius: 10px; padding: 6px 14px; color: #EF4444; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
                .navbar-clear-btn:hover { background: #EF4444; color: white; }
            `}</style>

            <motion.nav
                className="navbar"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="navbar-left">
                    <h1 className="navbar-logo">
                        Spend<span>ly</span>
                    </h1>
                    {title && <p className="navbar-title">{translateTitle(title)}</p>}
                </div>

                <div className="navbar-right">
                    <motion.button
                        className="dark-mode-btn"
                        onClick={() => setDarkMode(!darkMode)}
                        whileTap={{ scale: 0.9 }}
                    >
                        {darkMode ? "☀️" : "🌙"}
                    </motion.button>

                    <div className="navbar-btn-container">
                        <motion.button
                            className="notification-btn"
                            onClick={() => setShowTopNotif(true)}
                            whileTap={{ scale: 0.9 }}
                        >
                            🔔
                        </motion.button>
                        {activeAlerts.length > 0 && <div className="top-badge-dot" />}
                    </div>
                </div>
            </motion.nav>

            {/* SCREEN CENTER LOCK NOTIFICATIONS PORTAL DIALOG */}
            <AnimatePresence>
                {showTopNotif && (
                    <>
                        <motion.div className="navbar-notif-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTopNotif(false)} />
                        <div className="navbar-fixed-modal-wrapper">
                            <motion.div className="navbar-modal-frame" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>{UI_LABELS.notifTitle}</h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        {activeAlerts.length > 0 && (
                                            <button onClick={handleClearAll} className="navbar-clear-btn">
                                                🗑️ {UI_LABELS.clearAllBtn}
                                            </button>
                                        )}
                                        <button onClick={() => setShowTopNotif(false)} style={{ background: "var(--background)", border: "none", width: 28, height: 28, borderRadius: "50%", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                    </div>
                                </div>
                                <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                                    {activeAlerts.length === 0 ? (
                                        <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)", textAlign: "center", padding: "20px 0" }}>{UI_LABELS.noNotif}</p>
                                    ) : (
                                        activeAlerts.map((alert) => (
                                            <div key={alert.id} className={`navbar-alert-item ${alert.isCritical ? "critical" : "standard"}`}>
                                                <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", width: "100%" }}>{alert.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;