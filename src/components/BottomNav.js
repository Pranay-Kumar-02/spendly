import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import "../styles/BottomNav.css";

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, currentLanguage } = useApp();
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [type, setType] = useState("expense");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Food");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const L = (map) => map[currentLanguage] || map["English"] || Object.values(map)[0];

    const LABELS = {
        quickAddTitle: L({ English: "Quick Add", "हिंदी": "त्वरित जोड़ें", "తెలుగు": "త్వరిత చేర్పు", "தமிழ்": "விரைவு சேர்", Français: "Ajout rapide", Español: "Añadir rápido", Deutsch: "Schnelles Hinzufügen", "العربية": "إضافة سريعة", "मराठी": "त्वरित जोडा", "বাংলা": "দ্রুত যোগ", "ગુજરાતી": "ઝડપી ઉમેરો", "ಕನ್ನಡ": "ತ್ವರಿತ ಸೇರ್ಪಡೆ", "മലയാളം": "പെട്ടെന്ന് ചേർക്കുക", "ਪੰਜਾਬੀ": "ਤੁਰੰਤ ਸ਼ਾਮਲ ਕਰੋ" }),
        expenseLabel: L({ English: "Expense", "हिंदी": "खर्च", "తెలుగు": "ఖర్చు", "தமிழ்": "செலவு", Français: "Dépense", Español: "Gasto", Deutsch: "Ausgabe", "العربية": "مصروف", "मराठी": "खर्च", "বাংলা": "ব্যয়", "ಕನ್ನಡ": "ಖರ್ಚು", "മലയാളം": "ചെലവ്", "ਪੰਜਾਬੀ": "ਖਰਚਾ" }),
        incomeLabel: L({ English: "Income", "हिंदी": "आय", "తెలుగు": "ఆదాయం", "தமிழ்": "வருமானம்", Français: "Revenu", Español: "Ingreso", Deutsch: "Einkommen", "العربية": "دخل", "मराठी": "उत्पन्न", "বাংলা": "আয়", "ಕನ್ನಡ": "ಆದಾಯ", "മലയാളം": "വരുമാനം", "ਪੰਜਾਬੀ": "ਆਮਦਨ" }),
        amountLabel: L({ English: "Amount (₹)", "हिंदी": "राशि (₹)", "తెలుగు": "మొత్తం (₹)", Français: "Montant (₹)", Español: "Cantidad (₹)", Deutsch: "Betrag (₹)", "العربية": "المبلغ (₹)" }),
        amountPH: L({ English: "Enter amount", "हिंदी": "राशि दर्ज करें", "తెలుగు": "మొత్తాన్ని నమోదు చేయండి", Français: "Entrer le montant", Español: "Ingrese la cantidad", Deutsch: "Betrag eingeben", "العربية": "أدخل المبلغ" }),
        categoryLabel: L({ English: "Category", "हिंदी": "श्रेणी", "తెలుగు": "విభాగం", Français: "Catégorie", Español: "Categoría", Deutsch: "Kategorie", "العربية": "فئة" }),
        typeLabel: L({ English: "Type", "हिंदी": "प्रकार", "తెలుగు": "రకం", Français: "Type", Español: "Tipo", Deutsch: "Typ", "العربية": "يكتب" }),
        descLabel: L({ English: "Description (optional)", "हिंदी": "विवरण (वैकल्पिक)", "తెలుగు": "వివరణ (ఐచ్ఛికం)", Français: "Description (optionnel)", Español: "Descripción (opcional)", Deutsch: "Beschreibung (optional)", "العربية": "الوصف (اختياري)" }),
        descPH: L({ English: "What was this for?", "हिंदी": "यह किस लिए था?", "తెలుగు": "ఇది దేనికోసం?", Français: "Pour quoi ?", Español: "¿Para qué?", Deutsch: "Wofür?", "العربية": "لم كان هذا؟" }),
        saveBtn: L({ English: "Save", "हिंदी": "सहेजें", "తెలుగు": "సేవ్ చేయి", Français: "Enregistrer", Español: "Guardar", Deutsch: "Speichern", "العربية": "حفظ" }),
        savingBtn: L({ English: "Saving...", "हिंदी": "सहेजा जा रहा है...", "తెలుగు": "సేవ్ అవుతోంది...", Français: "Enregistrement...", Español: "Guardando...", Deutsch: "Speichern...", "العربية": "جاري الحفظ..." }),
        savedMsg: L({ English: "Saved!", "हिंदी": "सहेज लिया!", "తెలుగు": "సేవ్ చేయబడింది!", Français: "Enregistré!", Español: "¡Guardado!", Deutsch: "Gespeichert!", "العربية": "تم الحفظ!" }),
    };

    const CATEGORIES = [
        { value: "Food", label: L({ English: "Food", "हिंदी": "भोजन", "తెలుగు": "ఆహారం", Français: "Nourriture", Español: "Comida", Deutsch: "Essen", "العربية": "طعام" }), icon: "🍕" },
        { value: "Groceries", label: L({ English: "Groceries", "हिंदी": "किराना", "తెలుగు": "సరుకులు", Français: "Épicerie", Español: "Comestibles", Deutsch: "Lebensmittel", "العربية": "البقالة" }), icon: "🛒" },
        { value: "Transport", label: L({ English: "Transport", "हिंदी": "यातायात", "తెలుగు": "రవాణా", Français: "Transport", Español: "Transporte", Deutsch: "Transport", "العربية": "نقل" }), icon: "🚗" },
        { value: "Health", label: L({ English: "Health", "हिंदी": "स्वास्थ्य", "తెలుగు": "ఆరోగ్యం", Français: "Santé", Español: "Salud", Deutsch: "Gesundheit", "العربية": "الصحة" }), icon: "💊" },
        { value: "Entertainment", label: L({ English: "Entertainment", "हिंदी": "मनोरंजन", "తెలుగు": "వినోదం", Français: "Divertissement", Español: "Entretenimiento", Deutsch: "Unterhaltung", "العربية": "ترفيه" }), icon: "🎬" },
        { value: "Shopping", label: L({ English: "Shopping", "हिंदी": "खरीदारी", "తెలుగు": "షాపింగ్", Français: "Achats", Español: "Compras", Deutsch: "Einkaufen", "العربية": "تسوّق" }), icon: "🛍️" },
        { value: "Education", label: L({ English: "Education", "हिंदी": "शिक्षा", "తెలుగు": "విద్య", Français: "Éducation", Español: "Educación", Deutsch: "Bildung", "العربية": "تعليم" }), icon: "📚" },
        { value: "Utilities", label: L({ English: "Utilities", "हिंदी": "बिल", "తెలుగు": "బిల్లులు", Français: "Services", Español: "Servicios", Deutsch: "Nebenkosten", "العربية": "المرافق" }), icon: "💡" },
        { value: "Rent", label: L({ English: "Rent", "हिंदी": "किराया", "తెలుగు": "ఇంటి అద్దె", Français: "Loyer", Español: "Alquiler", Deutsch: "Miete", "العربية": "إيجار" }), icon: "🏠" },
        { value: "Other", label: L({ English: "Other", "हिंदी": "अन्य", "తెలుగు": "ఇతరాలు", Français: "Autre", Español: "Otro", Deutsch: "Sonstiges", "العربية": "أخرى" }), icon: "💰" },
    ];

    const INCOME_TYPES = [
        { value: "Salary", label: L({ English: "Salary", "हिंदी": "वेतन", "తెలుగు": "జీతం", Français: "Salaire", Español: "Salario", Deutsch: "Gehalt", "العربية": "راتب" }), icon: "💼" },
        { value: "Freelance", label: L({ English: "Freelance", "हिंदी": "फ्रीलांस", "తెలుగు": "ఫ్రీలాన్స్", Français: "Indépendant", Español: "Autónomo", Deutsch: "Freiberuflich", "العربية": "عمل حر" }), icon: "💻" },
        { value: "Business", label: L({ English: "Business", "हिंदी": "व्यापार", "తెలుగు": "వ్యాపారం", Français: "Affaires", Español: "Negocio", Deutsch: "Geschäft", "العربية": "أعمال" }), icon: "🏢" },
        { value: "Investment", label: L({ English: "Investment", "हिंदी": "निवेश", "తెలుగు": "పెట్టుబడి", Français: "Investissement", Español: "Inversión", Deutsch: "Investition", "العربية": "استثمار" }), icon: "📈" },
        { value: "Other", label: L({ English: "Other", "हिंदी": "अन्य", "తెలుగు": "ఇతరాలు", Français: "Autre", Español: "Otro", Deutsch: "Sonstiges", "العربية": "أخرى" }), icon: "💰" },
    ];

    const NAV = {
        Home: L({ English: "Home", "हिंदी": "होम", "తెలుగు": "హోమ్", "தமிழ்": "முகப்பு", Français: "Accueil", Español: "Inicio", Deutsch: "Start", "العربية": "الرئيسية" }),
        Expenses: L({ English: "Expenses", "हिंदी": "खर्च", "తెలుగు": "ఖర్చులు", "தமிழ்": "செலவுகள்", Français: "Dépenses", Español: "Gastos", Deutsch: "Ausgaben", "العربية": "المصاريف" }),
        Add: L({ English: "Add", "हिंदी": "जोड़ें", "తెలుగు": "చేర్చు", "தமிழ்": "சேர்", Français: "Ajouter", Español: "Añadir", Deutsch: "Hinzufügen", "العربية": "إضافة" }),
        Reports: L({ English: "Reports", "हिंदी": "रिपोर्ट", "తెలుగు": "రిపోర్ట్స్", "தமிழ்": "அறிக்கைகள்", Français: "Rapports", Español: "Informes", Deutsch: "Berichte", "العربية": "تقارير" }),
        More: L({ English: "More", "हिंदी": "अधिक", "తెలుగు": "మరింత", "தமிழ்": "மேலும்", Français: "Plus", Español: "Más", Deutsch: "Mehr", "العربية": "المزيد" }),
    };

    const navItems = [
        { icon: "📊", label: NAV.Home, path: "/" },
        { icon: "💸", label: NAV.Expenses, path: "/expenses" },
        { icon: "➕", label: NAV.Add, path: "/add", isCenter: true },
        { icon: "📉", label: NAV.Reports, path: "/reports" },
        { icon: "☰", label: NAV.More, path: "/more" },
    ];

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!amount) return;
        setLoading(true);
        try {
            const col = type === "expense" ? "expenses" : "income";
            const payload = { userId: user.uid, amount: Number(amount), description, date: new Date().toISOString(), createdAt: new Date().toISOString() };
            if (type === "expense") payload.category = category;
            else payload.type = category;
            await addDoc(collection(db, col), payload);
            setAmount(""); setDescription(""); setSuccess(true);
            setTimeout(() => { setSuccess(false); setShowQuickAdd(false); }, 1200);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const openModal = () => { setType("expense"); setCategory("Food"); setAmount(""); setDescription(""); setSuccess(false); setShowQuickAdd(true); };

    return (
        <>
            {/* ── ONLY ONE QUICK ADD MODAL ─────────────────────────── */}
            <AnimatePresence>
                {showQuickAdd && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowQuickAdd(false)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 99998 }}
                        />

                        {/* Flex centring wrapper */}
                        <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px", pointerEvents: "none" }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.88, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, y: 30 }}
                                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                                style={{ background: "var(--card-bg)", width: "100%", maxWidth: 400, borderRadius: 24, padding: 26, border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", pointerEvents: "auto", boxSizing: "border-box" }}
                            >
                                {success ? (
                                    <div style={{ textAlign: "center", padding: "28px 10px" }}>
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                            <p style={{ fontSize: 52, margin: "0 0 10px" }}>✅</p>
                                            <p style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)", margin: 0, fontFamily: "Poppins" }}>{LABELS.savedMsg}</p>
                                        </motion.div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Header */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Poppins" }}>{LABELS.quickAddTitle}</h3>
                                            <button onClick={() => setShowQuickAdd(false)}
                                                style={{ background: "var(--background)", border: "none", width: 30, height: 30, borderRadius: "50%", color: "var(--text-secondary)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                        </div>

                                        {/* Type toggle */}
                                        <div style={{ display: "flex", background: "var(--background)", padding: 4, borderRadius: 12, gap: 4, marginBottom: 18, border: "1px solid var(--border)" }}>
                                            {[{ t: "expense", emoji: "💸", label: LABELS.expenseLabel }, { t: "income", emoji: "💰", label: LABELS.incomeLabel }].map(({ t, emoji, label }) => (
                                                <button key={t} type="button"
                                                    onClick={() => { setType(t); setCategory(t === "expense" ? "Food" : "Salary"); }}
                                                    style={{
                                                        flex: 1, padding: "10px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, fontFamily: "Poppins", transition: "all .2s",
                                                        background: type === t ? (t === "expense" ? "#FEE2E2" : "#D1FAE5") : "transparent",
                                                        color: type === t ? (t === "expense" ? "#EF4444" : "#10B981") : "var(--text-secondary)"
                                                    }}>
                                                    {emoji} {label}
                                                </button>
                                            ))}
                                        </div>

                                        <form onSubmit={handleQuickAdd}>
                                            {/* Amount */}
                                            <div style={{ marginBottom: 14 }}>
                                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, fontFamily: "Poppins" }}>{LABELS.amountLabel}</label>
                                                <input type="number" placeholder={LABELS.amountPH} value={amount} onChange={e => setAmount(e.target.value)} onWheel={e => e.target.blur()} required
                                                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                            </div>

                                            {/* Category / Type */}
                                            <div style={{ marginBottom: 14 }}>
                                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, fontFamily: "Poppins" }}>{type === "expense" ? LABELS.categoryLabel : LABELS.typeLabel}</label>
                                                <select value={category} onChange={e => setCategory(e.target.value)}
                                                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
                                                    {(type === "expense" ? CATEGORIES : INCOME_TYPES).map(c => (
                                                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Description */}
                                            <div style={{ marginBottom: 20 }}>
                                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, fontFamily: "Poppins" }}>{LABELS.descLabel}</label>
                                                <input type="text" placeholder={LABELS.descPH} value={description} onChange={e => setDescription(e.target.value)}
                                                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                                            </div>

                                            <button type="submit" disabled={loading} className="btn-primary"
                                                style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1 }}>
                                                {loading ? LABELS.savingBtn : LABELS.saveBtn}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* ── BOTTOM NAV ────────────────────────────────── */}
            <nav className="bottom-nav">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <motion.button
                            key={item.path}
                            className={`nav-item${item.isCenter ? " center-btn" : ""}${isActive && !item.isCenter ? " active" : ""}`}
                            onClick={() => item.isCenter ? openModal() : navigate(item.path)}
                            whileTap={{ scale: 0.82 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            {item.isCenter ? (
                                <>
                                    <motion.div
                                        className="center-icon"
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.93 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                    >
                                        <span style={{ fontSize: 24, marginTop: "-2px" }}>➕</span>
                                    </motion.div>
                                    <span className="center-label">{LABELS.quickAddTitle}</span>
                                </>
                            ) : (
                                <>
                                    <motion.span
                                        className="nav-icon"
                                        animate={isActive ? { y: -2, scale: 1.15 } : { y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    >
                                        {item.icon}
                                    </motion.span>
                                    <span className="nav-label" style={{ fontFamily: "'Poppins',sans-serif" }}>{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            className="active-dot"
                                            layoutId="activeDot"
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                </>
                            )}
                        </motion.button>
                    );
                })}
            </nav>
        </>
    );
};

export default BottomNav;