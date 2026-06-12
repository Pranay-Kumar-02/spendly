import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import "../styles/Expenses.css";

const CATEGORIES = [
    { name: "Groceries", icon: "🛒" }, { name: "Rent", icon: "🏠" },
    { name: "Transport", icon: "🚗" }, { name: "Food", icon: "🍕" },
    { name: "Health", icon: "💊" }, { name: "Entertainment", icon: "🎬" },
    { name: "Education", icon: "📚" }, { name: "Shopping", icon: "🛍️" },
    { name: "Utilities", icon: "💡" }, { name: "Other", icon: "💰" },
];

const Expenses = () => {
    const { user, darkMode, currentLanguage, t } = useApp();

    const [expenses, setExpenses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Groceries");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // FULL COMPREHENSIVE DICTIONARY MAPS 
    const expensesFallback = {
        title: t.totalExpenses || "Total Expenses",
        transactionsCount: { English: "transactions", "हिंदी": "लेन-देन", "తెలుగు": "లావాదేవీలు", "മലയാളം": "ഇടപാടുകൾ", "मराठी": "व्यवहार", "ગુજરાતી": "વ્યવહારો", "தமிழ்": "பரிவர்த்தனைகள்", "ಕನ್ನಡ": "ವಹಿವಾಟುಗಳು", "বাংলা": "লেনদেন", "ਪੰਜਾਬੀ": "ਲੈਣ-ਦੇਣ", Français: "transactions", Español: "transacciones", Deutsch: "Transaktionen", "العربية": "معاملات" }[currentLanguage] || "transactions",
        searchPlaceholder: { English: "Search expenses...", "हिंदी": "खर्च खोजें...", "తెలుగు": "ఖర్చులు శోధించండి...", "മലയാളം": "ചിലവുകൾ തിരയുക...", "मराठी": "खर्च शोधा...", "ગુજરાતી": "ખર્ચ શોધો...", "தமிழ்": "செலவுகளைத் தேடு...", "ಕನ್ನಡ": "ವೆಚ್ಚಗಳನ್ನು ಹುಡುಕಿ...", "বাংলা": "ব্যয় অনুসন্ধান করুন...", "ਪੰਜਾਬੀ": "ਖਰਚੇ ਖੋਜੋ...", Français: "Rechercher des dépenses...", Español: "Buscar gastos...", Deutsch: "Ausgaben durchsuchen...", "العربية": "ابحث عن المصروفات..." }[currentLanguage] || "Search expenses...",
        filtersBtn: { English: "Filters", "हिंदी": "फ़िल्टर्स", "తెలుగు": "ఫిల్టర్లు", "മലയാളം": "ഫിൽട്ടറുകൾ", "मराठी": "फिल्टर्स", "ગુજરાતી": "ફિલ્ટર્સ", "தமிழ்": "வடிகட்டிகள்", "ಕನ್ನಡ": "ಫಿಲ್ಟರ್‌ಗಳು", "বাংলা": "ফিল্টার", "ਪੰਜਾਬੀ": "ਫਿਲਟਰ", Français: "Filtres", Español: "Filtros", Deutsch: "Filter", "العربية": "الفلاتر" }[currentLanguage] || "Filters",
        advFiltersTitle: { English: "Advanced Filters", "हिंदी": "उन्नत फ़िल्टर्स", "తెలుగు": "అడ్వాన్స్డ్ ఫిల్టర్లు", "മലയാളം": "അഡ്വാൻസ്ഡ് ഫിൽട്ടറുകൾ", "मराठी": "प्रगत फिल्टर्स", "ગુજરાતી": "એડવાન્સ્ડ ફિલ્ટર્સ", "தமிழ்": "மேம்பட்ட வடிகட்டிகள்", "ಕನ್ನಡ": "ಸುಧಾರಿತ ಫಿಲ್ಟರ್‌ಗಳು", "বাংলা": "উन्नत ফিল্টার", "ਪੰਜਾਬੀ": "ਉੱਨਤ ਫਿਲਟਰ", Français: "Filtres Avancés", Español: "Filtros Avanzados", Deutsch: "Erweiterte Filter", "العربية": "الفلاتر المتقدمة" }[currentLanguage] || "Advanced Filters",
        clearAll: { English: "Clear All", "हिंदी": "सभी साफ़ करें", "తెలుగు": "అన్నీ క్లియర్ చేయి", "മലയാളം": "എല്ലാം ക്ലിയർ ചെയ്യുക", "मराठी": "सर्व साफ करा", "ગુજરાતી": "બધું સાફ કરો", "தமிழ்": "அனைத்தையும் நீக்கு", "ಕನ್ನಡ": "ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ", "বাংলা": "সব মুছুন", "ਪੰਜਾਬੀ": "ਸਭ ਸਾਫ਼ ਕਰੋ", Français: "Tout effacer", Español: "Limpiar todo", Deutsch: "Alles löschen", "العربية": "مسح الكل" }[currentLanguage] || "Clear All",
        fromDate: { English: "From Date", "हिंदी": "दिनांक से", "తెలుగు": "ప్రారంభ తేదీ", "മലയാളം": "ആരംഭ തീയതി", "मराठी": "या दिनांकापासून", "ગુજરાતી": "શરૂઆતની તારીખ", "தமிழ்": "தொடக்க தேதி", "ಕನ್ನಡ": "ಪ್ರಾರಂಭ ದಿನಾಂಕ", "বাংলা": "শুরুর তারিখ", "ਪੰਜਾਬੀ": "ਸ਼ੁਰੂਆਤੀ ਮਿਤੀ", Français: "Date de début", Español: "Desde fecha", Deutsch: "Ab Datum", "العربية": "من تاريخ" }[currentLanguage] || "From Date",
        toDate: { English: "To Date", "हिंदी": "दिनांक तक", "తెలుగు": "ముగింపు తేదీ", "മലയാളം": "അവസാന തീയതി", "मराठी": "या दिनांकापर्यंत", "ગુજરાતી": "અંતિમ તારીખ", "தமிழ்": "முடிவு தேதி", "ಕನ್ನಡ": "ಕೊನೆಯ ದಿನಾಂಕ", "বাংলা": "শেষের তারিখ", "ਪੰਜਾਬੀ": "ਅੰਤਿਮ ਮਿਤੀ", Français: "Date de fin", Español: "Hasta fecha", Deutsch: "Bis Datum", "العربية": "إلى تاريخ" }[currentLanguage] || "To Date",
        minAmt: { English: "Min Amount", "हिंदी": "न्यूनतम राशि", "తెలుగు": "కనిష్ట మొత్తం", "മലയാളം": "കുറഞ്ഞ തുക", "मराठी": "किमान रक्कम", "ગુજરાતી": "ન્યૂનતમ રકમ", "தமிழ்": "குறைந்தபட்ச தொகை", "ಕನ್ನಡ": "ಕನಿಷ್ಠ ಮೊತ್ತ", "বাংলা": "সর্বনিম্ন পরিমাণ", "ਪੰਜਾਬੀ": "ਘੱਟੋ-ਘੱਟ ਰਕਮ", Français: "Montant min", Español: "Monto mín", Deutsch: "Mindestbetrag", "العربية": "أقل مبلغ" }[currentLanguage] || "Min Amount",
        maxAmt: { English: "Max Amount", "हिंदी": "अधिकतम राशि", "తెలుగు": "గరిష్ట మొత్తం", "മലയാളം": "കൂടിയ തുക", "मराठी": "कमाल रक्कम", "ગુજરાતી": "મહત્તમ રકમ", "தமிழ்": "அதிகபட்ச தொகை", "ಕನ್ನಡ": "ಗರಿಷ್ಠ ಮೊತ್ತ", "বাংলা": "সর্বোচ্চ পরিমাণ", "ਪੰਜਾਬੀ": "ਵੱਧ ਤੋਂ ਵੱਧ ਰਕਮ", Français: "Montant max", Español: "Monto máx", Deutsch: "Höchstbetrag", "العربية": "أقصى مبلغ" }[currentLanguage] || "Max Amount",
        anyPlaceholder: { English: "Any", "हिंदी": "कोई भी", "తెలుగు": "ఏదైనా", "മലയാളം": "ഏതും", "मराठी": "कोणतीही", "ગુજરાતી": "કોઈપણ", "தமிழ்": "ஏதாவது", "ಕನ್ನಡ": "ಯಾವುದಾದರೂ", "বাংলা": "যেকোনো", "ਪੰਜਾਬੀ": "ਕੋਈ ਵੀ", Français: "Tout", Español: "Cualquiera", Deutsch: "Beliebig", "العربية": "أي مبلغ" }[currentLanguage] || "Any",
        allBtn: { English: "All", "हिंदी": "सब", "తెలుగు": "అన్నీ", "മലയാളം": "എല്ലാം", "मराठी": "सर्व", "ગુજરાતી": "બધા", "தமிழ்": "அனைத்தும்", "ಕನ್ನಡ": "ಎಲ್ಲಾ", "বাংলা": "সব", "ਪੰਜਾਬੀ": "ਸਭ", Français: "Tout", Español: "Todo", Deutsch: "Alle", "العربية": "الكل" }[currentLanguage] || "All",
        addExpenseBtn: { English: "➕ Add Expense", "हिंदी": "➕ खर्च जोड़ें", "తెలుగు": "➕ ఖర్చును జోడించు", "മലയാളം": "➕ ചിലവ് ചേർക്കുക", "मराठी": "➕ खर्च जोडा", "ગુજરાતી": "➕ ખર્ચ ઉમેરો", "தமிழ்": "➕ செலவைச் சேர்", "ಕನ್ನಡ": "➕ ವೆಚ್ಚ ಸೇರಿಸಿ", "বাংলা": "➕ ব্যয় যোগ করুন", "ਪੰਜਾਬੀ": "➕ ਖਰਚਾ ਜੋੜੋ", Français: "➕ Ajouter", Español: "➕ Añadir Gasto", Deutsch: "➕ Ausgabe hinzufügen", "العربية": "➕ إضافة مصروف" }[currentLanguage] || "➕ Add Expense",
        cancelFormBtn: { English: "✕ Cancel", "हिंदी": "✕ रद्द करें", "తెలుగు": "✕ రద్దు చేయి", "മലയാളം": "✕ റദ്ദാക്കുക", "मराठी": "✕ रद्द करा", "ગુજરાતી": "✕ રદ કરો", "தமிழ்": "✕ ரத்துசெய்", "ಕನ್ನಡ": "✕ ರದ್ದುಗೊಳಿಸಿ", "বাংলা": "✕ বাতিল করুন", "ਪੰਜਾਬੀ": "✕ ਰੱਦ ਕਰੋ", Français: "✕ Annuler", Español: "✕ Cancelar", Deutsch: "✕ Abbrechen", "العربية": "✕ إلغاء" }[currentLanguage] || "✕ Cancel",
        cancelEditBtn: { English: "✕ Cancel Edit", "हिंदी": "✕ संपादन रद्द करें", "తెలుగు": "✕ ఎడిట్ రద్దు చేయి", "മലയാളം": "✕ എഡിറ്റ് റദ്ദാക്കുക", "मराठी": "✕ संपादन रद्द करा", "ગુજરાતી": "✕ ફેરફાર રદ કરો", "தமிழ்": "✕ திருத்தத்தை ரத்துசெய்", "ಕನ್ನಡ": "✕ ತಿದ್ದುಪಡಿ ರದ್ದುಗೊಳಿಸಿ", "বাংলা": "✕ এডিট বাতিল করুন", "ਪੰਜਾਬੀ": "✕ ਐਡਿਟ ਰੱਦ ਕਰੋ", Français: "✕ Annuler modif.", Español: "✕ Cancelar Edición", Deutsch: "✕ Bearbeitung abbrechen", "العربية": "✕ إلغاء التعديل" }[currentLanguage] || "✕ Cancel Edit",
        newExpenseTitle: { English: "➕ New Expense", "हिंदी": "➕ नया खर्च", "తెలుగు": "➕ కొత్త ఖర్చు", "മലയാളം": "➕ പുതിയ ചിലവ്", "मराठी": "➕ नवीन खर्च", "ગુજરાતી": "➕ નવો khર્ચ", "தமிழ்": "➕ புதிய செலவு", "ಕನ್ನಡ": "➕ ಹೊಸ ವೆಚ್ಚ", "বাংলা": "➕ নতুন ব্যয়", "ਪੰਜਾਬੀ": "➕ ਨਵਾਂ ਖਰਚਾ", Français: "➕ Nouvelle Dépense", Español: "➕ Nuevo Gasto", Deutsch: "➕ Neue Ausgabe", "العربية": "➕ مصروف جديد" }[currentLanguage] || "➕ New Expense",
        editExpenseTitle: { English: "✏️ Edit Expense", "हिंदी": "✏️ खर्च संपादित करें", "తెలుగు": "✏️ ఖర్చును సవరించు", "മലയാളം": "✏️ ചിലവ് തിരുത്തുക", "मराठी": "✏️ खर्च सुधारा", "ગુજરાતી": "✏️ ખર્ચમાં ફેરફાર કરો", "தமிழ்": "✏️ செலவைத் திருத்து", "ಕನ್ನಡ": "✏️ ವೆಚ್ಚ ಮಾರ್ಪಡಿಸಿ", "বাংলা": "✏️ ব্যয় সংশোধন করুন", "ਪੰਜਾਬੀ": "✏️ ਖਰਚਾ ਐਡਿਟ ਕਰੋ", Français: "✏️ Modifier", Español: "✏️ Editar Gasto", Deutsch: "✏️ Ausgabe bearbeiten", "العربية": "✏️ تعديل المصروف" }[currentLanguage] || "✏️ Edit Expense",
        editingBadge: { English: "Editing", "हिंदी": "संपादन चालू", "తెలుగు": "సవరిస్తున్నారు", "മലയാളം": "തിരുത്തുന്നു", "मराठी": "सुधारत आहे", "ગુજરાતી": "ફેરફાર ચાલુ", "தமிழ்": "திருத்தப்படுகிறது", "ಕನ್ನಡ": "ಮಾರ್ಪಡಿಸಲಾಗುತ್ತಿದೆ", "বাংলা": "সংশোধন করা হচ্ছে", "ਪੰਜਾਬੀ": "ਐਡਿਟ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ", Français: "Modification", Español: "Editando", Deutsch: "Bearbeitung", "العربية": "جاري التعديل" }[currentLanguage] || "Editing",
        amountLabel: t.amount || "Amount",
        categoryLabel: t.type || "Category",
        descLabel: t.desc || "Description (optional)",
        dateLabel: { English: "Date", "हिंदी": "दिनांक", "తెలుగు": "తేదీ", "മലയാളം": "തീയതി", "मराठी": "दिनांक", "ગુજરાતી": "તારીખ", "தமிழ்": "தேதி", "ಕನ್ನಡ": "ದಿನಾಂಕ", "বাংলা": "তারিখ", "ਪੰਜਾਬੀ": "ਮਿਤੀ", Français: "Date", Español: "Fecha", Deutsch: "Datum", "العربية": "التاريخ" }[currentLanguage] || "Date",
        amountPlaceholder: { English: "Enter amount", "हिंदी": "राशि दर्ज करें", "తెలుగు": "మొత్తాన్ని నమోదు చేయండి", "മലയാളം": "തുക രേഖപ്പെടുത്തുക", "मराठी": "रक्कम टाका", "ગુજરાતી": "રકમ દાખલ કરો", "தமிழ்": "தொகையை உள்ளிடவும்", "ಕನ್ನಡ": "ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ", "বাংলা": "পরিमाण লিখুন", "ਪੰਜਾਬੀ": "ਰਕਮ ਭਰੋ", Français: "Saisir montant", Español: "Ingrese monto", Deutsch: "Betrag eingeben", "العربية": "أدخل المبلغ" }[currentLanguage] || "Enter amount",
        descPlaceholder: { English: "What was this for?", "हिंदी": "यह किस लिए था?", "తెలుగు": "ఇది దేనికోసం?", "മലയാളം": "ഇത് എന്തിനായിരുന്നു?", "मराठी": "हा खर्च कशासाठी होता?", "ગુજરાતી": "આ ખર્ચ શેના માટે હતો?", "தமிழ்": "இது எதற்காக?", "ಕನ್ನಡ": "ಇದು ಯಾವುದಕ್ಕಾಗಿ?", "বাংলা": "এটি কীসের জন্য ছিল?", "ਪੰਜਾਬੀ": "ਇਹ ਕਿਸ ਲਈ ਸੀ?", Français: "C'était pour quoi ?", Español: "¿Para qué fue esto?", Deutsch: "Wofür war das?", "العربية": "ماذا كان سبب هذا المصروف؟" }[currentLanguage] || "What was this for?",
        savingStatus: { English: "Saving...", "हिंदी": "सहेज रहा हूँ...", "తెలుగు": "సేవ్ చేస్తోంది...", "മലയാളം": "സേവ് ചെയ്യുന്നു...", "मराठी": "जतन करत आहे...", "ગુજરાતી": "સાચવી રહ્યું છે...", "தமிழ்": "சேமிக்கப்படுகிறது...", "ಕನ್ನಡ": "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", "বাংলা": "সংরক্ষণ করা হচ্ছে...", "ਪੰਜਾਬੀ": "ਸੰਭਾਲਿਆ ਜਾ ਰਿਹਾ ਹੈ...", Français: "Enregistrement...", Español: "Guardando...", Deutsch: "Wird gespeichert...", "العربية": "جاري الحفظ..." }[currentLanguage] || "Saving...",
        updateBtnText: t.updateBudgetBtn || "Update Expense",
        saveBtnText: { English: "💾 Save Expense", "हिंदी": "💾 खर्च सहेजें", "తెలుగు": "💾 ఖర్చును సేవ్ చేయి", "മലയാളം": "💾 ചിലവ് സേവ് ചെയ്യുക", "मराठी": "💾 खर्च जतन करा", "ગુજરાતી": "💾 ખર્ચ સાચવો", "தமிழ்": "💾 செலவைச் சேமி", "ಕನ್ನಡ": "💾 ವೆಚ್ಚ ಉಳಿಸಿ", "বাংলা": "💾 ব্যয় সংরক্ষণ করুন", "ਪੰਜਾਬੀ": "💾 ਖਰਚਾ ਸੰਭਾਲੋ", Français: "💾 Enregistrer", Español: "💾 Guardar Gasto", Deutsch: "💾 Ausgabe speichern", "العربية": "💾 حفظ المصروف" }[currentLanguage] || "💾 Save Expense",
        showingInfo: { English: "Showing", "हिंदी": "दिखा रहा है", "తెలుగు": "చూపిస్తోంది", "മലയാളം": "കാണിക്കുന്നു", "मराठी": "दर्शवत आहे", "ગુજરાતી": "દર્શાવે છે", "தமிழ்": "காட்டப்படுகிறது", "ಕನ್ನಡ": "ತೋರಿಸಲಾಗುತ್ತಿದೆ", "বাংলা": "দেখানো হচ্ছে", "ਪੰਜਾਬੀ": "ਦਿਖਾਇਆ ਜਾ ਰਿਹਾ ਹੈ", Français: "Affichage de", Español: "Mostrando", Deutsch: "Es werden", "العربية": "عرض" }[currentLanguage] || "Showing",
        ofInfo: { English: "of", "हिंदी": "कुल", "తెలుగు": "యొక్క", "മലയാളം": "ഇതിൽ", "मराठी": "पैकी", "ગુજરાતી": "માંથી", "தமிழ்": "இல்", "ಕನ್ನಡ": "ರಲ್ಲಿ", "বাংলা": "এর মধ্যে", "ਪੰਜਾਬੀ": "ਵਿੱਚੋਂ", Français: "sur", Español: "de", Deutsch: "von", "العربية": "من إجمالي" }[currentLanguage] || "of",
        expensesText: { English: "expenses", "हिंदी": "खर्चे", "తెలుగు": "ఖర్చులు", "മലയാളം": "ചിലവുകൾ", "मराठी": "खर्च", "ગુજરાતી": "ખર્ચાઓ", "தமிழ்": "செலவுகள்", "ಕನ್ನಡ": "ವೆಚ್ಚಗಳು", "বাংলা": "ব্যয়", "ਪੰਜਾਬੀ": "ਖਰਚੇ", Français: "dépenses", Español: "gastos", Deutsch: "Ausgaben angezeigt", "العربية": "مصروفات" }[currentLanguage] || "expenses",
        deleteModalTitle: { English: "Delete Expense?", "हिंदी": "खर्च हटाएं?", "తెలుగు": "ఖర్చును డిలీట్ చేయాలా?", "മലയാളം": "ചിലവ് ഒഴിവാക്കണോ?", "मराठी": "खर्च हटवायचा?", "ગુજરાતી": "ખર્ચ કાઢી નાખવો છે?", "தமிழ்": "செலவை நீக்கவா?", "ಕನ್ನಡ": "ವೆಚ್ಚ ಅಳಿಸಬೇಕೆ?", "বাংলা": "ব্যয় কি মুছে ফেলবেন?", "ਪੰਜਾਬੀ": "ਖਰਚਾ ਹਟਾਉਣਾ ਹੈ?", Français: "Supprimer ?", Español: "¿Eliminar Gasto?", Deutsch: "Ausgabe löschen?", "العربية": "حذف المصروف؟" }[currentLanguage] || "Delete Expense?",
        deleteModalBody: { English: "Are you sure you want to delete", "हिंदी": "क्या आप निश्चित रूप से हटाना चाहते हैं", "తెలుగు": "మీరు ఖచ్చితంగా డిలీట్ చేయాలనుకుంటున్నారా", "മലയാളം": "തീർച്ചയായും ഒഴിവാക്കണമെന്നുണ്ടോ", "मराठी": "आपण नक्की हटवू इच्छिता", "ગુજરાતી": "શું તમે ખરેખર કાઢી નાખવા માંગો છો", "தமிழ்": "நிச்சயமாக நீக்க வேண்டுமா", "ಕನ್ನಡ": "ನೀವು ಖಚಿತವಾಗಿ ಅಳಿಸಲು ಬಯಸುವಿರಾ", "বাংলা": "আপনি কি নিশ্চিতভাবে মুছে ফেলতে চান", "ਪੰਜਾਬੀ": "ਕੀ ਤੁਸੀਂ ਯਕੀਨੀ ਤੌਰ 'ਤੇ ਹਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ", Français: "Voulez-vous vraiment supprimer", Español: "¿Está seguro de que desea eliminar", Deutsch: "Sind Sie sicher, dass Sie löschen möchten:", "العربية": "هل أنت متأكد أنك تريد حذف" }[currentLanguage] || "Are you sure you want to delete",
        deleteBtnText: { English: "Delete", "हिंदी": "हटाएं", "తెలుగు": "డిలీట్", "മലയാളം": "ഒഴിവാക്കുക", "मराठी": "हटवा", "ગુજરાતી": "કાઢી નાખો", "தமிழ்": "நீக்கு", "ಕನ್ನಡ": "ಅಳಿಸಿ", "বাংলা": "মুছে ফেলুন", "ਪੰਜਾਬੀ": "ਹਟਾਓ", Français: "Supprimer", Español: "Eliminar", Deutsch: "Löschen", "العربية": "حذف" }[currentLanguage] || "Delete",
        noMatchText: { English: "🔍 No expenses match!", "हिंदी": "🔍 कोई खर्च मेल नहीं खाता!", "తెలుగు": "🔍 ఏ ఖర్చులు సరిపోలడం లేదు!", "മലയാളം": "🔍 ചിലവുകൾ ഒന്നും പൊരുത്തപ്പെടുന്നില്ല!", "मराठी": "🔍 कोणताही खर्च जुळत नाही!", "ગુજરાતી": "🔍 કોઈ ખર્ચ મેળ ખાતો નથી!", "தமிழ்": "🔍 செலவுகள் எதுவும் பொருந்தவில்லை!", "ಕನ್ನಡ": "🔍 ಯಾವುದೇ ವೆಚ್ಚಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ!", "বাংলা": "🔍 কোনো ব্যয় মেলেনি!", "ਪੰਜਾਬੀ": "🔍 ਕੋਈ ਖਰਚਾ ਮੇਲ ਨਹੀਂ ਖਾਂਦਾ!", Français: "🔍 Aucune dépense correspondante !", Español: "🔍 ¡Ningún gasto coincide!", Deutsch: "🔍 Keine passenden Ausgaben gefunden!", "العربية": "🔍 لا توجد مصروفات مطابقة!" }[currentLanguage] || "🔍 No expenses match!",
        noExpensesText: { English: "😊 No expenses yet!", "हिंदी": "😊 अभी कोई खर्च नहीं है!", "తెలుగు": "😊 ఇంకా ఏ ఖర్చులు లేవు!", "മലയാളം": "😊 ചിലവുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല!", "मराठी": "😊 अद्याप कोणताही खर्च नाही!", "ગુજરાતી": "😊 હજી સુધી કોઈ ખર્ચ નથી!", "தமிழ்": "😊 செலவுகள் எதுவும் இல்லை!", "ಕನ್ನಡ": "😊 ಇನ್ನೂ ಯಾವುದೇ ವೆಚ್ಚಗಳಿಲ್ಲ!", "বাংলা": "😊 কোনো ব্যয় নেই!", "ਪੰਜਾਬੀ": "😊 ਅਜੇ ਕੋਈ ਖਰਚਾ ਨਹੀਂ!", Français: "😊 Aucune dépense pour l'instant !", Español: "😊 ¡No hay gastos todavía!", Deutsch: "😊 Noch keine Ausgaben erfasst!", "العربية": "😊 لا توجد مصروفات حتى الآن!" }[currentLanguage] || "😊 No expenses yet!",
        startTrackingText: { English: "Start tracking your spending", "हिंदी": "अपना खर्च ट्रैक करना शुरू करें", "తెలుగు": "మీ ఖర్చులను ట్రాక్ చేయడం ప్రారంభించండి", "മലയാളം": "നിങ്ങളുടെ ചിലവുകൾ ട്രാക്ക് ചെയ്തു തുടങ്ങുക", "मराठी": "तुमचे खर्च ट्रॅक करणे सुरू करा", "ગુજરાતી": "તમારા ખર્ચને ટ્રેક કરવાનું શરૂ કરો", "தமிழ்": "உங்கள் செலவுகளைக் கண்காணிப்பதைக் தொடங்குங்கள்", "ಕನ್ನಡ": "ನಿಮ್ಮ ವೆಚ್ಚಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿ", "বাংলা": "আপনার ব্যয় ট্র্যাক করা শুরু করুন", "ਪੰਜਾਬੀ": "ਆਪਣੇ ਖਰਚਿਆਂ ਨੂੰ ਟ੍ਰੈਕ ਕਰਨਾ ਸ਼ੁਰੂ ਕਰੋ", Français: "Commencez à suivre vos dépenses", Español: "Comience a registrar sus gastos", Deutsch: "Beginnen Sie, Ihre Ausgaben zu überwachen", "العربية": "ابدأ في تتبع نفقاتك اليومية" }[currentLanguage] || "Start tracking your spending",
        clearFiltersText: { English: "Clear Filters", "हिंदी": "फ़िल्टर्स हटाएं", "తెలుగు": "ఫిల్టర్లు క్లియర్ చేయి", "മലയാളം": "ഫിൽട്ടറുകൾ മാറ്റുക", "मराठी": "फिल्टर्स काढा", "ગુજરાતી": "ફિલ્ટર્સ સાફ કરો", "தமிழ்": "வடிகட்டிகளை நீக்கு", "ಕನ್ನಡ": "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ", "বাংলা": "ফিল্টার মুছুন", "ਪੰਜਾਬੀ": "ਫਿਲਟਰ ਹਟਾਓ", Français: "Effacer les filtres", Español: "Limpiar filtros", Deutsch: "Filter zurücksetzen", "العربية": "إلغاء الفلاتر" }[currentLanguage] || "Clear Filters",
        editedBadge: { English: "edited", "हिंदी": "संपादित", "తెలుగు": "సవరించబడింది", "മലയാളം": "തിരുത്തിയത്", "मराठी": "सुधारित", "ગુજરાતી": "ફેરફાર કરેલ", "தமிழ்": "திருத்தப்பட்டது", "ಕನ್ನಡ": "ಮಾರ್ಪಡಿಸಲಾಗಿದೆ", "বাংলা": "সংশোধিত", "ਪੰਜਾਬੀ": "ਐਡਿਟ ਕੀਤਾ", Français: "modifié", Español: "editado", Deutsch: "bearbeitet", "العربية": "معدل" }[currentLanguage] || "edited"
    };

    const sortDropdownLabels = {
        newest: { English: "Newest First", "हिंदी": "नवीनतम पहले", "తెలుగు": "కొత్తవి మొదట", "മലയാളം": "പുതിയത് ആദ്യം", "मराठी": "नवीनतम आधी", "ગુજરાતી": "નવીનતમ પહેલા", "தமிழ்": "புதியவை முதலில்", "ಕನ್ನಡ": "ಹೊಸತು ಮೊದಲು", "বাংলা": "নতুন আগে", "ਪੰਜਾਬੀ": "ਨਵੇਂ ਪਹਿਲਾਂ", Français: "Plus récent", Español: "Más reciente", Deutsch: "Neueste zuerst", "العربية": "الأحدث أولاً" }[currentLanguage] || "Newest First",
        oldest: { English: "Oldest First", "हिंदी": "पुराने पहले", "తెలుగు": "పాతవి మొదట", "മലയാളം": "പഴയത് ആദ്യം", "मराठी": "जुने आधी", "ગુજરાતી": "જૂનું પહેલા", "தமிழ்": "பழையவை முதலில்", "ಕನ್ನಡ": "ಹಳೆಯದು ಮೊದಲು", "বাংলা": "পুরানো আগে", "ਪੰਜਾਬੀ": "ਪੁਰਾਣੇ ਪਹਿਲਾਂ", Français: "Plus ancien", Español: "Más antiguo", Deutsch: "Älteste zuerst", "العربية": "الأقدم أولاً" }[currentLanguage] || "Oldest First",
        highest: { English: "Highest Amount", "हिंदी": "अधिकतम राशि", "తెలుగు": "ఎక్కువ మొత్తం", "മലയാളം": "കൂടിയ തുക ആദ്യം", "मराठी": "जास्त रक्कम", "ગુજરાતી": "વધારે રકમ પહેલા", "தமிழ்": "அதிக தொகை", "ಕನ್ನಡ": "ಹೆಚ್ಚಿನ ಮೊತ್ತ", "বাংলা": "সর্বোচ্চ পরিমাণ", "ਪੰਜਾਬੀ": "ਵੱਧ ਰਕਮ ਪਹਿਲਾਂ", Français: "Montant élevé", Español: "Mayor monto", Deutsch: "Höchster Betrag", "العربية": "الأعلى مبلغاً" }[currentLanguage] || "Highest Amount",
        lowest: { English: "Lowest Amount", "हिंदी": "न्यूनतम राशि", "తెలుగు": "తక్కువ మొత్తం", "മലയാളം": "കുറഞ്ഞ തുക ആദ്യം", "मराठी": "कमी रक्कम", "ગુજરાતી": "ઓછી રકમ પહેલા", "தமிழ்": "குறைந்த தொகை", "ಕನ್ನಡ": "ಕಡಿಮೆ ಮೊತ್ತ", "বাংলা": "সর্বনিম্ন পরিমাণ", "ਪੰਜਾਬੀ": "ਘੱਟ ਰਕਮ ਪਹਿਲਾਂ", Français: "Montant faible", Español: "Menor monto", Deutsch: "Geringster Betrag", "العربية": "الأقل مبلغاً" }[currentLanguage] || "Lowest Amount"
    };

    const categoryTranslations = {
        Groceries: { English: "Groceries", "हिंदी": "किराना", "తెలుగు": "సరుకులు", "മലയാളം": "പലചരക്ക്", "मराठी": "किराणा", "ગુજરાતી": "કરિયાણું", "தமிழ்": "மளிகை", "ಕನ್ನಡ": "ದಿನಸಿ", "বাংলা": "মুদিখানা", "ਪੰਜਾਬੀ": "ਕਰਿਆਨਾ", Français: "Courses", Español: "Comestibles", Deutsch: "Lebensmittel", "العربية": "البقالة" }[currentLanguage] || "Groceries",
        Rent: { English: "Rent", "हिंदी": "किराया", "తెలుగు": "ఇంటి అద్దె", "മലയാളം": "വാടക", "मराठी": "भाडे", "ગુજરાતી": "ભાડું", "தமிழ்": "வாடகை", "ಕನ್ನಡ": "ಬಾಡಿಗೆ", "বাংলা": "ভাড়া", "ਪੰਜਾਬੀ": "ਕਿਰਾਇਆ", Français: "Loyer", Español: "Alquiler", Deutsch: "Miete", "العربية": "الإيجار" }[currentLanguage] || "Rent",
        Transport: { English: "Transport", "हिंदी": "यातायात", "తెలుగు": "రవాణా", "മലയാളം": "യാത്ര", "मराठी": "वाहतूक", "ગુજરાતી": "પરિવહન", "தமிழ்": "போக்குவரத்து", "ಕನ್ನಡ": "ಸಾರಿಗೆ", "বাংলা": "পরিবহন", "ਪੰਜਾਬੀ": "ਯਾਤਾਯਾਤ", Français: "Transport", Español: "Transporte", Deutsch: "Transport", "العربية": "المواصلات" }[currentLanguage] || "Transport",
        Food: { English: "Food", "हिंदी": "भोजन", "తెలుగు": "ఆహారం", "മലയാളം": "ഭക്ഷണം", "मराठी": "जेवण", "ગુજરાતી": "ખોરાક", "தமிழ்": "உணவு", "ಕನ್ನಡ": "ಆಹಾರ", "বাংলা": "খাবার", "ਪੰਜਾਬੀ": "ਭੋਜਨ", Français: "Nourriture", Español: "Comida", Deutsch: "Essen", "العربية": "الطعام" }[currentLanguage] || "Food",
        Health: { English: "Health", "हिंदी": "स्वास्थ्य", "తెలుగు": "ఆరోగ్యం", "മലയാളം": "ആരോഗ്യം", "मराठी": "आरोग्य", "ગુજરાતી": "સ્વાસ્થ્ય", "தமிழ்": "மருத்துவம்", "ಕನ್ನಡ": "ಆರೋಗ್ಯ", "বাংলা": "স্বাস্থ্য", "ਪੰਜਾਬੀ": "ਸਿਹਤ", Français: "Santé", Español: "Salud", Deutsch: "Gesundheit", "العربية": "الصحة" }[currentLanguage] || "Health",
        Entertainment: { English: "Entertainment", "हिंदी": "मनोरंजन", "తెలుగు": "వినోదం", "മലയാളം": "വിനോദം", "मराठी": "मनोरंजन", "ગુજરાતી": "મનોરંજન", "தமிழ்": "பொழுதுபோக்கு", "ಕನ್ನಡ": "ಮನೋರಂಜನೆ", "বাংলা": "বিনোদন", "ਪੰਜਾਬੀ": "ਮਨੋਰੰਜਨ", Français: "Divertissement", Español: "Entretenimiento", Deutsch: "Unterhaltung", "العربية": "الترفيه" }[currentLanguage] || "Entertainment",
        Education: { English: "Education", "हिंदी": "शिक्षा", "తెలుగు": "విద్య", "മലയാളം": "വിദ്യാഭ്യാസം", "मराठी": "शिक्षण", "ગુજરાતી": "શિક્ષણ", "தமிழ்": "கல்வி", "ಕನ್ನಡ": "ಶಿಕ್ಷಣ", "বাংলা": "শিক্ষা", "ਪੰਜਾਬੀ": "ਸਿੱਖਿਆ", Français: "Éducation", Español: "Educación", Deutsch: "Bildung", "العربية": "التعليم" }[currentLanguage] || "Education",
        Shopping: { English: "Shopping", "हिंदी": "खरीदारी", "తెలుగు": "షాపింగ్", "മലയാളം": "ഷോപ്പിംഗ്", "मराठी": "खरेदी", "ગુજરાતી": "ખરીદી", "தமிழ்": "ஷாப்பிங்", "ಕನ್ನಡ": "ಖರೀದಿ", "বাংলা": "কেনাকাটা", "ਪੰਜਾਬੀ": "ਖਰੀਦਦਾਰੀ", Français: "Shopping", Español: "Compras", Deutsch: "Einkaufen", "العربية": "التسوق" }[currentLanguage] || "Shopping",
        Utilities: { English: "Utilities", "हिंदी": "उपयोगिताएं", "తెలుగు": "బిల్లులు", "മലയാളം": "ബില്ലുകൾ", "मराठी": "बिल", "ગુજરાતી": "યુટિલિટીઝ", "தமிழ்": "பயன்பாடுகள்", "ಕನ್ನಡ": "ಬಿಲ್ಲುಗಳು", "বাংলা": "ইউটিলিটি", "ਪੰਜਾਬੀ": "ਬਿਜਲੀ-ਪਾਣੀ ਬਿੱਲ", Français: "Factures", Español: "Servicios", Deutsch: "Versorgungsbetriebe", "العربية": "الخدمات العامة" }[currentLanguage] || "Utilities",
        Other: { English: "Other", "हिंदी": "अन्य", "తెలుగు": "ఇతరాలు", "മലയാളം": "മറ്റുള്ളവ", "मराठी": "इतर", "ગુજરાતી": "અન્ય", "தமிழ்": "இதர", "ಕನ್ನಡ": "ಇತರೆ", "বাংলা": "অন্যান্য", "ਪੰਜਾਬੀ": "ਹੋਰ", Français: "Autre", Español: "Otros", Deutsch: "Sonstiges", "العربية": "أخرى" }[currentLanguage] || "Other"
    };

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "expenses"), where("userId", "==", user.uid));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExpenses(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        });
    }, [user]);

    const resetForm = () => {
        setAmount(""); setCategory("Groceries");
        setDescription(""); setDate(new Date().toISOString().split("T")[0]);
        setEditingExpense(null); setShowForm(false);
    };

    const handleOpenEdit = (expense) => {
        setEditingExpense(expense);
        setAmount(expense.amount);
        setCategory(expense.category);
        setDescription(expense.description || "");
        setDate(new Date(expense.date).toISOString().split("T")[0]);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !category) return;
        setLoading(true);
        try {
            if (editingExpense) {
                await updateDoc(doc(db, "expenses", editingExpense.id), {
                    amount: Number(amount),
                    category,
                    description,
                    date: new Date(date).toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            } else {
                await addDoc(collection(db, "expenses"), {
                    userId: user.uid,
                    amount: Number(amount),
                    category,
                    description,
                    date: new Date(date).toISOString(),
                    createdAt: new Date().toISOString(),
                });
            }
            resetForm();
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        await deleteDoc(doc(db, "expenses", id));
        setDeleteConfirm(null);
    };

    const clearFilters = () => {
        setSearchQuery(""); setFilter("all"); setSortBy("newest");
        setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount("");
    };

    let filteredExpenses = expenses.filter(e => {
        if (filter !== "all" && e.category !== filter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!e.description?.toLowerCase().includes(q) && !e.category?.toLowerCase().includes(q)) return false;
        }
        if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(e.date) > new Date(dateTo + "T23:59:59")) return false;
        if (minAmount && Number(e.amount) < Number(minAmount)) return false;
        if (maxAmount && Number(e.amount) > Number(maxAmount)) return false;
        return true;
    });

    filteredExpenses = [...filteredExpenses].sort((a, b) => {
        if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
        if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
        if (sortBy === "highest") return Number(b.amount) - Number(a.amount);
        if (sortBy === "lowest") return Number(a.amount) - Number(b.amount);
        return 0;
    });

    const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const isFiltered = searchQuery || filter !== "all" || dateFrom || dateTo || minAmount || maxAmount;

    const formatLocalizedDate = (dateString) => {
        const dateObj = new Date(dateString);
        const localesMap = {
            English: "en-IN", "हिंदी": "hi-IN", "తెలుగు": "te-IN", "தமிழ்": "ta-IN",
            "मराठी": "mr-IN", "বাংলা": "bn-IN", "ગુજરાતી": "gu-IN", "ಕನ್ನಡ": "kn-IN",
            "മലയാളം": "ml-IN", "ਪੰਜਾਬੀ": "pa-IN", Français: "fr-FR", Español: "es-ES",
            Deutsch: "de-DE", "العربية": "ar-EG"
        };
        const targetLocale = localesMap[currentLanguage] || "en-IN";
        return dateObj.toLocaleDateString(targetLocale, { day: "numeric", month: "short", year: "numeric" });
    };

    return (
        <div className={`expenses-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title="Expenses" />
            <div className="page-container">
                <style>{`
                    .search-bar-container {
                        display: flex; align-items: center; background: var(--card-bg);
                        border: 2px solid var(--border); border-radius: 16px; padding: 6px 16px;
                        margin-bottom: 16px; position: relative; z-index: 10;
                        transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                        backdrop-filter: blur(10px);
                    }
                    .search-bar-container:focus-within {
                        border-color: var(--primary); box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
                    }
                    .search-input-field {
                        flex: 1; border: none; background: transparent; color: var(--text-primary);
                        font-family: 'Poppins', sans-serif; font-size: 14px; outline: none; padding: 8px;
                    }
                    .clear-search-btn {
                        background: var(--background); border: none; color: var(--text-secondary);
                        width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; transition: all 0.2s;
                    }
                    .clear-search-btn:hover { background: #FEE2E2; color: #EF4444; }
                `}</style>

                {/* Total Card */}
                <motion.div className="expenses-total card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <p style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 500 }}>{expensesFallback.title}</p>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 700 }}>₹{totalAmount.toLocaleString("en-IN")}</h2>
                    <p style={{ margin: 0, fontSize: "13px", opacity: 0.85 }}>{filteredExpenses.length} {expensesFallback.transactionsCount}</p>
                </motion.div>

                {/* 🚀 UPGRADED SEARCH BAR: Fixed CSS for 3D Themes */}
                <motion.div className="search-bar-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <span style={{ fontSize: "16px", color: "var(--text-secondary)" }}>🔍</span>
                    <input type="text" placeholder={expensesFallback.searchPlaceholder} value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)} className="search-input-field" />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="clear-search-btn">✕</button>}
                </motion.div>

                {/* Filter Row */}
                <motion.div className="filter-sort-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                    <button className={`filter-toggle-btn ${showFilters ? "active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
                        ⚙️ {expensesFallback.filtersBtn} {isFiltered && <span className="filter-badge">●</span>}
                    </button>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-select" style={{ fontFamily: "Poppins" }}>
                        <option value="newest">{sortDropdownLabels.newest}</option>
                        <option value="oldest">{sortDropdownLabels.oldest}</option>
                        <option value="highest">{sortDropdownLabels.highest}</option>
                        <option value="lowest">{sortDropdownLabels.lowest}</option>
                    </select>
                </motion.div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div className="advanced-filters card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h4 style={{ color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>{expensesFallback.advFiltersTitle}</h4>
                                {isFiltered && <button onClick={clearFilters} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontFamily: "Poppins", fontSize: 13, fontWeight: 500 }}>{expensesFallback.clearAll}</button>}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div><label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{expensesFallback.fromDate}</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: "10px", borderRadius: "8px", fontFamily: "Poppins" }} /></div>
                                <div><label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{expensesFallback.toDate}</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: "10px", borderRadius: "8px", fontFamily: "Poppins" }} /></div>
                                <div><label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{expensesFallback.minAmt} (₹)</label><input type="number" placeholder="0" value={minAmount} onChange={e => setMinAmount(e.target.value)} style={{ padding: "10px", borderRadius: "8px", fontFamily: "Poppins" }} /></div>
                                <div><label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{expensesFallback.maxAmt} (₹)</label><input type="number" placeholder={expensesFallback.anyPlaceholder} value={maxAmount} onChange={e => setMaxAmount(e.target.value)} style={{ padding: "10px", borderRadius: "8px", fontFamily: "Poppins" }} /></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Category Filter */}
                <div className="filter-scroll">
                    <button className={filter === "all" ? "filter-btn active" : "filter-btn"} onClick={() => setFilter("all")} style={{ fontFamily: "Poppins" }}>{expensesFallback.allBtn}</button>
                    {CATEGORIES.map(cat => (
                        <button key={cat.name} className={filter === cat.name ? "filter-btn active" : "filter-btn"} onClick={() => setFilter(cat.name)} style={{ fontFamily: "Poppins" }}>
                            {cat.icon} {categoryTranslations[cat.name] || cat.name}
                        </button>
                    ))}
                </div>

                {/* Add/Edit Button */}
                <motion.button className="btn-primary add-expense-btn"
                    onClick={() => { if (showForm && !editingExpense) { resetForm(); } else if (!showForm) { setShowForm(true); } else { resetForm(); } }}
                    whileTap={{ scale: 0.95 }}>
                    {showForm ? (editingExpense ? expensesFallback.cancelEditBtn : expensesFallback.cancelFormBtn) : expensesFallback.addExpenseBtn}
                </motion.button>

                {/* Add/Edit Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div className="card expense-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                <h3 style={{ margin: 0 }}>{editingExpense ? expensesFallback.editExpenseTitle : expensesFallback.newExpenseTitle}</h3>
                                {editingExpense && (
                                    <span style={{ fontSize: 12, background: "rgba(124, 58, 237, 0.08)", color: "var(--primary)", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
                                        {expensesFallback.editingBadge}
                                    </span>
                                )}
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label style={{ fontFamily: "Poppins" }}>{expensesFallback.amountLabel} (₹)</label>
                                    <input type="number" placeholder={expensesFallback.amountPlaceholder} value={amount} onChange={e => setAmount(e.target.value)} onWheel={e => e.target.blur()} step="1" min="1" required style={{ padding: "12px", borderRadius: "10px", fontFamily: "Poppins", width: "100%", boxSizing: "border-box" }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontFamily: "Poppins" }}>{expensesFallback.categoryLabel}</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: "12px", borderRadius: "10px", fontFamily: "Poppins", width: "100%", boxSizing: "border-box" }}>
                                        {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.icon} {categoryTranslations[cat.name] || cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontFamily: "Poppins" }}>{expensesFallback.descLabel}</label>
                                    <input type="text" placeholder={expensesFallback.descPlaceholder} value={description} onChange={e => setDescription(e.target.value)} style={{ padding: "12px", borderRadius: "10px", fontFamily: "Poppins", width: "100%", boxSizing: "border-box" }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontFamily: "Poppins" }}>{expensesFallback.dateLabel}</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: "12px", borderRadius: "10px", fontFamily: "Poppins", width: "100%", boxSizing: "border-box" }} />
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: "12px", borderRadius: "10px" }}>
                                        {loading ? expensesFallback.savingStatus : editingExpense ? expensesFallback.updateBtnText : expensesFallback.saveBtnText}
                                    </button>
                                    {editingExpense && (
                                        <button type="button" onClick={resetForm} style={{ flex: 1, padding: 14, border: "1px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--text-secondary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>
                                            {expensesFallback.cancelFormBtn}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results info */}
                {isFiltered && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, textAlign: "center" }}>
                        {expensesFallback.showingInfo} {filteredExpenses.length} {expensesFallback.ofInfo} {expenses.length} {expensesFallback.expensesText}
                    </motion.p>
                )}

                {/* 🚀 UPGRADED DELETE MODAL: PERFECTLY CENTERED */}
                <AnimatePresence>
                    {deleteConfirm && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)}
                                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, backdropFilter: "blur(4px)" }} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.88, x: "-50%", y: "-40%" }}
                                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                                exit={{ opacity: 0, scale: 0.88, x: "-50%", y: "-40%" }}
                                style={{ position: "fixed", top: "50%", left: "50%", background: "var(--card-bg)", borderRadius: 24, padding: 28, width: "calc(100% - 40px)", maxWidth: 360, zIndex: 1001, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", fontFamily: "Poppins" }}>
                                <p style={{ fontSize: 40, textAlign: "center", marginBottom: 12, margin: 0 }}>🗑️</p>
                                <h3 style={{ fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 8, marginTop: 0 }}>{expensesFallback.deleteModalTitle}</h3>
                                <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", marginBottom: 24 }}>
                                    {expensesFallback.deleteModalBody} <strong>₹{Number(deleteConfirm.amount).toLocaleString("en-IN")}</strong> ({categoryTranslations[deleteConfirm.category] || deleteConfirm.category})?
                                </p>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 14, border: "1px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--text-secondary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>
                                        {expensesFallback.cancelFormBtn}
                                    </button>
                                    <button onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1, padding: 14, border: "none", borderRadius: 12, background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "white", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer" }}>
                                        {expensesFallback.deleteBtnText}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Expenses List */}
                <div className="expenses-list">
                    {filteredExpenses.length === 0 ? (
                        <div className="empty-state card" style={{ padding: "24px", textAlign: "center" }}>
                            <p style={{ margin: 0, fontWeight: 500, color: "var(--text-secondary)" }}>{isFiltered ? expensesFallback.noMatchText : expensesFallback.noExpensesText}</p>
                            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--text-secondary)" }}>{!isFiltered && expensesFallback.startTrackingText}</p>
                            {isFiltered && <button onClick={clearFilters} style={{ marginTop: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "Poppins", fontWeight: 600 }}>{expensesFallback.clearFiltersText}</button>}
                        </div>
                    ) : (
                        filteredExpenses.map((expense, index) => (
                            <motion.div key={expense.id} className="expense-item card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} layout>
                                <div className="expense-icon">
                                    {CATEGORIES.find(c => c.name === expense.category)?.icon || "💰"}
                                </div>
                                <div className="expense-details">
                                    <p className="expense-name">{expense.description || categoryTranslations[expense.category] || expense.category}</p>
                                    <p className="expense-category">{categoryTranslations[expense.category] || expense.category}</p>
                                    <p className="expense-date">
                                        {formatLocalizedDate(expense.date)}
                                        {expense.updatedAt && <span style={{ color: "var(--primary)", marginLeft: 6, fontSize: 10 }}>✏️ {expensesFallback.editedBadge}</span>}
                                    </p>
                                </div>
                                <div className="expense-right">
                                    <p className="expense-amount">-₹{Number(expense.amount).toLocaleString("en-IN")}</p>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <motion.button onClick={() => handleOpenEdit(expense)} whileTap={{ scale: 0.9 }} style={{ background: "rgba(124, 58, 237, 0.08)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13, transition: "all 0.2s" }} title="Edit">
                                            ✏️
                                        </motion.button>
                                        <motion.button onClick={() => setDeleteConfirm(expense)} whileTap={{ scale: 0.9 }} className="delete-btn" title="Delete">
                                            🗑️
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default Expenses;