import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "../styles/Home.css";

const COLORS = ["#7C3AED", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#06B6D4"];

const Home = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, displayName, expenses, incomes, budget, setBudget, currentLanguage } = useApp();

    // 2. STATE VARIABLE INITIALIZERS
    const [greeting, setGreeting] = useState("");
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [dailyTip, setDailyTip] = useState("");
    const [tipLoading, setTipLoading] = useState(false);
    const [tipFetched, setTipFetched] = useState(false);

    // UNIFIED QUICK ADD OVERLAY MODAL CONTROLLERS
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddTab, setQuickAddTab] = useState("expense");
    const [quickAmount, setQuickAmount] = useState("");
    const [quickCategory, setQuickCategory] = useState("Food");
    const [quickDescription, setQuickDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
    const firstName = displayName || "User";

    // 🚀 FULL 14-LANGUAGE GLOBAL DICTIONARY FOR HOME PAGE
    const LOCAL_LABELS = {
        totalBalance: { English: "Total Balance", "हिंदी": "कुल शेष", "తెలుగు": "మొత్తం నిల్వ", "தமிழ்": "மொத்த இருப்பு", "मराठी": "एकूण शिल्लक", "বাংলা": "মোট ব্যালেন্স", "ગુજરાતી": "કુલ બેલેન્સ", "ಕನ್ನಡ": "ಒಟ್ಟು ಬಾಕಿ", "മലയാളം": "ആകെ ബാക്കി", "ਪੰਜਾਬੀ": "ਕੁੱਲ ਬਕਾਇਆ", Français: "Solde total", Español: "Saldo total", Deutsch: "Gesamtsaldo", "العربية": "الرصيد الإجمالي" }[currentLanguage] || "Total Balance",
        totalIncome: { English: "Income", "हिंदी": "आय", "తెలుగు": "ఆదాయం", "தமிழ்": "வருமானம்", "मराठी": "उत्पन्न", "বাংলা": "আয়", "ગુજરાતી": "આવક", "ಕನ್ನಡ": "ಆದಾಯ", "മലയാളം": "വരുമാനം", "ਪੰਜਾਬੀ": "ਆਮਦਨ", Français: "Revenus", Español: "Ingresos", Deutsch: "Einkommen", "العربية": "الدخل" }[currentLanguage] || "Income",
        totalExpenses: { English: "Expenses", "हिंदी": "खर्च", "తెలుగు": "ఖర్చులు", "தமிழ்": "செலவுகள்", "मराठी": "खर्च", "বাংলা": "ব্যয়", "ગુજરાતી": "ખર્ચ", "ಕನ್ನಡ": "ವೆಚ್ಚಗಳು", "മലയാളം": "ചെലവുകൾ", "ਪੰਜਾਬੀ": "ਖਰਚੇ", Français: "Dépenses", Español: "Gastos", Deutsch: "Ausgaben", "العربية": "المصاريف" }[currentLanguage] || "Expenses",
        addTransactionBtn: { English: "🛍️ Add Transaction", "हिंदी": "🛍️ लेन-देन जोड़ें", "తెలుగు": "🛍️ లావాదేవీని చేర్చు", "தமிழ்": "🛍️ பரிவர்த்தனை சேர்", "मराठी": "🛍️ व्यवहार जोडा", "বাংলা": "🛍️ লেনদেন যোগ করুন", "ગુજરાતી": "🛍️ વ્યવહાર ઉમેરો", "ಕನ್ನಡ": "🛍️ ವಹಿವಾಟು ಸೇರಿಸಿ", "മലയാളം": "🛍️ ഇടപാട് ചേർക്കുക", "ਪੰਜਾਬੀ": "🛍️ ਲੈਣ-ਦੇਣ ਸ਼ਾਮਲ ਕਰੋ", Français: "🛍️ Ajouter transaction", Español: "🛍️ Añadir transacción", Deutsch: "🛍️ Transaktion hinzufügen", "العربية": "🛍️ إضافة معاملة" }[currentLanguage] || "🛍️ Add Transaction",
        setBudget: { English: "🏦 Set Budget", "हिंदी": "🏦 बजट सेट करें", "తెలుగు": "🏦 బడ్జెట్ అమర్చు", "தமிழ்": "🏦 பட்ஜெட்டை அமை", "मराठी": "🏦 बजेट सेट करा", "বাংলা": "🏦 বাজেট সেট করুন", "ગુજરાતી": "🏦 બજેટ સેટ કરો", "ಕನ್ನಡ": "🏦 ಬಜೆಟ್ ನಿಗದಿಪಡಿಸಿ", "മലയാളം": "🏦 ബജറ്റ് സജ്ജമാക്കുക", "ਪੰਜਾਬੀ": "🏦 ਬਜਟ ਸੈੱਟ ਕਰੋ", Français: "🏦 Définir budget", Español: "🏦 Establecer presupuesto", Deutsch: "🏦 Budget festlegen", "العربية": "🏦 تعيين الميزانية" }[currentLanguage] || "🏦 Set Budget",
        monthlyBudget: { English: "Monthly Budget", "हिंदी": "मासिक बजट", "తెలుగు": "నెలవారీ బడ్జెట్", "தமிழ்": "மாதாந்திர பட்ஜெட்", "मराठी": "मासिक बजेट", "বাংলা": "মাসিক বাজেট", "ગુજરાતી": "માસિક બજેટ", "ಕನ್ನಡ": "ಮಾಸಿಕ ಬಜೆಟ್", "മലയാളം": "പ്രതിമാസ ബജറ്റ്", "ਪੰਜਾਬੀ": "ਮਹੀਨਾਵਾਰ ਬਜਟ", Français: "Budget mensuel", Español: "Presupuesto mensual", Deutsch: "Monatsbudget", "العربية": "الميزانية الشهرية" }[currentLanguage] || "Monthly Budget",
        spent: { English: "spent", "हिंदी": "खर्च किया", "తెలుగు": "ఖర్చు చేశారు", "தமிழ்": "செலவிடப்பட்டது", "मराठी": "खर्च केले", "বাংলা": "ব্যয়িত", "ગુજરાતી": "ખર્ચિત", "ಕನ್ನಡ": "ಖರ್ಚು ಮಾಡಲಾಗಿದೆ", "മലയാളം": "ചെലവാക്കി", "ਪੰਜਾਬੀ": "ਖਰਚ ਕੀਤਾ", Français: "dépensé", Español: "gastado", Deutsch: "ausgegeben", "العربية": "أنفق" }[currentLanguage] || "spent",
        budgetLabel: { English: "budget", "हिंदी": "बजट", "తెలుగు": "బడ్జెట్", "தமிழ்": "பட்ஜெட்", "मराठी": "बजेट", "বাংলা": "বাজেট", "ગુજરાતી": "બજેટ", "ಕನ್ನಡ": "ಬಜೆಟ್", "മലയാളം": "ബജറ്റ്", "ਪੰਜਾਬੀ": "ਬਜਟ", Français: "budget", Español: "presupuesto", Deutsch: "budget", "العربية": "ميزانية" }[currentLanguage] || "budget",
        used: { English: "used", "हिंदी": "उपयोग हुआ", "తెలుగు": "వినియోగించారు", "தமிழ்": "பயன்படுத்தப்பட்டது", "मराठी": "वापरले", "বাংলা": "ব্যবহৃত", "ગુજરાતી": "વપરાયેલ", "ಕನ್ನಡ": "ಬಳಸಲಾಗಿದೆ", "മലയാളം": "ഉപയോഗിച്ചു", "ਪੰਜਾਬੀ": "ਵਰਤਿਆ ਗਿਆ", Français: "utilisé", Español: "usado", Deutsch: "verbraucht", "العربية": "مستخدم" }[currentLanguage] || "used",
        spendingByCat: { English: "Spending by Category", "हिंदी": "श्रेणी अनुसार खर्च", "తెలుగు": "వర్గాల వారీగా ఖర్చులు", "தமிழ்": "வகை வாரியாக செலவுகள்", "मराठी": "श्रेणीनुसार खर्च", "বাংলা": "বিভাগ অনুযায়ী ব্যয়", "ગુજરાતી": "શ્રેણી મુજબ ખર્ચ", "ಕನ್ನಡ": "ವರ್ಗಾವಾರು ವೆಚ್ಚಗಳು", "മലയാളം": "വിഭാഗം തിരിച്ചുള്ള ചെലവ്", "ਪੰਜਾਬੀ": "ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਖਰਚਾ", Français: "Dépenses par catégorie", Español: "Gastos por categoría", Deutsch: "Ausgaben nach Kategorie", "العربية": "الإنفاق حسب الفئة" }[currentLanguage] || "Spending by Category",
        aiTitle: { English: "✨ AI Tip of the Day", "हिंदी": "✨ आज का AI सुझाव", "తెలుగు": "✨ నేటి AI ఆర్థిక చిట్కా", "தமிழ்": "✨ இன்றைய AI குறிப்பு", "मराठी": "✨ आजचा AI सल्ला", "বাংলা": "✨ আজকের AI টিপ", "ગુજરાતી": "✨ આજની AI ટિપ", "ಕನ್ನಡ": "✨ ಇಂದಿನ AI ಆರ್ಥಿಕ ಸಲಹೆ", "മലയാളം": "✨ ഇന്നത്തെ AI ടിപ്പ്", "ਪੰਜਾਬੀ": "✨ ਅੱਜ ਦਾ AI ਸੁਝਾਅ", Français: "✨ Conseil IA du jour", Español: "✨ Consejo de IA del día", Deutsch: "✨ KI-Tipp des Tages", "العربية": "✨ نصيحة الذكاء الاصطناعي اليومية" }[currentLanguage] || "✨ AI Tip of the Day",
        aiLoaderText: { English: "Getting your personalized tip...", "हिंदी": "आपका सुझाव लोड हो रहा है...", "తెలుగు": "మీ వ్యక్తిగత ఆర్థిక చిట్కా సిద్ధమవుతోంది...", "தமிழ்": "உங்கள் குறிப்பு ஏற்றப்படுகிறது...", "मराठी": "तुमचा सल्ला लोड होत आहे...", "বাংলা": "আপনার টিপ লোড হচ্ছে...", "ગુજરાતી": "તમારી ટિપ લોડ થઈ રહી છે...", "ಕನ್ನಡ": "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಸಲಹೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...", "മലയാളം": "നിങ്ങളുടെ ടിപ്പ് ലോഡുചെയ്യുന്നു...", "ਪੰਜਾਬੀ": "ਤੁਹਾਡਾ ਸੁਝਾਅ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...", Français: "Chargement de votre conseil...", Español: "Obteniendo su consejo...", Deutsch: "Lade Ihren Tipp...", "العربية": "جاري الحصول على نصيحتك..." }[currentLanguage] || "Getting your personalized tip...",
        aiLoaderTitle: { English: "Loading your tip...", "हिंदी": "लोड हो रहा है...", "తెలుగు": "లోడ్ అవుతోంది...", "தமிழ்": "ஏற்றப்படுகிறது...", "मराठी": "लोड होत आहे...", "বাংলা": "লোড হচ্ছে...", "ગુજરાતી": "લોડ થઈ રહ્યું છે...", "ಕನ್ನಡ": "ಲೋಡ್ ಆಗುತ್ತಿದೆ...", "മലയാളം": "ലോഡുചെയ്യുന്നു...", "ਪੰਜਾਬੀ": "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...", Français: "Chargement...", Español: "Cargando...", Deutsch: "Laden...", "العربية": "جار التحميل..." }[currentLanguage] || "Loading your tip...",
        cancel: { English: "Cancel", "हिंदी": "रद्द करें", "తెలుగు": "రద్దు చేయి", "தமிழ்": "ரத்து செய்", "मराठी": "रद्द करा", "বাংলা": "বাতিল করুন", "ગુજરાતી": "રદ કરો", "ಕನ್ನಡ": "ರದ್ದುಮಾಡಿ", "മലയാളം": "റദ്ദാക്കുക", "ਪੰਜਾਬੀ": "ਰੱਦ ਕਰੋ", Français: "Annuler", Español: "Cancelar", Deutsch: "Abbrechen", "العربية": "إلغاء" }[currentLanguage] || "Cancel",
        amount: { English: "Amount", "हिंदी": "राशि", "తెలుగు": "మొత్తం", "தமிழ்": "தொகை", "मराठी": "रक्कम", "বাংলা": "পরিমাণ", "ગુજરાતી": "રકમ", "ಕನ್ನಡ": "ಮೊತ್ತ", "മലയാളം": "തുക", "ਪੰਜਾਬੀ": "ਰਕਮ", Français: "Montant", Español: "Cantidad", Deutsch: "Betrag", "العربية": "المبلغ" }[currentLanguage] || "Amount",
        type: { English: "Type", "हिंदी": "प्रकार", "తెలుగు": "రకం", "தமிழ்": "வகை", "मराठी": "प्रकार", "বাংলা": "ধরন", "ગુજરાતી": "પ્રકાર", "ಕನ್ನಡ": "ಪ್ರಕಾರ", "മലയാളം": "തരം", "ਪੰਜਾਬੀ": "ਕਿਸਮ", Français: "Type", Español: "Tipo", Deutsch: "Typ", "العربية": "يكتب" }[currentLanguage] || "Type",
        desc: { English: "Description (optional)", "हिंदी": "विवरण (वैकल्पिक)", "తెలుగు": "వివరణ (ఐచ్ఛికం)", "தமிழ்": "விளக்கம் (விருப்பமானது)", "मराठी": "वर्णन (पर्यायी)", "বাংলা": "বিবরণ (ঐচ্ছিক)", "ગુજરાતી": "વર્ણન (વૈકલ્પિક)", "ಕನ್ನಡ": "ವಿವರಣೆ (ಐಚ್ಛಿಕ)", "മലയാളം": "വിവരണം (ഓപ്ഷണൽ)", "ਪੰਜਾਬੀ": "ਵੇਰਵਾ (ਵਿਕਲਪਿਕ)", Français: "Description (optionnel)", Español: "Descripción (opcional)", Deutsch: "Beschreibung (optional)", "العربية": "الوصف (اختياري)" }[currentLanguage] || "Description (optional)",
        saveBtn: { English: "Save", "हिंदी": "सहेजें", "తెలుగు": "సేవ్ చేయి", "தமிழ்": "சேமி", "मराठी": "जतन करा", "বাংলা": "সেভ করুন", "ગુજરાતી": "સાચવો", "ಕನ್ನಡ": "ಉಳಿಸಿ", "മലയാളം": "സംരക്ഷിക്കുക", "ਪੰਜਾਬੀ": "ਸੇਵ ਕਰੋ", Français: "Enregistrer", Español: "Guardar", Deutsch: "Speichern", "العربية": "حفظ" }[currentLanguage] || "Save",
        quickAddTitle: { English: "Quick Add", "हिंदी": "त्वरित जोड़ें", "తెలుగు": "త్వరిత చేర్పు", "தமிழ்": "விரைவு சேர்", "मराठी": "त्वरित जोडा", "বাংলা": "দ্রুত যোগ করুন", "ગુજરાતી": "ઝડપી ઉમેરો", "ಕನ್ನಡ": "ತ್ವರಿತ ಸೇರ್ಪಡೆ", "മലയാളം": "പെട്ടെന്ന് ചേർക്കുക", "ਪੰਜਾਬੀ": "ਤੁਰੰਤ ਸ਼ਾਮਲ ਕਰੋ", Français: "Ajout rapide", Español: "Añadir rápido", Deutsch: "Schnelles Hinzufügen", "العربية": "إضافة سريعة" }[currentLanguage] || "Quick Add",
        expenseTab: { English: "Expense", "हिंदी": "खर्च", "తెలుగు": "ఖర్చు", "தமிழ்": "செலவு", "मराठी": "खर्च", "বাংলা": "ব্যয়", "ગુજરાતી": "ખર્ચ", "ಕನ್ನಡ": "ಖರ್ಚು", "മലയാളം": "ചെലവ്", "ਪੰਜਾਬੀ": "ਖਰਚਾ", Français: "Dépense", Español: "Gasto", Deutsch: "Ausgabe", "العربية": "مصروف" }[currentLanguage] || "Expense",
        incomeTab: { English: "Income", "हिंदी": "आय", "తెలుగు": "ఆదాయం", "தமிழ்": "வருமானம்", "मराठी": "उत्पन्न", "বাংলা": "আয়", "ગુજરાતી": "આવક", "ಕನ್ನಡ": "ಆದಾಯ", "മലയാളം": "വരുമാനം", "ਪੰਜਾਬੀ": "ਆਮਦਨ", Français: "Revenu", Español: "Ingreso", Deutsch: "Einkommen", "العربية": "دخل" }[currentLanguage] || "Income",
        placeholderAmt: { English: "Enter amount", "हिंदी": "राशि दर्ज करें", "తెలుగు": "మొత్తాన్ని నమోదు చేయండి", "தமிழ்": "தொகையை உள்ளிடவும்", "मराठी": "रक्कम प्रविष्ट करा", "বাংলা": "পরিমাণ লিখুন", "ગુજરાતી": "રકમ દાખલ કરો", "ಕನ್ನಡ": "ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ", "മലയാളം": "തുക നൽകുക", "ਪੰਜਾਬੀ": "ਰਕਮ ਦਰਜ ਕਰੋ", Français: "Entrer le montant", Español: "Ingrese la cantidad", Deutsch: "Betrag eingeben", "العربية": "أدخل المبلغ" }[currentLanguage] || "Enter amount",
        placeholderDesc: { English: "What was this for?", "हिंदी": "यह किस लिए था?", "తెలుగు": "ఇది దేనికోసం?", "தமிழ்": "இது எதற்காக?", "मराठी": "हे कशासाठी होते?", "বাংলা": "এটা কিসের জন্য ছিল?", "ગુજરાતી": "આ શેના માટે હતું?", "ಕನ್ನಡ": "ಇದು ಯಾವುದಕ್ಕಾಗಿ?", "മലയാളം": "ഇത് എന്തിനായിരുന്നു?", "ਪੰਜਾਬੀ": "ਇਹ ਕਿਸ ਲਈ ਸੀ?", Français: "Pour quoi était-ce ?", Español: "¿Para qué fue esto?", Deutsch: "Wofür war das?", "العربية": "لم كان هذا؟" }[currentLanguage] || "What was this for?",
        recentTransactions: { English: "Recent Transactions", "हिंदी": "हाल के लेन-देन", "తెలుగు": "ఇటీవలి లావాదేవీలు", "தமிழ்": "சமீபத்திய பரிவர்த்தனைகள்", "मराठी": "अलीकडील व्यवहार", "বাংলা": "সাম্প্রতিক লেনদেন", "ગુજરાતી": "તાજેતરના વ્યવહારો", "ಕನ್ನಡ": "ಇತ್ತೀಚಿನ ವಹಿವಾಟುಗಳು", "മലയാളം": "സമീപകാല ഇടപാടുകൾ", "ਪੰਜਾਬੀ": "ਹਾਲੀਆ ਲੈਣ-ਦੇਣ", Français: "Transactions récentes", Español: "Transacciones recientes", Deutsch: "Letzte Transaktionen", "العربية": "المعاملات الأخيرة" }[currentLanguage] || "Recent Transactions",
        noTransactions: { English: "No transactions found", "हिंदी": "कोई लेन-देन नहीं मिला", "తెలుగు": "లావాదేవీలు ఏవీ లేవు", "தமிழ்": "பரிவர்த்தனைகள் இல்லை", "मराठी": "कोणतेही व्यवहार आढळले नाहीत", "বাংলা": "কোনো লেনদেন পাওয়া যায়নি", "ગુજરાતી": "કોઈ વ્યવહારો મળ્યા નથી", "ಕನ್ನಡ": "ಯಾವುದೇ ವಹಿವಾಟು ಕಂಡುಬಂದಿಲ್ಲ", "മലയാളം": "ഇടപാടുകളൊന്നും കണ്ടെത്തിയില്ല", "ਪੰਜਾਬੀ": "ਕੋਈ ਲੈਣ-ਦੇਣ ਨਹੀਂ ਮਿਲਿਆ", Français: "Aucune transaction", Español: "No hay transacciones", Deutsch: "Keine Transaktionen", "العربية": "لا توجد معاملات" }[currentLanguage] || "No transactions found",
        setMonthlyBudgetHeader: { English: "Set Monthly Budget", "हिंदी": "मासिक बजट निर्धारित करें", "తెలుగు": "నెలవారీ బడ్జెట్ అమర్చు", "தமிழ்": "மாதாந்திர பட்ஜெட்டை அமை", "मराठी": "मासिक बजेट सेट करा", "বাংলা": "মাসিক বাজেট সেট করুন", "ગુજરાતી": "માસિક બજેટ સેટ કરો", "ಕನ್ನಡ": "ಮಾಸಿಕ ಬಜೆಟ್ ನಿಗದಿಪಡಿಸಿ", "മലയാളം": "പ്രതിമാസ ബജറ്റ് സജ്ജമാക്കുക", "ਪੰਜਾਬੀ": "ਮਹੀਨਾਵਾਰ ਬਜਟ ਸੈੱਟ ਕਰੋ", Français: "Définir le budget mensuel", Español: "Establecer presupuesto mensual", Deutsch: "Monatsbudget festlegen", "العربية": "تعيين الميزانية الشهرية" }[currentLanguage] || "Set Monthly Budget",
        currentBudgetLabel: { English: "Current Budget", "हिंदी": "वर्तमान बजट", "తెలుగు": "ప్రస్తుత బడ్జెట్", "தமிழ்": "தற்போதைய பட்ஜெட்", "मराठी": "सध्याचे बजेट", "বাংলা": "বর্তমান বাজেট", "ગુજરાતી": "વર્તમાન બજેટ", "ಕನ್ನಡ": "ಪ್ರಸ್ತುತ ಬಜೆಟ್", "മലയാളം": "നിലവിലെ ബജറ്റ്", "ਪੰਜਾਬੀ": "ਮੌਜੂਦਾ ਬਜਟ", Français: "Budget actuel", Español: "Presupuesto actual", Deutsch: "Aktuelles Budget", "العربية": "الميزانية الحالية" }[currentLanguage] || "Current Budget",
        savingBtn: { English: "Saving...", "हिंदी": "सहेजा जा रहा है...", "తెలుగు": "సేవ్ అవుతోంది...", "தமிழ்": "சேமிக்கப்படுகிறது...", "मराठी": "जतन करत आहे...", "বাংলা": "সেভ হচ্ছে...", "ગુજરાતી": "સાચવી રહ્યું છે...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", "മലയാളം": "സംരക്ഷിക്കുന്നു...", "ਪੰਜਾਬੀ": "ਸੇਵ ਹੋ ਰਿਹਾ ਹੈ...", Français: "Enregistrement...", Español: "Guardando...", Deutsch: "Speichern...", "العربية": "جاري الحفظ..." }[currentLanguage] || "Saving..."
    };

    const CATEGORIES = [
        { value: "Groceries", label: { English: "Groceries", "हिंदी": "किराना", "తెలుగు": "సరుకులు", "தமிழ்": "மளிகை", "मराठी": "किराणा", "বাংলা": "মুদিখানা", "ગુજરાતી": "કરિયાણું", "ಕನ್ನಡ": "ದಿನಸಿ", "മലയാളം": "പലചരക്ക്", "ਪੰਜਾਬੀ": "ਕਰਿਆਨਾ", Français: "Épicerie", Español: "Comestibles", Deutsch: "Lebensmittel", "العربية": "البقالة" }[currentLanguage] || "Groceries", icon: "🛒" },
        { value: "Rent", label: { English: "Rent", "हिंदी": "किराया", "తెలుగు": "ఇంటి అద్దె", "தமிழ்": "வாடகை", "मराठी": "भाडे", "বাংলা": "ভাড়া", "ગુજરાતી": "ભાડું", "ಕನ್ನಡ": "ಬಾಡಿಗೆ", "മലയാളം": "വാടക", "ਪੰਜਾਬੀ": "ਕਿਰਾਇਆ", Français: "Loyer", Español: "Alquiler", Deutsch: "Miete", "العربية": "إيجار" }[currentLanguage] || "Rent", icon: "🏠" },
        { value: "Transport", label: { English: "Transport", "हिंदी": "यातायात", "తెలుగు": "రవాణా", "தமிழ்": "போக்குவரத்து", "मराठी": "वाहतूक", "বাংলা": "পরিবহন", "ગુજરાતી": "વાહનવ્યવહાર", "ಕನ್ನಡ": "ಸಾರಿಗೆ", "മലയാളം": "യാത്ര", "ਪੰਜਾਬੀ": "ਆਵਾਜਾਈ", Français: "Transport", Español: "Transporte", Deutsch: "Transport", "العربية": "وسائل النقل" }[currentLanguage] || "Transport", icon: "🚗" },
        { value: "Food", label: { English: "Food", "हिंदी": "भोजन", "తెలుగు": "ఆహారం", "தமிழ்": "உணவு", "मराठी": "जेवण", "বাংলা": "খাদ্য", "ગુજરાતી": "ખોરાક", "ಕನ್ನಡ": "ಆಹಾರ", "മലയാളം": "ഭക്ഷണം", "ਪੰਜਾਬੀ": "ਭੋਜਨ", Français: "Nourriture", Español: "Comida", Deutsch: "Essen", "العربية": "طعام" }[currentLanguage] || "Food", icon: "🍕" },
        { value: "Health", label: { English: "Health", "हिंदी": "स्वास्थ्य", "తెలుగు": "ఆరోగ్యం", "தமிழ்": "சுகாதாரம்", "मराठी": "आरोग्य", "বাংলা": "স্বাস্থ্য", "ગુજરાતી": "સ્વાસ્થ્ય", "ಕನ್ನಡ": "ಆರೋಗ್ಯ", "മലയാളം": "ആരോഗ്യം", "ਪੰਜਾਬੀ": "ਸਿਹਤ", Français: "Santé", Español: "Salud", Deutsch: "Gesundheit", "العربية": "الصحة" }[currentLanguage] || "Health", icon: "💊" },
        { value: "Entertainment", label: { English: "Entertainment", "हिंदी": "मनोरंजन", "తెలుగు": "వినోదం", "தமிழ்": "பொழுதுபோக்கு", "मराठी": "मनोरंजन", "বাংলা": "বিনোদন", "ગુજરાતી": "મનોરંજન", "ಕನ್ನಡ": "ಮನೋರಂಜನೆ", "മലയാളം": "വിനോദം", "ਪੰਜਾਬੀ": "ਮਨੋਰੰਜਨ", Français: "Divertissement", Español: "Entretenimiento", Deutsch: "Unterhaltung", "العربية": "ترفيه" }[currentLanguage] || "Entertainment", icon: "🎬" },
        { value: "Education", label: { English: "Education", "हिंदी": "शिक्षा", "తెలుగు": "విద్య", "தமிழ்": "கல்வி", "मराठी": "शिक्षण", "বাংলা": "শিক্ষা", "ગુજરાતી": "શિક્ષણ", "ಕನ್ನಡ": "ಶಿಕ್ಷಣ", "മലയാളം": "വിദ്യാഭ്യാസം", "ਪੰਜਾਬੀ": "ਸਿੱਖਿਆ", Français: "Éducation", Español: "Educación", Deutsch: "Bildung", "العربية": "تعليم" }[currentLanguage] || "Education", icon: "📚" },
        { value: "Shopping", label: { English: "Shopping", "हिंदी": "खरीदारी", "తెలుగు": "షాపింగ్", "தமிழ்": "ஷாப்பிங்", "मराठी": "खरेदी", "বাংলা": "কেনাকাটা", "ગુજરાતી": "શોપિંગ", "ಕನ್ನಡ": "ಖರೀದಿ", "മലയാളം": "ഷോപ്പിംഗ്", "ਪੰਜਾਬੀ": "ਖਰੀਦਦਾਰੀ", Français: "Achats", Español: "Compras", Deutsch: "Einkaufen", "العربية": "تسوّق" }[currentLanguage] || "Shopping", icon: "🛍️" },
        { value: "Utilities", label: { English: "Utilities", "हिंदी": "बिल", "తెలుగు": "బిల్లులు", "தமிழ்": "பில்கள்", "मराठी": "बिल", "বাংলা": "ইউটিলিটি", "ગુજરાતી": "ઉપયોગિતાઓ", "ಕನ್ನಡ": "ಬಿಲ್ಲುಗಳು", "മലയാളം": "ബില്ലുകൾ", "ਪੰਜਾਬੀ": "ਉਪਯੋਗਤਾਵਾਂ", Français: "Services publics", Español: "Servicios", Deutsch: "Nebenkosten", "العربية": "المرافق" }[currentLanguage] || "Utilities", icon: "💡" },
        { value: "Other", label: { English: "Other", "हिंदी": "अन्य", "తెలుగు": "ఇతరాలు", "தமிழ்": "மற்றவை", "मराठी": "इतर", "বাংলা": "অন্যান্য", "ગુજરાતી": "અન્ય", "ಕನ್ನಡ": "ಇತರೆ", "മലയാളം": "മറ്റുള്ളവ", "ਪੰਜਾਬੀ": "ਹੋਰ", Français: "Autre", Español: "Otro", Deutsch: "Sonstiges", "العربية": "أخرى" }[currentLanguage] || "Other", icon: "💰" }
    ];

    const INCOME_TYPES = [
        { value: "Salary", label: { English: "Salary", "हिंदी": "वेतन", "తెలుగు": "జీతం", "தமிழ்": "சம்பளம்", "मराठी": "पगार", "বাংলা": "বেতন", "ગુજરાતી": "પગાર", "ಕನ್ನಡ": "ಸಂಬಳ", "മലയാളം": "ശമ്പളം", "ਪੰਜਾਬੀ": "ਤਨਖਾਹ", Français: "Salaire", Español: "Salario", Deutsch: "Gehalt", "العربية": "راتب" }[currentLanguage] || "Salary", icon: "💼" },
        { value: "Freelance", label: { English: "Freelance", "हिंदी": "फ्रीलांस", "తెలుగు": "ఫ్రీలాన్స్", "தமிழ்": "சுயதொழில்", "मराठी": "फ्रीलांस", "বাংলা": "ফ্রিল্যান্স", "ગુજરાતી": "ફ્રીલાન્સ", "ಕನ್ನಡ": "ಫ್ರೀಲಾನ್ಸ್", "മലയാളം": "ഫ്രീലാൻസ്", "ਪੰਜਾਬੀ": "ਫ੍ਰੀਲਾਂਸ", Français: "Indépendant", Español: "Autónomo", Deutsch: "Freiberuflich", "العربية": "عمل حر" }[currentLanguage] || "Freelance", icon: "💻" },
        { value: "Business", label: { English: "Business", "हिंदी": "व्यापार", "తెలుగు": "వ్యాపారం", "தமிழ்": "வணிகம்", "मराठी": "व्यवसाय", "বাংলা": "ব্যবসা", "ગુજરાતી": "વ્યાપાર", "ಕನ್ನಡ": "ವ್ಯಾಪಾರ", "മലയാളം": "ബിസിനസ്സ്", "ਪੰਜਾਬੀ": "ਵਪਾਰ", Français: "Affaires", Español: "Negocio", Deutsch: "Geschäft", "العربية": "أعمال" }[currentLanguage] || "Business", icon: "🏢" },
        { value: "Investment", label: { English: "Investment", "हिंदी": "निवेश", "తెలుగు": "పెట్టుబడి", "தமிழ்": "முதலீடு", "मराठी": "गुंतवणूक", "বাংলা": "বিনিয়োগ", "ગુજરાતી": "રોકાણ", "ಕನ್ನಡ": "ಹೂಡಿಕೆ", "മലയാളം": "നിക്ഷേപം", "ਪੰਜਾਬੀ": "ਨਿਵੇਸ਼", Français: "Investissement", Español: "Inversión", Deutsch: "Investition", "العربية": "استثمار" }[currentLanguage] || "Investment", icon: "📈" },
        { value: "Other", label: { English: "Other", "हिंदी": "अन्य", "తెలుగు": "ఇతరాలు", "தமிழ்": "மற்றவை", "मराठी": "इतर", "বাংলা": "অন্যান্য", "ગુજરાતી": "અન્ય", "ಕನ್ನಡ": "ಇತರೆ", "മലയാളം": "മറ്റുള്ളവ", "ਪੰਜਾਬੀ": "ਹੋਰ", Français: "Autre", Español: "Otro", Deutsch: "Sonstiges", "العربية": "أخرى" }[currentLanguage] || "Other", icon: "💰" }
    ];

    const translateCategory = (catName) => {
        const found = CATEGORIES.find(c => c.value === catName);
        return found ? found.label : catName;
    };

    // 4. COMPUTATIONS AND TIMERS LOGIC HOOKS
    useEffect(() => {
        const hour = new Date().getHours();
        const traditionalGreetings = {
            English: { morning: "Good Morning", afternoon: "Good Afternoon", evening: "Good Evening" },
            "हिंदी": { morning: "शुभ प्रभात", afternoon: "शुभ दोपहर", evening: "शुभ संध्या" },
            "తెలుగు": { morning: "శుభోదయం", afternoon: "శుభ మధ్యాహ్నం", evening: "శుభ సాయంకాలం" },
            "தமிழ்": { morning: "காலை வணக்கம்", afternoon: "மதிய வணக்கம்", evening: "மாலை வணக்கம்" },
            "मराठी": { morning: "शुभ प्रभात", afternoon: "शुभ दुपार", evening: "शुभ संध्याकाळ" },
            "বাংলা": { morning: "সুপ্রভাত", afternoon: "শুভ অপরাহ্ন", evening: "শুভ সন্ধ্যা" },
            "ગુજરાતી": { morning: "શુભ સવાર", afternoon: "શુભ બપોર", evening: "શુભ સાંજ" },
            "ಕನ್ನಡ": { morning: "ಶುಭೋದಯ", afternoon: "ಶುಭ ಮಧ್ಯಾಹ್ನ", evening: "ಶುಭ ಸಂಜೆ" },
            "മലയാളം": { morning: "സുപ്രഭാതം", afternoon: "ശുഭ ഉച്ചതിരിഞ്ഞ്", evening: "ശുഭ സായാഹ്നം" },
            "ਪੰਜਾਬੀ": { morning: "ਸ਼ੁਭ ਸਵੇਰ", afternoon: "ਸ਼ੁਭ ਦੁਪਹਿਰ", evening: "ਸ਼ੁਭ ਸ਼ਾਮ" },
            Français: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir" },
            Español: { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches" },
            Deutsch: { morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend" },
            "العربية": { morning: "صباح الخير", afternoon: "طاب مساؤك", evening: "مساء الخير" }
        };
        const activeBundle = traditionalGreetings[currentLanguage] || traditionalGreetings.English;
        if (hour < 12) setGreeting(activeBundle.morning);
        else if (hour < 17) setGreeting(activeBundle.afternoon);
        else setGreeting(activeBundle.evening);
    }, [currentLanguage]);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const balance = totalIncome - totalExpenses;
    const budgetUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0;

    const categoryData = expenses.reduce((acc, expense) => {
        const translatedName = translateCategory(expense.category);
        const existing = acc.find(item => item.name === translatedName);
        if (existing) existing.value += Number(expense.amount);
        else acc.push({ name: translatedName, value: Number(expense.amount) });
        return acc;
    }, []);

    // 5. EXTERNAL AI PROMPT DISPATCH GENERATOR
    const fetchDailyTip = async () => {
        if (tipLoading) return;
        setTipLoading(true);
        setDailyTip("");
        try {
            const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;
            const categoryBreakdown = expenses.reduce((acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
                return acc;
            }, {});
            const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];

            if (!OPENROUTER_API_KEY) throw new Error("Key missing.");

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://spendly.app",
                    "X-Title": "Spendly"
                },
                body: JSON.stringify({
                    model: "openrouter/auto",
                    messages: [{
                        role: "user",
                        content: `You are an expert Indian personal finance advisor. Give ONE short, specific, actionable financial tip based on this user data:
- Savings Rate: ${savingsRate}%
- Monthly Budget: Rs.${budget.toLocaleString("en-IN")}
- Top spending category: ${topCategory ? `${topCategory[0]} (Rs.${topCategory[1]})` : "No data yet"}
- Total expenses: Rs.${totalExpenses.toLocaleString("en-IN")}
- Total income: Rs.${totalIncome.toLocaleString("en-IN")}

Rules: Start with ONE relevant emoji. Give exactly ONE sentence. Maximum 25 words. Be very specific to their data. No greeting or introduction.
MANDATORY LANGUAGE RULE: You MUST output your full tip sentence inside the exact vocabulary and script requested here: "${currentLanguage}"`
                    }],
                    max_tokens: 200,
                    temperature: 0.85,
                })
            });

            const data = await response.json();
            const tip = data.choices?.[0]?.message?.content?.trim();
            if (tip) { setDailyTip(tip); setTipFetched(true); }
            else { setDailyTip("💡 Track your daily expenses consistently to identify spending patterns."); setTipFetched(true); }
        } catch (err) {
            setDailyTip("💡 Try to save at least 20% of your income every month for financial security.");
            setTipFetched(true);
        }
        setTipLoading(false);
    };

    useEffect(() => { setTipFetched(false); }, [currentLanguage]);

    useEffect(() => {
        if (!tipFetched && (expenses.length > 0 || incomes.length > 0)) {
            const timer = setTimeout(() => { fetchDailyTip(); }, 1000);
            return () => clearTimeout(timer);
        }
    }, [expenses.length, incomes.length, tipFetched]);

    // 6. DB INSERTS & ACTION MUTATOR HANDLERS
    const handleQuickAddSubmit = async (e) => {
        e.preventDefault();
        if (!quickAmount) return;
        setLoading(true);
        try {
            const targetPath = quickAddTab === "expense" ? "expenses" : "income";
            const payload = {
                userId: user.uid, amount: Number(quickAmount),
                description: quickDescription, date: new Date(date).toISOString(),
                createdAt: new Date().toISOString()
            };
            if (quickAddTab === "expense") payload.category = quickCategory;
            else payload.type = quickCategory;

            await addDoc(collection(db, targetPath), payload);
            setQuickAmount(""); setQuickDescription(""); setShowQuickAdd(false);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        if (!budgetAmount) return;
        setLoading(true);
        try {
            await setDoc(doc(db, "budgets", user.uid), { totalBudget: Number(budgetAmount) }, { merge: true });
            setBudget(Number(budgetAmount)); setBudgetAmount(""); setShowBudgetForm(false);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const getCategoryIcon = (category) => {
        const icons = { Groceries: "🛒", Rent: "🏠", Transport: "🚗", Food: "🍕", Health: "💊", Entertainment: "🎬", Education: "📚", Shopping: "🛍️", Utilities: "💡", Other: "💰" };
        return icons[category] || "💰";
    };

    const formatLocalizedDate = (dateString) => {
        const dateObj = new Date(dateString);
        const localeCodes = { English: "en-IN", "हिंदी": "hi-IN", "తెలుగు": "te-IN", "ಕನ್ನಡ": "kn-IN" };
        const activeLocale = localeCodes[currentLanguage] || "en-IN";
        return dateObj.toLocaleDateString(activeLocale, { day: "numeric", month: "short", year: "numeric" });
    };

    return (
        <div className={`home-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar />
            <div className="page-container" style={{ position: "relative" }}>

                {/* STRUCTURAL LAYOUT FIXED OVERLAY CSS BLUEPRINT */}
                <style>{`
                    .greeting-text, .greeting-name, .balance-label, .card h3, .card p, .btn-primary, label, option { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    .quick-add-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(5px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; }
                    .quick-add-modal-frame { background: var(--card-bg); width: 100%; max-width: 400px; border-radius: 24px; padding: 26px; border: 1px solid var(--border); box-shadow: 0 20px 60px rgba(0,0,0,0.2); box-sizing: border-box; }
                    .qa-tabs { display: flex; background: var(--background); padding: 4px; border-radius: 12px; gap: 4px; margin-bottom: 16px; border: 1px solid var(--border); }
                    .qa-tab-btn { flex: 1; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 13.5px; font-weight: 600; background: transparent; color: var(--text-secondary); transition: all 0.2s; font-family: 'Poppins', sans-serif; }
                    .qa-tab-btn.active.expense { background: #FEE2E2; color: #EF4444; }
                    .qa-tab-btn.active.income { background: #D1FAE5; color: #10B981; }
                    input, select { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* ===== TRANSLATED WELCOME GREETINGS ===== */}
                <motion.div className="greeting-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="greeting-text" style={{ margin: "0 0 4px 0" }}>{greeting} 👋</p>
                    <h2 className="greeting-name" style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>{firstName}</h2>
                </motion.div>

                {/* ===== DYNAMIC ACCOUNT TOTAL BALANCES ===== */}
                <motion.div className="balance-card gradient-bg" style={{ marginTop: 16 }}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                    <p className="balance-label" style={{ margin: "0 0 6px 0" }}>{LOCAL_LABELS.totalBalance}</p>
                    <h2 className="balance-amount" style={{ margin: "0 0 16px 0", fontSize: "32px", fontWeight: 800 }}>₹{balance.toLocaleString("en-IN")}</h2>
                    <div className="balance-row">
                        <div className="balance-item"><span>💰 {LOCAL_LABELS.totalIncome}</span><strong>₹{totalIncome.toLocaleString("en-IN")}</strong></div>
                        <div className="balance-divider" />
                        <div className="balance-item"><span>💸 {LOCAL_LABELS.totalExpenses}</span><strong>₹{totalExpenses.toLocaleString("en-IN")}</strong></div>
                    </div>
                </motion.div>

                {/* ===== DYNAMIC INTELLIGENT EXPERT ENGINE BANNERS ===== */}
                <motion.div className="card"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    style={{ background: darkMode ? "linear-gradient(135deg, #1E1B4B 0%, #2D1B69 100%)" : "linear-gradient(135deg, #EDE9FE 0%, #FAE8FF 100%)", border: `1px solid ${darkMode ? "#4C1D95" : "#DDD6FE"}`, margin: "16px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <motion.div animate={{ rotate: tipLoading ? 360 : 0 }} transition={{ duration: 1, repeat: tipLoading ? Infinity : 0, ease: "linear" }}
                            style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: "0 4px 12px rgba(124,58,237,0.35)" }}>
                            🤖
                        </motion.div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10.5, fontWeight: 700, color: "var(--primary)", marginBottom: 4, marginTop: 0, textTransform: "uppercase", letterSpacing: 0.8 }}>
                                {LOCAL_LABELS.aiTitle}
                            </p>
                            {tipLoading ? (
                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                    {[0, 1, 2].map(i => (
                                        <motion.div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }}
                                            animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
                                    ))}
                                    <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 6 }}>{LOCAL_LABELS.aiLoaderText}</span>
                                </div>
                            ) : dailyTip ? (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ fontSize: 13.5, color: darkMode ? "#C4B5FD" : "#4C1D95", fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                                    {dailyTip}
                                </motion.p>
                            ) : (
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{LOCAL_LABELS.aiLoaderTitle}</p>
                            )}
                        </div>
                        <motion.button onClick={fetchDailyTip} disabled={tipLoading} whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }}
                            style={{ background: "transparent", border: "none", cursor: tipLoading ? "not-allowed" : "pointer", fontSize: 18, opacity: tipLoading ? 0.4 : 1, flexShrink: 0 }}>
                            🔄
                        </motion.button>
                    </div>
                </motion.div>

                {/* ===== ACTION CONTROL PATHWAYS ROW ===== */}
                <motion.div className="quick-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ marginBottom: 16 }}>
                    <motion.button className="quick-action-btn income-btn" onClick={() => { setShowQuickAdd(true); setQuickAddTab("expense"); setQuickCategory("Food"); }} whileTap={{ scale: 0.95 }}>
                        {LOCAL_LABELS.addTransactionBtn}
                    </motion.button>
                    <motion.button className="quick-action-btn budget-btn" onClick={() => { setShowBudgetForm(true); setShowQuickAdd(false); }} whileTap={{ scale: 0.95 }}>
                        {LOCAL_LABELS.setBudget}
                    </motion.button>
                </motion.div>

                {/* ===== FIXED TRANSLATED TRUE SCREEN CENTER MODAL DIALOG ===== */}
                <AnimatePresence>
                    {showQuickAdd && (
                        <div className="quick-add-modal-overlay">
                            <motion.div className="quick-add-modal-frame" initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{LOCAL_LABELS.quickAddTitle}</h3>
                                    <button onClick={() => setShowQuickAdd(false)} style={{ background: "var(--background)", border: "none", width: 28, height: 28, borderRadius: "50%", color: "var(--text-secondary)", cursor: "pointer" }}>✕</button>
                                </div>

                                <div className="qa-tabs">
                                    <button type="button" className={`qa-tab-btn ${quickAddTab === "expense" ? "active expense" : ""}`} onClick={() => { setQuickAddTab("expense"); setQuickCategory("Food"); }}>
                                        💸 {LOCAL_LABELS.expenseTab}
                                    </button>
                                    <button type="button" className={`qa-tab-btn ${quickAddTab === "income" ? "active income" : ""}`} onClick={() => { setQuickAddTab("income"); setQuickCategory("Salary"); }}>
                                        💰 {LOCAL_LABELS.incomeTab}
                                    </button>
                                </div>

                                <form onSubmit={handleQuickAddSubmit}>
                                    <div style={{ marginBottom: 14 }}>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{LOCAL_LABELS.amount} (₹)</label>
                                        <input type="number" placeholder={LOCAL_LABELS.placeholderAmt} value={quickAmount} onChange={e => setQuickAmount(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                    </div>

                                    <div style={{ marginBottom: 14 }}>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{LOCAL_LABELS.type}</label>
                                        <select value={quickCategory} onChange={e => setQuickCategory(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }}>
                                            {quickAddTab === "expense"
                                                ? CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)
                                                : INCOME_TYPES.map(i => <option key={i.value} value={i.value}>{i.icon} {i.label}</option>)
                                            }
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{LOCAL_LABELS.desc}</label>
                                        <input type="text" placeholder={LOCAL_LABELS.placeholderDesc} value={quickDescription} onChange={e => setQuickDescription(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                    </div>

                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600 }}>
                                            {loading ? LOCAL_LABELS.savingBtn : LOCAL_LABELS.saveBtn}
                                        </button>
                                        <button type="button" onClick={() => setShowQuickAdd(false)} style={{ flex: 1, padding: 12, border: "1px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>{LOCAL_LABELS.cancel}</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* SET BUDGET OVERLAY DIALOG PORTAL */}
                <AnimatePresence>
                    {showBudgetForm && (
                        <div className="quick-add-modal-overlay">
                            <motion.div className="quick-add-modal-frame" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <h3 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{LOCAL_LABELS.setMonthlyBudgetHeader}</h3>
                                    <button onClick={() => setShowBudgetForm(false)} style={{ background: "var(--background)", border: "none", width: 28, height: 28, borderRadius: "50%", color: "var(--text-secondary)", cursor: "pointer" }}>✕</button>
                                </div>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, marginTop: 0 }}>{LOCAL_LABELS.currentBudgetLabel}: ₹{budget.toLocaleString("en-IN")}</p>
                                <form onSubmit={handleUpdateBudget}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{LOCAL_LABELS.amount} (₹)</label>
                                        <input type="number" placeholder="0.00" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} required style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }}>{loading ? LOCAL_LABELS.savingBtn : LOCAL_LABELS.saveBtn}</button>
                                        <button type="button" onClick={() => setShowBudgetForm(false)} style={{ flex: 1, padding: 12, border: "1px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>{LOCAL_LABELS.cancel}</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ===== BUDGET RUNWAY ACCORDION TRACKER CARD ===== */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 16 }}>
                    <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>{LOCAL_LABELS.monthlyBudget}</h3>
                        <span className={budgetUsed > 80 ? "badge danger" : "badge success"} style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "12px", fontWeight: 600 }}>{budgetUsed.toFixed(0)}% {LOCAL_LABELS.used}</span>
                    </div>
                    <div className="progress-bar" style={{ height: "10px", background: "var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: 10 }}>
                        <motion.div className={`progress-fill ${budgetUsed > 80 ? "danger" : ""}`}
                            style={{ height: "100%", background: budgetUsed > 80 ? "linear-gradient(135deg, #EF4444, #DC2626)" : "var(--gradient)", borderRadius: "10px" }}
                            initial={{ width: 0 }} animate={{ width: `${Math.min(budgetUsed, 100)}%` }} transition={{ duration: 1, delay: 0.3 }} />
                    </div>
                    <div className="budget-row" style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 500 }}>₹{totalExpenses.toLocaleString("en-IN")} {LOCAL_LABELS.spent}</span>
                        <span style={{ fontSize: "12.5px", fontWeight: 500 }}>₹{budget.toLocaleString("en-IN")} {LOCAL_LABELS.budgetLabel}</span>
                    </div>
                </motion.div>

                {/* ===== DYNAMIC RECHARTS PIE ANALYTICS CANVAS ===== */}
                {categoryData.length > 0 && (
                    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 16 }}>
                        <h3 className="card-title" style={{ fontSize: "15px", fontWeight: "600", marginTop: 0, marginBottom: 16 }}>{LOCAL_LABELS.spendingByCat}</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                    {categoryData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="legend" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
                            {categoryData.map((item, index) => (
                                <div key={index} className="legend-item" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12.5px" }}>
                                    <div className="legend-dot" style={{ background: COLORS[index % COLORS.length], width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
                                    <span style={{ color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>{item.name}</span>
                                    <strong style={{ color: "var(--text-primary)" }}>₹{item.value.toLocaleString("en-IN")}</strong>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ===== TRANSLATED RECORD STREAM ARCHIVE LOGS ===== */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h3 className="card-title" style={{ fontSize: "15px", fontWeight: "600", marginTop: 0, marginBottom: 16 }}>{LOCAL_LABELS.recentTransactions}</h3>
                    {expenses.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: "center", padding: "20px" }}>
                            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px" }}>{LOCAL_LABELS.noTransactions}</p>
                        </div>
                    ) : (
                        expenses.slice(0, 5).map((expense, index) => (
                            <motion.div key={expense.id} className="transaction-item" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                                <div className="transaction-icon" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{getCategoryIcon(expense.category)}</div>
                                <div className="transaction-details" style={{ flex: 1, minWidth: 0 }}>
                                    <p className="transaction-name" style={{ fontWeight: 500, margin: "0 0 2px 0", fontSize: "14px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.description || translateCategory(expense.category)}</p>
                                    <p className="transaction-date" style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{formatLocalizedDate(expense.date)}</p>
                                </div>
                                <p className="transaction-amount danger" style={{ fontWeight: "700", margin: 0, fontSize: "14.5px", color: "#EF4444", flexShrink: 0 }}>-₹{Number(expense.amount).toLocaleString("en-IN")}</p>
                            </motion.div>
                        ))
                    )}
                </motion.div>

            </div>
        </div>
    );
};

export default Home;