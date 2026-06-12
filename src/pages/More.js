import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { auth, db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Navbar from "../components/Navbar";
import "../styles/More.css";

const More = () => {
    const { user, darkMode, displayName, currentLanguage } = useApp();
    const navigate = useNavigate();

    // Fallback immediately to user.photoURL to prevent blank flashes
    const [profilePic, setProfilePic] = useState(user?.photoURL || null);

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, "settings", user.uid), snap => {
            if (snap.exists() && (snap.data().photoURL || snap.data().profilePic)) {
                setProfilePic(snap.data().photoURL || snap.data().profilePic);
            } else {
                setProfilePic(user.photoURL || null);
            }
        });
        return () => unsub();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    // 🚀 FULL 14-LANGUAGE GLOBAL GLOSSARY MATRIX FOR SECTION TITLES
    const sectionTranslations = {
        tools: { English: "Finance Tools", "हिंदी": "वित्तीय साधन", "తెలుగు": "ఆర్థిక సాధనాలు", "தமிழ்": "நிதி கருவிகள்", "मराठी": "आर्थिक साधने", "বাংলা": "আর্থিক সরঞ্জাম", "ગુજરાતી": "નાણાકીય સાધનો", "ಕನ್ನಡ": "ಹಣಕಾಸು ಪರಿಕರಗಳು", "മലയാളം": "ധനകാര്യ ഉപകരണങ്ങൾ", "ਪੰਜਾਬੀ": "ਵਿੱਤੀ ਟੂਲ", Français: "Outils Financiers", Español: "Herramientas Financieras", Deutsch: "Finanztools", "العربية": "الأدوات المالية" }[currentLanguage] || "Finance Tools",
        planning: { English: "Goals & Planning", "हिंदी": "लक्ष्य और योजना", "తెలుగు": "లక్ష్యాలు & ప్రణాళిక", "தமிழ்": "இலக்குகள் & திட்டமிடல்", "मराठी": "ध्येये आणि नियोजन", "বাংলা": "লক্ষ্য এবং পরিকল্পনা", "ગુજરાતી": "લક્ષ્યો અને આયોજન", "ಕನ್ನಡ": "ಗುರಿಗಳು ಮತ್ತು ಯೋಜನೆ", "മലയാളം": "ലക്ഷ്യങ്ങളും ആസൂത്രണവും", "ਪੰਜਾਬੀ": "ਟੀਚੇ ਅਤੇ ਯੋਜਨਾਬੰਦੀ", Français: "Objectifs et Planification", Español: "Metas y Planificación", Deutsch: "Ziele & Planung", "العربية": "الأهداف والتخطيط" }[currentLanguage] || "Goals & Planning",
        calculators: { English: "Calculators", "हिंदी": "कैलकुलेटर", "తెలుగు": "క్యాలిక్యులేటర్లు", "தமிழ்": "கால்குலேட்டர்கள்", "मराठी": "कॅल्क्युलेटर", "বাংলা": "ক্যালকুলেটর", "ગુજરાતી": "કેલ્ક્યુલેટર", "ಕನ್ನಡ": "ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು", "മലയാളം": "കാൽക്കുലേറ്ററുകൾ", "ਪੰਜਾਬੀ": "کੈਲਕੁਲੇਟਰ", Français: "Calculatrices", Español: "Calculadoras", Deutsch: "Taschenrechner", "العربية": "حاسبات" }[currentLanguage] || "Calculators",
        account: { English: "Account", "हिंदी": "खाता", "తెలుగు": "ఖాతా", "தமிழ்": "கணக்கு", "मराठी": "खाते", "বাংলা": "অ্যাকাউন্ট", "ગુજરાતી": "એકાઉન્ટ", "ಕನ್ನಡ": "ಖಾತೆ", "മലയാളം": "അക്കൗണ്ട്", "ਪੰਜਾਬੀ": "ਖਾਤਾ", Français: "Compte", Español: "Cuenta", Deutsch: "Konto", "العربية": "حساب" }[currentLanguage] || "Account",
        logout: { English: "🚪 Sign Out", "हिंदी": "🚪 साइन आउट", "తెలుగు": "🚪 సైన్ అవుట్", "தமிழ்": "🚪 வெளியேறு", "मराठी": "🚪 साइन आउट", "বাংলা": "🚪 সাইন আউট", "ગુજરાતી": "🚪 સાઇન આઉટ", "ಕನ್ನಡ": "🚪 ಸೈನ್ ಔಟ್", "മലയാളം": "🚪 സൈൻ ഔട്ട്", "ਪੰਜਾਬੀ": "🚪 ਸਾਈਨ ਆਉਟ", Français: "🚪 Déconnexion", Español: "🚪 Cerrar sesión", Deutsch: "🚪 Abmelden", "العربية": "🚪 تسجيل الخروج" }[currentLanguage] || "🚪 Sign Out"
    };

    // 🚀 FULL 14-LANGUAGE GLOBAL GLOSSARY MATRIX FOR MENU ITEMS
    const itemTranslations = {
        sip: { English: "SIP Calculator", "हिंदी": "एसआईपी कैलकुलेटर", "తెలుగు": "SIP క్యాలిక్యులేటర్", "தமிழ்": "SIP கால்குலேட்டர்", "मराठी": "SIP कॅल्क्युलेटर", "বাংলা": "SIP ক্যালকুলেটর", "ગુજરાતી": "SIP કેલ્ક્યુલેટર", "ಕನ್ನಡ": "SIP ಕ್ಯಾಲ್ಕುಲೇಟರ್", "മലയാളം": "SIP കാൽക്കുലേറ്റർ", "ਪੰਜਾਬੀ": "SIP ਕੈਲਕੁਲੇਟਰ", Français: "Calculatrice SIP", Español: "Calculadora SIP", Deutsch: "SIP-Rechner", "العربية": "حاسبة SIP" }[currentLanguage] || "SIP Calculator",
        loan: { English: "Loan & EMI", "हिंदी": "ऋण और ईएमआई", "తెలుగు": "రుణం & EMI", "தமிழ்": "கடன் & EMI", "मराठी": "कर्ज आणि EMI", "বাংলা": "ঋণ এবং EMI", "ગુજરાતી": "લોન અને EMI", "ಕನ್ನಡ": "ಸಾಲ ಮತ್ತು EMI", "മലയാളം": "വായ്പയും EMI-യും", "ਪੰਜਾਬੀ": "ਕਰਜ਼ਾ ਅਤੇ EMI", Français: "Prêt et EMI", Español: "Préstamo y EMI", Deutsch: "Kredit & EMI", "العربية": "القرض والقسط الشهري" }[currentLanguage] || "Loan & EMI",
        card: { English: "Credit Cards", "हिंदी": "क्रेडिट कार्ड", "తెలుగు": "క్రెడిట్ కార్డ్స్", "தமிழ்": "கிரெடிட் கார்டுகள்", "मराठी": "क्रेडिट कार्ड", "বাংলা": "ক্রেডিট কার্ড", "ગુજરાતી": "ક્રેડિટ કાર્ડ્સ", "ಕನ್ನಡ": "ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್‌ಗಳು", "മലയാളം": "ക്രെഡിറ്റ് കാർഡുകൾ", "ਪੰਜਾਬੀ": "ਕ੍ਰੈਡਿਟ ਕਾਰਡ", Français: "Cartes de crédit", Español: "Tarjetas de crédito", Deutsch: "Kreditkarten", "العربية": "بطاقات الائتمان" }[currentLanguage] || "Credit Cards",
        inc: { English: "Income", "हिंदी": "आय", "తెలుగు": "ఆదాయం", "தமிழ்": "வருமானம்", "मराठी": "उत्पन्न", "বাংলা": "আয়", "ગુજરાતી": "આવક", "ಕನ್ನಡ": "ಆದಾಯ", "മലയാളം": "വരുമാനം", "ਪੰਜਾਬੀ": "ਆਮਦਨ", Français: "Revenus", Español: "Ingresos", Deutsch: "Einkommen", "العربية": "الدخل" }[currentLanguage] || "Income",
        bud: { English: "Budget", "हिंदी": "बजट", "తెలుగు": "బడ్జెట్", "தமிழ்": "பட்ஜெட்", "मराठी": "बजेट", "বাংলা": "বাজেট", "ગુજરાતી": "બજેટ", "ಕನ್ನಡ": "ಬಜೆಟ್", "മലയാളം": "ബജറ്റ്", "ਪੰਜਾਬੀ": "ਬਜਟ", Français: "Budget", Español: "Presupuesto", Deutsch: "Budget", "العربية": "الميزانية" }[currentLanguage] || "Budget",
        subs: { English: "Automate Subscriptions", "हिंदी": "सदस्यता स्वचालित करें", "తెలుగు": "ఆటోమేటెడ్ సబ్‌స్క్రిప్షన్లు", "தமிழ்": "சந்தாக்களை தானியங்குபடுத்து", "मराठी": "सदस्यता स्वयंचलित करा", "বাংলা": "স্বয়ংক্রিয় সাবস্ক্রিপশন", "ગુજરાતી": "સ્વચાલિત સબ્સ્ક્રિપ્શન્સ", "ಕನ್ನಡ": "ಚಂದಾದಾರಿಕೆಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತಗೊಳಿಸಿ", "മലയാളം": "സബ്സ്ക്രിപ്ഷനുകൾ ഓട്ടോമേറ്റ് ചെയ്യുക", "ਪੰਜਾਬੀ": "ਗਾਹਕੀ ਸਵੈਚਾਲਤ ਕਰੋ", Français: "Automatiser les abonnements", Español: "Automatizar suscripciones", Deutsch: "Abonnements automatisieren", "العربية": "أتمتة الاشتراكات" }[currentLanguage] || "Automate Subscriptions",
        goals: { English: "My Goals", "हिंदी": "मेरे लक्ष्य", "తెలుగు": "నా లక్ష్యాలు", "தமிழ்": "என் இலக்குகள்", "मराठी": "माझी ध्येये", "বাংলা": "আমার লক্ষ্য", "ગુજરાતી": "મારા લક્ષ્યો", "ಕನ್ನಡ": "ನನ್ನ ಗುರಿಗಳು", "മലയാളം": "എന്റെ ലക്ഷ്യങ്ങൾ", "ਪੰਜਾਬੀ": "ਮੇਰੇ ਟੀਚੇ", Français: "Mes Objectifs", Español: "Mis Metas", Deutsch: "Meine Ziele", "العربية": "أهدافي" }[currentLanguage] || "My Goals",
        bills: { English: "Bills & Reminders", "हिंदी": "बिल और अनुस्मारक", "తెలుగు": "బిల్లులు & రిమైండర్లు", "தமிழ்": "பில்கள் & நினைவூட்டல்கள்", "मराठी": "बिले आणि स्मरणपत्रे", "বাংলা": "বিল এবং অনুস্মারক", "ગુજરાતી": "બિલ અને રિમાઇન્ડર્સ", "ಕನ್ನಡ": "ಬಿಲ್ಲುಗಳು ಮತ್ತು ಜ್ಞಾಪನೆಗಳು", "മലയാളം": "ബില്ലുകളും ഓർമ്മപ്പെടുത്തലുകളും", "ਪੰਜਾਬੀ": "ਬਿੱਲ ਅਤੇ ਰੀਮਾਈਂਡਰ", Français: "Factures et Rappels", Español: "Facturas y Recordatorios", Deutsch: "Rechnungen & Erinnerungen", "العربية": "الفواتير والتذكيرات" }[currentLanguage] || "Bills & Reminders",
        emer: { English: "Emergency Fund", "हिंदी": "आपातकालीन कोष", "తెలుగు": "అత్యవసర నిధి", "தமிழ்": "அவசர நிதி", "मराठी": "आपत्कालीन निधी", "বাংলা": "জরুরি তহবিল", "ગુજરાતી": "કટોકટી ભંડોળ", "ಕನ್ನಡ": "ತುರ್ತು ನಿಧಿ", "മലയാളം": "അടിയന്തര ഫണ്ട്", "ਪੰਜਾਬੀ": "ਐਮਰਜੈਂਸੀ ਫੰਡ", Français: "Fonds d'urgence", Español: "Fondo de emergencia", Deutsch: "Notfallfonds", "العربية": "صندوق الطوارئ" }[currentLanguage] || "Emergency Fund",
        netw: { English: "Net Worth", "हिंदी": "कुल संपत्ति", "తెలుగు": "నికర విలువ", "தமிழ்": "நிகர மதிப்பு", "मराठी": "निव्वळ मूल्य", "বাংলা": "নিট মূল্য", "ગુજરાતી": "ચોખ્ખી સંપત્તિ", "ಕನ್ನಡ": "ನಿವ್ವಳ ಮೌಲ್ಯ", "മലയാളം": "അറ്റമൂല്യം", "ਪੰਜਾਬੀ": "ਕੁੱਲ ਜਾਇਦਾਦ", Français: "Valeur nette", Español: "Valor neto", Deutsch: "Nettovermögen", "العربية": "القيمة الصافية" }[currentLanguage] || "Net Worth",
        tax: { English: "Tax Calculator", "हिंदी": "कर कैलकुलेटर", "తెలుగు": "పన్ను క్యాలిక్యులేటర్", "தமிழ்": "வரி கால்குலேட்டர்", "मराठी": "कर कॅल्क्युलेटर", "বাংলা": "কর ক্যালকুলেটর", "ગુજરાતી": "કર કેલ્ક્યુલેટર", "ಕನ್ನಡ": "ತೆರಿಗೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್", "മലയാളം": "നികുതി കാൽക്കുലേറ്റർ", "ਪੰਜਾਬੀ": "ਟੈਕਸ ਕੈਲਕੁਲੇਟਰ", Français: "Calculatrice d'impôt", Español: "Calculadora de impuestos", Deutsch: "Steuerrechner", "العربية": "حاسبة الضرائب" }[currentLanguage] || "Tax Calculator",
        sett: { English: "Settings", "हिंदी": "सेटिंग्स", "తెలుగు": "సెట్టింగ్స్", "தமிழ்": "அமைப்புகள்", "मराठी": "सेटिंग्ज", "বাংলা": "সেটিংস", "ગુજરાતી": "સેટિંગ્સ", "ಕನ್ನಡ": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", "മലയാളം": "ക്രമീകരണങ്ങൾ", "ਪੰਜਾਬੀ": "ਸੈਟਿੰਗਾਂ", Français: "Paramètres", Español: "Configuración", Deutsch: "Einstellungen", "العربية": "الإعدادات" }[currentLanguage] || "Settings",
        advisor: { English: "Full AI Advisor", "हिंदी": "पूर्ण एआई सलाहकार", "తెలుగు": "పూర్తి AI సలహాదారు", "தமிழ்": "முழு AI ஆலோசகர்", "मराठी": "पूर्ण एआय सल्लागार", "বাংলা": "পূর্ণ এআই উপদেষ্টা", "ગુજરાતી": "સંપૂર્ણ એઆઈ સલાહકાર", "ಕನ್ನಡ": "ಪೂರ್ಣ AI ಸಲಹೆಗಾರ", "മലയാളം": "പൂർണ്ണ AI ഉപദേശകൻ", "ਪੰਜਾਬੀ": "ਪੂਰਾ ਏਆਈ ਸਲਾਹਕਾਰ", Français: "Conseiller IA Complet", Español: "Asesor Completo de IA", Deutsch: "Vollständiger KI-Berater", "العربية": "مستشار الذكاء الاصطناعي الكامل" }[currentLanguage] || "Full AI Advisor"
    };

    const MORE_OPTIONS = [
        {
            section: sectionTranslations.tools,
            items: [
                { icon: "📈", label: itemTranslations.sip, path: "/sip", color: "#10B981" },
                { icon: "🏠", label: itemTranslations.loan, path: "/loans", color: "#3B82F6" },
                { icon: "💳", label: itemTranslations.card, path: "/creditcard", color: "#EC4899" },
                { icon: "💰", label: itemTranslations.inc, path: "/income", color: "#F59E0B" },
                { icon: "🏦", label: itemTranslations.bud, path: "/budget", color: "#7C3AED" },
                { icon: "🤖", label: itemTranslations.subs, path: "/subscriptions", color: "#8B5CF6" },
                { icon: "🧠", label: itemTranslations.advisor, path: "/advisor", color: "#D946EF" },
            ]
        },
        {
            section: sectionTranslations.planning,
            items: [
                { icon: "🎯", label: itemTranslations.goals, path: "/goals", color: "#8B5CF6" },
                { icon: "📅", label: itemTranslations.bills, path: "/bills", color: "#EF4444" },
                { icon: "🆘", label: itemTranslations.emer, path: "/emergency", color: "#F97316" },
                { icon: "💎", label: itemTranslations.netw, path: "/networth", color: "#06B6D4" },
            ]
        },
        {
            section: sectionTranslations.calculators,
            items: [
                { icon: "🧾", label: itemTranslations.tax, path: "/tax", color: "#6B7280" },
            ]
        },
        {
            section: sectionTranslations.account,
            items: [
                { icon: "⚙️", label: itemTranslations.sett, path: "/settings", color: "#7C3AED" },
            ]
        }
    ];

    return (
        <div className={`more-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title="More" />
            <div className="page-container">

                <style>{`
                    .section-title, .more-label, .logout-btn { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    .user-info h3 { font-family: 'Poppins', sans-serif !important; line-height: 1.4 !important; }
                `}</style>

                <motion.div className="user-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* 🚀 BULLETPROOF INLINE STYLES FOR THE AVATAR VISIBILITY */}
                    <div className="user-avatar" style={{ fontWeight: 700, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0, background: 'var(--gradient)', color: 'white', fontSize: '24px' }}>
                        {profilePic ? (
                            <img src={profilePic} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                        ) : (
                            displayName?.charAt(0).toUpperCase() || "U"
                        )}
                    </div>
                    <div className="user-info">
                        <h3 style={{ margin: "0 0 4px 0", color: "var(--text-primary)" }}>{displayName || "User"}</h3>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>{user?.email}</p>
                    </div>
                </motion.div>

                {MORE_OPTIONS.map((section, sIndex) => (
                    <motion.div key={section.section} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sIndex * 0.06 }}>
                        <h3 className="section-title" style={{ fontSize: "13.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-secondary)", margin: "24px 0 10px 4px" }}>
                            {section.section}
                        </h3>
                        <div className="more-items-card" style={{ background: "var(--card-bg)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
                            {section.items.map((item) => (
                                <motion.button key={item.path} className="more-item" onClick={() => navigate(item.path)} whileTap={{ scale: 0.98 }}
                                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "14px 18px", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}>
                                    <div className="more-icon" style={{ background: item.color + "15", width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "14px", flexShrink: 0 }}>
                                        <span style={{ fontSize: "18px" }}>{item.icon}</span>
                                    </div>
                                    <span className="more-label" style={{ flex: 1, fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                                        {item.label}
                                    </span>
                                    <span className="more-arrow" style={{ fontSize: "18px", color: "var(--text-secondary)", opacity: 0.7 }}>›</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ))}

                <motion.button className="logout-btn" onClick={handleLogout} whileTap={{ scale: 0.95 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "14px", borderRadius: "14px", background: darkMode ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2", color: "#EF4444", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", marginTop: "32px", marginBottom: "20px" }}>
                    {sectionTranslations.logout}
                </motion.button>

            </div>
        </div>
    );
};

export default More;