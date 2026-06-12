import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, ReferenceLine
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "../styles/Reports.css";

const COLORS = ["#7C3AED", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#06B6D4"];

const Reports = () => {
    // GLOBAL CONTEXT STATE PROVIDERS
    const { user, darkMode, currentLanguage } = useApp();

    // STATES MANAGEMENT
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [activeTab, setActiveTab] = useState("monthly");
    const [historyFilter, setHistoryFilter] = useState("all");

    // NEW PERFORMANCE EXPORT STATES
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);

    // STATES FOR BUDGET CAPS AND DATE RANGE
    const [budget, setBudget] = useState(50000);
    const [categoryLimits, setCategoryLimits] = useState({});
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [budgetFormAmount, setBudgetFormAmount] = useState("");
    const [loadingBudget, setLoadingBudget] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // COMPREHENSIVE MULTILINGUAL LOCALIZATION STRINGS MATRIX
    const rFallback = {
        income: { English: "Income", "हिंदी": "आय", "తెలుగు": "ఆదాయం", "ಕನ್ನಡ": "ಆದಾಯ", "മലയാളം": "വരുമാനം", "मराठी": "उत्पन्न", "ગુજરાતી": "આવક", "தமிழ்": "வருமானம்" }[currentLanguage] || "Income",
        expenses: { English: "Expenses", "हिंदी": "खर्च", "తెలుగు": "ఖర్చులు", "ಕನ್ನಡ": "ವೆಚ್ಚಗಳು", "മലയാളം": "ചിലവുകൾ", "मराठी": "खर्च", "ગુજરાતી": "ખર્ચ", "தமிழ்": "செலவுகள்" }[currentLanguage] || "Expenses",
        savings: { English: "Savings", "हिंदी": "बचत", "తెలుగు": "పొదుపు", "ಕನ್ನಡ": "ಉಳಿತಾಯ", "മലയാളം": "സമ്പാദ്യം", "मराठी": "बचत", "ગુજરાતી": "બચત", "தமிழ்": "சேமிப்பு" }[currentLanguage] || "Savings",
        downloadPdfBtn: { English: "📥 Download PDF", "हिंदी": "📥 पीडीएफ", "తెలుగు": "📥 PDF", "ಕನ್ನಡ": "📥 PDF", "മലയാളം": "📥 PDF" }[currentLanguage] || "📥 PDF",
        downloadExcelBtn: { English: "📊 Download Excel", "हिंदी": "📊 एक्सील", "తెలుగు": "📊 ఎక్సెల్", "ಕನ್ನಡ": "📊 ಎಕ್ಸೆಲ್", "മലയാളം": "📊 Excel" }[currentLanguage] || "📊 Excel",
        generating: { English: "⏳ Generating...", "हिंदी": "⏳ बना रहा है...", "తెలుగు": "⏳ అవుతోంది...", "ಕನ್ನಡ": "⏳ ಸಿದ್ಧವಾಗುತ್ತಿದೆ..." }[currentLanguage] || "⏳ Generating...",
        weeklyOverview: { English: "Weekly Overview", "हिंदी": "साप्ताहिक अवलोकन", "తెలుగు": "వారపు నివేదిక", "ಕನ್ನಡ": "ಸಾಪ್ತಾಹಿಕ ಅವಲೋಕನ" }[currentLanguage] || "Weekly Overview",
        monthlyOverview: { English: "Monthly Overview", "हिंदी": "मासिक अवलोकन", "తెలుగు": "నెలవారీ అవలోకనం", "ಕನ್ನಡ": "ಮಾಸಿಕ ಅವಲೋಕನ" }[currentLanguage] || "Monthly Overview",
        yearlyOverview: { English: "Yearly Comparison", "हिंदी": "वार्षिक तुलना", "తెలుగు": "వార్షిక పోలిక", "ಕನ್ನಡ": "ವಾರ್ಷಿಕ ಹೋಲಿಕೆ" }[currentLanguage] || "Yearly Comparison",
        netWorthHistory: { English: "Net Worth History", "हिंदी": "संपत्ति इतिहास", "తెలుగు": "నికర విలువల చరిత్ర", "ಕನ್ನಡ": "ನಿವ್ವಳ ಮೌಲ್ಯದ ಇತಿಹಾಸ" }[currentLanguage] || "Net Worth History",
        spendingByCat: { English: "Spending by Category", "हिंदी": "श्रेणी के अनुसार खर्च", "తెలుగు": "కేటగిరీ ఖర్చులు", "ಕನ್ನಡ": "ವರ್ಗಾವಾರು ಖರ್ಚು" }[currentLanguage] || "Spending by Category",
        incomeVsExpenseTrend: { English: "Income vs Expense", "हिंदी": "आय बनाम व्यय", "తెలుగు": "ఆదాయం vs ఖర్చు", "ಕನ್ನಡ": "ಆದಾಯ ಮತ್ತು ವೆಚ್ಚ" }[currentLanguage] || "Income vs Expense",
        finHealthScore: { English: "Financial Health", "हिंदी": "वित्तीय स्वास्थ्य", "తెలుగు": "ఆర్థిక ఆరోగ్యం", "ಕನ್ನಡ": "ಹಣಕಾಸು ಆರೋಗ್ಯ" }[currentLanguage] || "Financial Health",
        basedOnHabits: { English: "Based on spending", "हिंदी": "खर्च करने की आदतों पर", "తెలుగు": "మీ ఖర్చుల ఆధారంగా", "ಕನ್ನಡ": "ನಿಮ್ಮ ವೆಚ್ಚದ ಆಧಾರದ ಮೇಲೆ" }[currentLanguage] || "Based on spending",
        savingsRateLabel: { English: "Savings rate", "हिंदी": "बचत दर", "తెలుగు": "పొదుపు రేటు", "ಕನ್ನಡ": "ಉಳಿತಾಯ ದರ" }[currentLanguage] || "Savings rate",
        whatsGoingWell: { English: "✅ What's Going Well", "हिंदी": "✅ क्या अच्छा चल रहा है", "తెలుగు": "✅ మెరుగ్గా ఉన్నవి", "ಕನ್ನಡ": "✅ ಉತ್ತಮವಾಗಿರುವ ಅಂಶಗಳು" }[currentLanguage] || "✅ What's Going Well",
        tipsToImprove: { English: "💡 Tips to Improve", "हिंदी": "💡 सुधारने के टिप्स", "తెలుగు": "💡 చిట్కాలు", "ಕನ್ನಡ": "💡 ಸಲಹೆಗಳು" }[currentLanguage] || "💡 Tips to Improve",
        keyMetricsTitle: { English: "📊 Key Metrics", "हिंदी": "📊 मुख्य मेट्रिक्स", "తెలుగు": "📊 కీలక కొలతలు", "ಕನ್ನಡ": "📊 ಪ್ರಮುಖ ಅಂಕಿಅಂಶಗಳು" }[currentLanguage] || "📊 Key Metrics",
        transactionHistoryTitle: { English: "Transactions", "हिंदी": "लेन-देन", "తెలుగు": "లావాదేవీలు", "ಕನ್ನಡ": "ವಹಿವಾಟು" }[currentLanguage] || "Transactions",
        noTransactionsFound: { English: "No transactions found!", "हिंदी": "कोई लेन-देन नहीं मिला!", "తెలుగు": "లావాదేవీలు ఏవీ లేవు!", "ಕನ್ನಡ": "ಯಾವುದೇ ವಹಿವಾಟು ಇಲ್ಲ!" }[currentLanguage] || "No transactions found!",
        noDataYet: { English: "No data yet!", "हिंदी": "कोई डेटा नहीं है!", "తెలుగు": "డేటా లేదు!", "ಕನ್ನಡ": "ಯಾವುದೇ ಡೇಟಾ ಇಲ್ಲ!" }[currentLanguage] || "No data yet!",
        thisYear: { English: "This Year", "हिंदी": "इस साल", "తెలుగు": "ఈ ఏడాది", "ಕನ್ನಡ": "ಈ ವರ್ಷ" }[currentLanguage] || "This Year",
        lastYear: { English: "Last Year", "हिंदी": "पिछले साल", "తెలుగు": "గత ఏడాది", "ಕನ್ನಡ": "ಕಳೆದ ವರ್ಷ" }[currentLanguage] || "Last Year",
        forecastTitle: { English: "AI Cash-Flow Forecast", "తెలుగు": "AI క్యాష్-ఫ్లో అంచనా", "हिंदी": "एआई नकद-प्रवाह पूर्वानुमान" }[currentLanguage] || "AI Cash-Flow Forecast",
        runwayDesc: { English: "Estimated Runway", "తెలుగు": "అంచనా సమయం (Runway)", "हिंदी": "अनुमानित रनवे" }[currentLanguage] || "Estimated Runway",
        daysLeft: { English: "days remaining", "తెలుగు": "రోజులు మిగిలి ఉన్నాయి", "हिंदी": "दिन शेष" }[currentLanguage] || "days remaining",
        zeroBalance: { English: "Zero Balance Date", "తెలుగు": "జీరో బ్యాలెన్స్ తేదీ", "हिंदी": "शून्य शेष तिथि" }[currentLanguage] || "Zero Balance Date",
        customRange: { English: "Custom Range", "తెలుగు": "తేదీల ఫిల్టర్", "हिंदी": "कस्टम सीमा" }[currentLanguage] || "Custom Range",
        clear: { English: "Clear", "తెలుగు": "క్లియర్", "हिंदी": "साफ़ करें" }[currentLanguage] || "Clear",
        setBudgetCaps: { English: "Set Budgets", "తెలుగు": "బడ్జెట్ & పరిమితులు", "हिंदी": "बजट सेट करें" }[currentLanguage] || "Set Budgets",
        totalMonthly: { English: "Total Budget", "తెలుగు": "నెలవారీ బడ్జెట్", "हिंदी": "कुल बजट" }[currentLanguage] || "Total Budget",
        categoryCaps: { English: "Category Limits", "తెలుగు": "కేటగిరీ పరిమితులు", "हिंदी": "श्रेणी सीमाएं" }[currentLanguage] || "Category Limits",
        used: { English: "used", "తెలుగు": "వాడారు", "हिंदी": "उपयोग किया" }[currentLanguage] || "used",
        limit: { English: "limit", "తెలుగు": "పరిమితి", "हिंदी": "सीमा" }[currentLanguage] || "limit",
        cancelBtn: { English: "Cancel", "తెలుగు": "రద్దు", "हिंदी": "रद्द करें" }[currentLanguage] || "Cancel",
        saveBtn: { English: "Save Caps", "తెలుగు": "సేవ్ చేయండి", "हिंदी": "सहेजें" }[currentLanguage] || "Save Caps",

        // DOCUMENT EXPORT LABELS
        financialReport: { English: "Financial Report", "हिंदी": "वित्तीय रिपोर्ट", "తెలుగు": "ఆర్థిక నివేదిక", "ಕನ್ನಡ": "ಹಣಕಾಸು ವರದಿ" }[currentLanguage] || "Financial Report",
        generated: { English: "Generated", "हिंदी": "बनाया गया", "తెలుగు": "జనరేట్ చేయబడినది", "ಕನ್ನಡ": "ರಚಿಸಲಾಗಿದೆ" }[currentLanguage] || "Generated",
        userLabel: { English: "User", "हिंदी": "उपयोगकर्ता", "తెలుగు": "వినియోగదారుడు", "ಕನ್ನಡ": "ಬಳಕೆದಾರ" }[currentLanguage] || "User",
        financialSummary: { English: "Financial Summary", "हिंदी": "वित्तीय सारांश", "తెలుగు": "ఆర్థిక సారాంశం", "ಕನ್ನಡ": "ಹಣಕಾಸು ಸಾರಾಂಶ" }[currentLanguage] || "Financial Summary",
        healthScore: { English: "Health Score", "हिंदी": "स्वास्थ्य स्कोर", "తెలుగు": "ఆరోగ్య స్కోరు", "ಕನ್ನಡ": "ಆರೋಗ್ಯ ಸ್ಕೋರ್" }[currentLanguage] || "Health Score",
        expenseTransactions: { English: "Expense Transactions", "हिंदी": "व्यय लेन-देन", "తెలుగు": "ఖర్చు లావాదేవీలు", "ಕನ್ನಡ": "ವೆಚ್ಚದ ವಹಿವಾಟುಗಳು" }[currentLanguage] || "Expense Transactions",
        incomeTransactions: { English: "Income Transactions", "हिंदी": "आय लेन-देन", "తెలుగు": "ఆదాయ లావాదేవీలు", "ಕನ್ನಡ": "ಆದಾಯ ವಹಿವಾಟುಗಳು" }[currentLanguage] || "Income Transactions",
        page: { English: "Page", "हिंदी": "पृष्ठ", "తెలుగు": "పేజీ", "ಕನ್ನಡ": "ಪುಟ" }[currentLanguage] || "Page",
        of: { English: "of", "हिंदी": "का", "తెలుగు": "లో", "ಕನ್ನಡ": "ರಲ್ಲಿ" }[currentLanguage] || "of",
    };

    const metricsLabels = {
        savingsRate: { English: "Savings Rate", "हिंदी": "बचत दर", "తెలుగు": "పొదుపు రేటు", "ಕನ್ನಡ": "ಉಳಿತಾಯ ದರ" }[currentLanguage] || "Savings Rate",
        budgetUsed: { English: "Budget Used", "हिंदी": "बजट का उपयोग किया", "తెలుగు": "బడ్జెట్ వినియోగం", "ಕನ್ನಡ": "ಬಳಸಿದ ಬಜೆಟ್" }[currentLanguage] || "Budget Used",
        totalTrans: { English: "Total Transactions", "हिंदी": "कुल लेन-देन", "తెలుగు": "మొత్తం లావాదేవీలు", "ಕನ್ನಡ": "ಒಟ್ಟು ವಹಿವಾಟುಗಳು" }[currentLanguage] || "Total Transactions",
        expCatCount: { English: "Expense Categories", "हिंदी": "व्यय श्रेणियाँ", "తెలుగు": "ఖర్చు కేటగిరీలు", "ಕನ್ನಡ": "ವೆಚ್ಚದ ವರ್ಗಗಳು" }[currentLanguage] || "Expense Categories",
        avgDailyExp: { English: "Avg. Daily Expense", "हिंदी": "औसत दैनिक खर्च", "తెలుగు": "సగటు దినసరి ఖర్చు", "ಕನ್ನಡ": "ಸರಾಸರಿ ದೈನಂದಿನ ವೆಚ್ಚ" }[currentLanguage] || "Avg. Daily Expense",
        totalIncSrc: { English: "Total Income Sources", "हिंदी": "कुल आय स्रोत", "తెలుగు": "మొత్తం ఆదాయ వనరులు", "ಕನ್ನಡ": "ಒಟ್ಟು ಆದಾಯದ ಮೂಲಗಳು" }[currentLanguage] || "Total Income Sources"
    };

    const tabsLabels = {
        weekly: { English: "Weekly", "हिंदी": "साप्ताहिक", "తెలుగు": "వారపు", "ಕನ್ನಡ": "ಸಾಪ್ತಾಹಿಕ" }[currentLanguage] || "Weekly",
        monthly: { English: "Monthly", "हिंदी": "मासिक", "తెలుగు": "నెలవారీ", "ಕನ್ನಡ": "ಮಾಸಿಕ" }[currentLanguage] || "Monthly",
        yearly: { English: "Yearly", "हिंदी": "वार्षिक", "తెలుగు": "వార్షిక", "ಕನ್ನಡ": "ವಾರ್ಷಿಕ" }[currentLanguage] || "Yearly",
        category: { English: "Category", "हिंदी": "श्रेणी", "తెలుగు": "కేటగిరీ", "ಕನ್ನಡ": "ವರ್ಗ" }[currentLanguage] || "Category",
        trend: { English: "Trend", "हिंदी": "रुझान", "తెలుగు": "ట్రెండ్", "ಕನ್ನಡ": "ಟ್ರೆಂಡ್" }[currentLanguage] || "Trend",
        networth: { English: "Net Worth", "हिंदी": "संपत्ति", "తెలుగు": "ఆస్తులు", "ಕನ್ನಡ": "ಮೌಲ್ಯ" }[currentLanguage] || "Net Worth",
        forecast: { English: "Forecast", "हिंदी": "पूर्वानुमान", "తెలుగు": "అంచనా", "ಕನ್ನಡ": "ಮುನ್ಸೂಚನೆ" }[currentLanguage] || "Forecast",
        insights: { English: "Insights", "हिंदी": "विश्लेषण", "తెలుగు": "విశ్లేషణ", "ಕನ್ನಡ": "ಒಳನೋಟಗಳು" }[currentLanguage] || "Insights"
    };

    const filterHistoryLabels = {
        all: { English: "All", "हिंदी": "सब", "తెలుగు": "అన్నీ", "ಕನ್ನಡ": "ಎಲ್ಲಾ" }[currentLanguage] || "All",
        expense: { English: "Expense", "हिंदी": "खर्च", "తెలుగు": "ఖర్చు", "ಕನ್ನಡ": "ಖರ್ಚು" }[currentLanguage] || "Expense",
        income: { English: "Income", "हिंदी": "आय", "తెలుగు": "ఆదాయం", "ಕನ್ನಡ": "ಆದಾಯ" }[currentLanguage] || "Income"
    };

    const monthsTranslations = {
        English: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "తెలుగు": ["జన", "ఫెబ్ర", "మార్చి", "ఏప్రి", "మే", "జూన్", "జూలై", "ఆగ", "సెప్ట", "అక్టో", "నవం", "డిసెం"],
        "हिंदी": ["जन", "फर", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"]
    };

    const weekDaysTranslations = {
        English: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "తెలుగు": ["సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని", "ఆది"],
        "हिंदी": ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"]
    };

    const categoryTranslations = {
        Groceries: { English: "Groceries", "తెలుగు": "సరుకులు", "हिंदी": "किराना" }[currentLanguage] || "Groceries",
        Rent: { English: "Rent", "తెలుగు": "ఇంటి అద్దె", "हिंदी": "किराया" }[currentLanguage] || "Rent",
        Transport: { English: "Transport", "తెలుగు": "రవాణా", "हिंदी": "यातायात" }[currentLanguage] || "Transport",
        Food: { English: "Food", "తెలుగు": "ఆహారం", "हिंदी": "भोजन" }[currentLanguage] || "Food",
        Health: { English: "Health", "తెలుగు": "ఆరోగ్యం", "हिंदी": "स्वास्थ्य" }[currentLanguage] || "Health",
        Entertainment: { English: "Entertainment", "తెలుగు": "వినోదం", "हिंदी": "मनोरंजन" }[currentLanguage] || "Entertainment",
        Education: { English: "Education", "తెలుగు": "విద్య", "हिंदी": "शिक्षा" }[currentLanguage] || "Education",
        Shopping: { English: "Shopping", "తెలుగు": "షాపింగ్", "हिंदी": "खरीदारी" }[currentLanguage] || "Shopping",
        Utilities: { English: "Utilities", "తెలుగు": "బిల్లులు", "हिंदी": "उपयोगिताएं" }[currentLanguage] || "Utilities",
        Other: { English: "Other", "తెలుగు": "ఇతరాలు", "हिंदी": "अन्य" }[currentLanguage] || "Other"
    };

    const getCategoryIcon = (catName) => {
        const icons = { Groceries: "🛒", Rent: "🏠", Transport: "🚗", Food: "🍕", Health: "💊", Entertainment: "🎬", Education: "📚", Shopping: "🛍️", Utilities: "💡", Other: "💰" };
        return icons[catName] || "💰";
    };

    // FIREBASE LIFECYCLE LISTENERS
    useEffect(() => {
        if (!user) return;
        const expQuery = query(collection(db, "expenses"), where("userId", "==", user.uid));
        const incQuery = query(collection(db, "income"), where("userId", "==", user.uid));

        const unsub1 = onSnapshot(expQuery, snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setExpenses(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        });
        const unsub2 = onSnapshot(incQuery, snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setIncomes(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        });

        const fetchBudget = async () => {
            const snap = await getDoc(doc(db, "budgets", user.uid));
            if (snap.exists()) {
                const data = snap.data();
                if (data.totalBudget) setBudget(data.totalBudget);
                if (data.categories) setCategoryLimits(data.categories);
            }
        };
        fetchBudget();

        return () => { unsub1(); unsub2(); };
    }, [user]);

    // FILTER TRANSACTIONS BY DATE RANGE
    const filteredExpenses = expenses.filter(e => {
        if (startDate && new Date(e.date) < new Date(startDate)) return false;
        if (endDate && new Date(e.date) > new Date(endDate)) return false;
        return true;
    });

    const filteredIncomes = incomes.filter(i => {
        if (startDate && new Date(i.date) < new Date(startDate)) return false;
        if (endDate && new Date(i.date) > new Date(endDate)) return false;
        return true;
    });

    // CORE COMPUTATIONS (Using filtered data)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncome = filteredIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const budgetUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0;

    // --- FEATURE 1: WEEKLY DATA (Mon - Sun) ---
    const ACTIVE_WEEK_DAYS = weekDaysTranslations[currentLanguage] || weekDaysTranslations.English;
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    const weeklyData = ACTIVE_WEEK_DAYS.map((day, index) => {
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + index);
        const targetDateStr = targetDate.toDateString();

        const dInc = filteredIncomes.filter(i => new Date(i.date).toDateString() === targetDateStr).reduce((a, b) => a + Number(b.amount), 0);
        const dExp = filteredExpenses.filter(e => new Date(e.date).toDateString() === targetDateStr).reduce((a, b) => a + Number(b.amount), 0);

        return { day, income: dInc, expenses: dExp };
    });

    // --- MONTHLY DATA ---
    const CURRENT_MONTHS_PACK = monthsTranslations[currentLanguage] || monthsTranslations.English;
    const monthlyData = CURRENT_MONTHS_PACK.map((month, index) => {
        const monthExpenses = filteredExpenses.filter(e => new Date(e.date).getMonth() === index && new Date(e.date).getFullYear() === new Date().getFullYear());
        const monthIncome = filteredIncomes.filter(i => new Date(i.date).getMonth() === index && new Date(i.date).getFullYear() === new Date().getFullYear());
        return {
            month,
            expenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
            income: monthIncome.reduce((sum, i) => sum + Number(i.amount), 0),
        };
    });

    // --- FEATURE 2: YEARLY COMPARISON DATA ---
    const currentYear = new Date().getFullYear();
    const yearlyData = CURRENT_MONTHS_PACK.map((month, index) => {
        const thisYearExp = expenses.filter(e => new Date(e.date).getFullYear() === currentYear && new Date(e.date).getMonth() === index).reduce((a, b) => a + Number(b.amount), 0);
        const lastYearExp = expenses.filter(e => new Date(e.date).getFullYear() === currentYear - 1 && new Date(e.date).getMonth() === index).reduce((a, b) => a + Number(b.amount), 0);
        return { month, thisYear: thisYearExp, lastYear: lastYearExp };
    });

    // --- CATEGORY DATA (With Original Name for Caps mapping) ---
    const categoryData = filteredExpenses.reduce((acc, expense) => {
        const translatedName = categoryTranslations[expense.category] || expense.category;
        const existing = acc.find(item => item.originalName === expense.category);
        if (existing) {
            existing.value += Number(expense.amount);
        } else {
            acc.push({ name: translatedName, originalName: expense.category, value: Number(expense.amount) });
        }
        return acc;
    }, []);

    const allTransactions = [
        ...filteredExpenses.map(e => ({ ...e, type: "expense" })),
        ...filteredIncomes.map(i => ({ ...i, type: "income" }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // --- FEATURE 3: NET WORTH HISTORY (Cumulative) ---
    const allTransactionsAsc = [...allTransactions].reverse();
    let currentNetWorth = 0;
    const netWorthData = allTransactionsAsc.map(t => {
        currentNetWorth += t.type === "income" ? Number(t.amount) : -Number(t.amount);
        return {
            date: new Date(t.date).toLocaleDateString(currentLanguage === "English" ? "en-IN" : "te-IN", { month: "short", day: "numeric" }),
            netWorth: currentNetWorth
        };
    });

    // --- FEATURE 4: PREDICTIVE FORECASTING (Runway) ---
    const calculateForecast = () => {
        if (filteredExpenses.length === 0 || currentNetWorth <= 0) return null;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
        const totalRecentSpend = recentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const avgDailySpend = (totalRecentSpend / 30) || 1;

        const daysRemaining = Math.floor(currentNetWorth / avgDailySpend);
        const zeroDate = new Date();
        zeroDate.setDate(today.getDate() + daysRemaining);

        const forecastData = [];
        let projectedWealth = currentNetWorth;
        for (let i = 0; i <= 30; i += 5) {
            const pointDate = new Date(today);
            pointDate.setDate(today.getDate() + i);
            forecastData.push({
                date: pointDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
                projected: Math.max(0, projectedWealth),
            });
            projectedWealth -= (avgDailySpend * 5);
        }

        return {
            daysRemaining,
            zeroDate: zeroDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            avgDailySpend: Math.round(avgDailySpend),
            forecastData
        };
    };
    const forecastInfo = calculateForecast();

    const filteredHistory = allTransactions.filter(t => {
        if (historyFilter === "all") return true;
        return t.type === historyFilter;
    });

    const formatLocalizedStamp = (dateString) => {
        const dateObj = new Date(dateString);
        const localeCodes = { English: "en-IN", "हिंदी": "hi-IN", "తెలుగు": "te-IN", "ಕನ್ನಡ": "kn-IN" };
        const activeLocale = localeCodes[currentLanguage] || "en-IN";
        return `${dateObj.toLocaleDateString(activeLocale, { day: "numeric", month: "short", year: "numeric" })} • ${dateObj.toLocaleTimeString(activeLocale, { hour: "2-digit", minute: "2-digit" })}`;
    };

    // SAVE CATEGORY CAPS HANDLER
    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        setLoadingBudget(true);
        try {
            await setDoc(doc(db, "budgets", user.uid), {
                totalBudget: Number(budgetFormAmount) || budget,
                categories: categoryLimits
            }, { merge: true });
            if (budgetFormAmount) setBudget(Number(budgetFormAmount));
            setShowBudgetForm(false);
        } catch (err) { console.error(err); }
        setLoadingBudget(false);
    };

    const calculateHealthScore = () => {
        let score = 0;
        const reasons = [], tips = [];
        const msg = {
            excSave: { English: "Excellent savings rate! 🌟", "हिंदी": "उत्कृष्ट बचत दर! 🌟", "తెలుగు": "అద్భుతమైన పొదుపు రేటు! 🌟", "ಕನ್ನಡ": "ಅತ್ಯುತ್ತಮ ಉಳಿತಾಯ ದರ! 🌟", "தமிழ்": "சிறந்த சேமிப்பு! 🌟", "मराठी": "उत्कृष्ट बचत! 🌟" }[currentLanguage] || "Excellent savings rate! 🌟",
            goodSave: { English: "Good savings rate 👍", "हिंदी": "अच्छी बचत दर 👍", "తెలుగు": "మంచి పొదుపు రేటు 👍", "ಕನ್ನಡ": "ಉತ್ತಮ ಉಳಿತಾಯ ದರ 👍", "தமிழ்": "நல்ல சேமிப்பு 👍", "मराठी": "चांगली बचत 👍" }[currentLanguage] || "Good savings rate 👍",
            avgSave: { English: "Average savings rate", "हिंदी": "औसत बचत दर", "తెలుగు": "సాధారణ పొదుపు రేటు", "ಕನ್ನಡ": "ಸರಾಸರಿ ಉಳಿತಾಯ ದರ", "தமிழ்": "சராசரி சேமிப்பு", "मराठी": "सरासरी बचत" }[currentLanguage] || "Average savings rate",
            save30: { English: "Try to save 30% of income", "हिंदी": "आय का 30% बचाने का प्रयास करें", "తెలుగు": "ఆదాయంలో 30% పొదుపు చేయండి", "ಕನ್ನಡ": "30% ಉಳಿಸಲು ಪ್ರಯತ್ನಿಸಿ", "தமிழ்": "30% சேமிக்க முயலுங்கள்" }[currentLanguage] || "Try to save 30% of income",
            save20: { English: "Increase savings to 20%+", "हिंदी": "बचत को 20%+ तक बढ़ाएं", "తెలుగు": "పొదుపును 20%+ కి పెంచండి", "ಕನ್ನಡ": "ಉಳಿತಾಯವನ್ನು 20%+ ಗೆ ಹೆಚ್ಚಿಸಿ" }[currentLanguage] || "Increase savings to 20%+",
            save10: { English: "Focus on saving at least 10% of income", "हिंदी": "कम से कम 10% बचाने पर ध्यान दें", "తెలుగు": "కనీసం 10% పొదుపు చేయడంపై దృష్టి పెట్టండి", "ಕನ್ನಡ": "ಕನಿಷ್ಠ 10% ಉಳಿಸಲು ಗಮನ ಕೊಡಿ" }[currentLanguage] || "Focus on saving at least 10% of income",
            spendMore: { English: "You're spending more than you earn!", "हिंदी": "आप कमाई से ज्यादा खर्च कर रहे हैं!", "తెలుగు": "మీరు ఆదాయం కంటే ఎక్కువ ఖర్చు చేస్తున్నారు!", "ಕನ್ನಡ": "ನೀವು ಗಳಿಸುವುದಕ್ಕಿಂತ ಹೆಚ್ಚು ಖರ್ಚು ಮಾಡುತ್ತಿದ್ದೀರಿ!" }[currentLanguage] || "You're spending more than you earn!",
            withinBud: { English: "Well within budget! 💚", "हिंदी": "बजट के भीतर! 💚", "తెలుగు": "బడ్జెట్ పరిమితిలోనే ఉంది! 💚", "ಕನ್ನಡ": "ಬಜೆಟ್ ಮಿತಿಯಲ್ಲಿದೆ! 💚" }[currentLanguage] || "Well within budget! 💚",
            trackBud: { English: "Budget on track", "हिंदी": "बजट नियंत्रण में है", "తెలుగు": "బడ్జెట్ నియంత్రణలో ఉంది", "ಕನ್ನಡ": "ಬಜೆಟ್ ನಿಯಂತ್ರಣದಲ್ಲಿದೆ" }[currentLanguage] || "Budget on track",
            keep85: { English: "Keep spending below 85% of budget", "हिंदी": "खर्च को 85% से नीचे रखें", "తెలుగు": "ఖర్చులను 85% కంటే తక్కువగా ఉంచండి", "ಕನ್ನಡ": "ವೆಚ್ಚವನ್ನು 85% ಕ್ಕಿಂತ ಕಡಿಮೆ ಇರಿಸಿ" }[currentLanguage] || "Keep spending below 85% of budget",
            closeLimit: { English: "You're close to budget limit", "हिंदी": "आप बजट सीमा के करीब हैं", "తెలుగు": "మీరు బడ్జెట్ పరిమితికి దగ్గరగా ఉన్నారు", "ಕನ್ನಡ": "ನೀವು ಬಜೆಟ್ ಮಿತಿಯ ಸಮೀಪದಲ್ಲಿದ್ದೀರಿ" }[currentLanguage] || "You're close to budget limit",
            exceededBud: { English: "You've exceeded your budget!", "हिंदी": "आपने बजट पार कर लिया है!", "తెలుగు": "మీరు బడ్జెట్ పరిమితిని మించిపోయారు!", "ಕನ್ನಡ": "ನೀವು ಬಜೆಟ್ ಮೀರಿ ಖರ್ಚು ಮಾಡಿದ್ದೀರಿ!" }[currentLanguage] || "You've exceeded your budget!",
            regTrack: { English: "Regular income tracking 📈", "हिंदी": "नियमित आय ट्रैकिंग 📈", "తెలుగు": "క్రమబద్ధమైన ఆదాయ విశ్లేషణ 📈", "ಕನ್ನಡ": "ನಿಯಮಿತ ಆದಾಯ ಟ್ರ್ಯಾಕಿಂಗ್ 📈" }[currentLanguage] || "Regular income tracking 📈",
            trackAllSrc: { English: "Track all income sources", "हिंदी": "सभी आय स्रोतों को ट्रैक करें", "తెలుగు": "అన్ని ఆదాయ మార్గాలను ట్రాక్ చేయండి", "ಕನ್ನಡ": "ಎಲ್ಲಾ ಆದಾಯದ ಮೂಲಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ" }[currentLanguage] || "Track all income sources",
            startTrackInc: { English: "Start tracking your income", "हिंदी": "आय ट्रैक करना शुरू करें", "తెలుగు": "మీ ఆదాయాన్ని ట్రాక్ చేయడం ప్రారంభించండి", "ಕನ್ನಡ": "ಆದಾಯವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿ" }[currentLanguage] || "Start tracking your income",
            constExp: { English: "Consistent expense tracking 📊", "हिंदी": "लगातार व्यय ट्रैकिंग 📊", "తెలుగు": "ఖర్చుల స్థిరమైన విశ్లేషణ 📊", "ಕನ್ನಡ": "ಸ್ಥಿರ ವೆಚ್ಚದ ಟ್ರ್ಯಾಕಿಂಗ್ 📊" }[currentLanguage] || "Consistent expense tracking 📊",
            trackMoreInsight: { English: "Track more expenses for insights", "हिंदी": "बेहतर जानकारी के लिए अधिक खर्च ट्रैक करें", "తెలుగు": "మరింత స్పష్టత కోసం ఖర్చులను ట్రాక్ చేయండి", "ಕನ್ನಡ": "ಉತ್ತಮ ಒಳನೋಟಗಳಿಗಾಗಿ ಹೆಚ್ಚಿನ ವೆಚ್ಚಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ" }[currentLanguage] || "Track more expenses for insights",
            keepDailyTrack: { English: "Keep tracking your daily expenses", "हिंदी": "दैनिक खर्चों को ट्रैक करते रहें", "తెలుగు": "రోజువారీ ఖర్చులను ట్రాక్ చేస్తూ ఉండండి", "ಕನ್ನಡ": "ದೈನಂದಿನ ವೆಚ್ಚಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದನ್ನು ಮುಂದುವರಿಸಿ" }[currentLanguage] || "Keep tracking your daily expenses",
            startTrackExp: { English: "Start tracking your expenses", "हिंदी": "खर्च ट्रैक करना शुरू करें", "తెలుగు": "ఖర్చులను ట్రాక్ చేయడం ప్రారంభించండి", "ಕನ್ನಡ": "ವೆಚ್ಚಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿ" }[currentLanguage] || "Start tracking your expenses",
            divSpending: { English: "Diverse spending categories", "हिंदी": "विविध खर्च श्रेणियां", "తెలుగు": "విభిన్న ఖర్చుల విభాగాలు", "ಕನ್ನಡ": "ವಿವಿಧ ವೆಚ್ಚದ ವರ್ಗಗಳು" }[currentLanguage] || "Diverse spending categories"
        };

        if (savingsRate >= 30) { score += 30; reasons.push(msg.excSave); }
        else if (savingsRate >= 20) { score += 22; reasons.push(msg.goodSave); tips.push(msg.save30); }
        else if (savingsRate >= 10) { score += 15; reasons.push(msg.avgSave); tips.push(msg.save20); }
        else if (savingsRate > 0) { score += 8; tips.push(msg.save10); }
        else { tips.push(msg.spendMore); }

        if (budgetUsed <= 60) { score += 30; reasons.push(msg.withinBud); }
        else if (budgetUsed <= 80) { score += 20; reasons.push(msg.trackBud); tips.push(msg.keep85); }
        else if (budgetUsed <= 100) { score += 10; tips.push(msg.closeLimit); }
        else { tips.push(msg.exceededBud); }

        const uniqueIncomeSources = new Set(incomes.map(i => i.type)).size;
        if (uniqueIncomeSources >= 2) { score += 15; reasons.push(msg.regTrack); }
        else if (uniqueIncomeSources === 1) { score += 8; tips.push(msg.trackAllSrc); }
        else { tips.push(msg.startTrackInc); }

        if (expenses.length >= 10) { score += 15; reasons.push(msg.constExp); }
        else if (expenses.length >= 5) { score += 8; tips.push(msg.trackMoreInsight); }
        else if (expenses.length >= 1) { score += 4; tips.push(msg.keepDailyTrack); }
        else { tips.push(msg.startTrackExp); }

        const categories = new Set(expenses.map(e => e.category));
        if (categories.size >= 5) { score += 10; reasons.push(msg.divSpending); }
        else if (categories.size >= 3) { score += 5; }
        else { score += 2; }

        score = Math.min(score, 100);

        let grade, color, emoji;
        const gradeMap = {
            exc: { English: "Excellent", "हिंदी": "उत्कृष्ट", "తెలుగు": "అద్భుతం", "ಕನ್ನಡ": "ಅತ್ಯುತ್ತಮ", "தமிழ்": "சிறந்தது", "मराठी": "उत्कृष्ट" }[currentLanguage] || "Excellent",
            good: { English: "Good", "हिंदी": "अच्छा", "తెలుగు": "బాగుంది", "ಕನ್ನಡ": "ಉತ್ತಮ", "தமிழ்": "நல்லது", "मराठी": "चांगले" }[currentLanguage] || "Good",
            avg: { English: "Average", "हिंदी": "औसत", "తెలుగు": "సగటు", "ಕನ್ನಡ": "ಸರಾಸರಿ", "தமிழ்": "சராசரி", "मराठी": "सरासरी" }[currentLanguage] || "Average",
            work: { English: "Needs Work", "हिंदी": "सुधार आवश्यक", "తెలుగు": "మెరుగుపడాలి", "ಕನ್ನಡ": "ಸುಧಾರಣೆ ಅಗತ್ಯವಿದೆ", "தமிழ்": "மாற்றம் தேவை", "मराठी": "सुधारणा आवश्यक" }[currentLanguage] || "Needs Work",
            poor: { English: "Poor", "हिंदी": "खराब", "తెలుగు": "సంతృప్తికరంగా లేదు", "ಕನ್ನಡ": "ಕಳಪೆ", "தமிழ்": "மோசமான", "मराठी": "खराब" }[currentLanguage] || "Poor"
        };

        if (score >= 85) { grade = gradeMap.exc; color = "#10B981"; emoji = "🌟"; }
        else if (score >= 70) { grade = gradeMap.good; color = "#3B82F6"; emoji = "👍"; }
        else if (score >= 50) { grade = gradeMap.avg; color = "#F59E0B"; emoji = "📈"; }
        else if (score >= 30) { grade = gradeMap.work; color = "#F97316"; emoji = "⚠️"; }
        else { grade = gradeMap.poor; color = "#EF4444"; emoji = "🚨"; }

        return { score, grade, color, emoji, reasons, tips };
    };
    const healthData = calculateHealthScore();

    // 🚀 UPGRADED PDF GENERATOR WITH BEAUTIFUL DESIGN (NON-BLOCKING)
    const downloadPDF = () => {
        setDownloadingPDF(true);
        setTimeout(() => {
            try {
                const pdf = new jsPDF();
                const docLabels = {
                    title: "Spendly",
                    sub: rFallback.financialReport || "Financial Report",
                    gen: rFallback.generated || "Generated",
                    usr: rFallback.userLabel || "User",
                    sum: rFallback.financialSummary || "Financial Summary",
                    inc: rFallback.income, exp: rFallback.expenses, sav: rFallback.savings,
                    score: rFallback.finHealthScore || "Health Score",
                    tblExp: rFallback.expenses || "Expenses",
                    tblInc: rFallback.income || "Income",
                    pg: rFallback.page || "Page",
                    of: rFallback.of || "of"
                };

                // Purple Header
                pdf.setFillColor(124, 58, 237);
                pdf.rect(0, 0, 210, 40, "F");
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(22);
                pdf.setFont("helvetica", "bold");
                pdf.text(docLabels.title, 14, 18);
                pdf.setFontSize(11);
                pdf.setFont("helvetica", "normal");
                pdf.text(docLabels.sub, 14, 26);

                pdf.setFontSize(10);
                pdf.text(`${docLabels.gen}: ${new Date().toLocaleDateString("en-IN")}`, 196, 18, { align: "right" });
                pdf.text(`${docLabels.usr}: ${user?.displayName || "User"}`, 196, 26, { align: "right" });

                // Gray Summary Box
                pdf.setDrawColor(229, 231, 235);
                pdf.setFillColor(249, 250, 251);
                pdf.roundedRect(14, 48, 182, 36, 4, 4, "FD");

                pdf.setTextColor(31, 41, 55);
                pdf.setFontSize(13);
                pdf.setFont("helvetica", "bold");
                pdf.text(docLabels.sum, 20, 58);

                pdf.setFontSize(10);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(107, 114, 128);
                pdf.text(`${docLabels.inc}:`, 20, 68);
                pdf.text(`${docLabels.exp}:`, 20, 76);
                pdf.text(`${docLabels.sav}:`, 110, 68);
                pdf.text(`${docLabels.score}:`, 110, 76);

                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(16, 185, 129);
                pdf.text(`Rs. ${totalIncome.toLocaleString("en-IN")}`, 50, 68);
                pdf.setTextColor(239, 68, 68);
                pdf.text(`Rs. ${totalExpenses.toLocaleString("en-IN")}`, 50, 76);
                pdf.setTextColor(savings >= 0 ? 16 : 239, savings >= 0 ? 185 : 68, savings >= 0 ? 129 : 68);
                pdf.text(`Rs. ${savings.toLocaleString("en-IN")}`, 150, 68);
                pdf.setTextColor(124, 58, 237);
                pdf.text(`${healthData.score}/100 (${healthData.grade})`, 150, 76);

                let currentY = 95;

                if (filteredExpenses.length > 0) {
                    pdf.setTextColor(31, 41, 55);
                    pdf.setFontSize(13);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(docLabels.tblExp, 14, currentY);
                    autoTable(pdf, {
                        startY: currentY + 4,
                        head: [["#", "Date", "Category", "Description", "Amount (Rs.)"]],
                        body: filteredExpenses.map((e, i) => [i + 1, new Date(e.date).toLocaleDateString("en-IN"), categoryTranslations[e.category] || e.category, e.description || "-", `Rs. ${Number(e.amount).toLocaleString("en-IN")}`]),
                        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: "bold" },
                        alternateRowStyles: { fillColor: [249, 250, 251] },
                        styles: { fontSize: 9, cellPadding: 4, font: "helvetica" },
                        columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
                    });
                    currentY = pdf.lastAutoTable.finalY + 15;
                }

                if (filteredIncomes.length > 0) {
                    if (currentY > 250) { pdf.addPage(); currentY = 20; }
                    pdf.setTextColor(31, 41, 55);
                    pdf.setFontSize(13);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(docLabels.tblInc, 14, currentY);
                    autoTable(pdf, {
                        startY: currentY + 4,
                        head: [["#", "Date", "Type", "Description", "Amount (Rs.)"]],
                        body: filteredIncomes.map((i, idx) => [idx + 1, new Date(i.date).toLocaleDateString("en-IN"), i.type || "Income", i.description || "-", `Rs. ${Number(i.amount).toLocaleString("en-IN")}`]),
                        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
                        alternateRowStyles: { fillColor: [240, 253, 244] },
                        styles: { fontSize: 9, cellPadding: 4, font: "helvetica" },
                        columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
                    });
                }

                const pageCount = pdf.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(8);
                    pdf.setTextColor(156, 163, 175);
                    pdf.text(`${docLabels.pg} ${i} ${docLabels.of} ${pageCount} | Spendly`, 105, 290, { align: "center" });
                }

                pdf.save(`Spendly_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pdf`);
            } catch (err) { console.error("PDF Export Error:", err); }
            finally { setDownloadingPDF(false); }
        }, 150); // Ensures the UI updates to show the loading state first
    };

    // 🚀 UPGRADED EXCEL GENERATOR (NON-BLOCKING)
    const downloadExcel = () => {
        setExportingExcel(true);
        setTimeout(() => {
            try {
                const expenseData = filteredExpenses.map((e, i) => ({
                    "Trx ID": `EXP-${i + 1000}`,
                    "Date": new Date(e.date).toLocaleDateString("en-IN"),
                    "Category": categoryTranslations[e.category] || e.category,
                    "Description": e.description || "-",
                    "Amount (INR)": Number(e.amount),
                }));

                const incomeData = filteredIncomes.map((inc, idx) => ({
                    "Trx ID": `INC-${idx + 1000}`,
                    "Date": new Date(inc.date).toLocaleDateString("en-IN"),
                    "Source": inc.type || "Income",
                    "Description": inc.description || "-",
                    "Amount (INR)": Number(inc.amount),
                }));

                const summaryData = [
                    { "Metric": "Report Generated", "Value": new Date().toLocaleString("en-IN") },
                    { "Metric": "User Name", "Value": user?.displayName || "User" },
                    { "Metric": "Total Income (INR)", "Value": totalIncome },
                    { "Metric": "Total Expenses (INR)", "Value": totalExpenses },
                    { "Metric": "Net Savings (INR)", "Value": savings },
                    { "Metric": "Savings Rate", "Value": `${savingsRate.toFixed(1)}%` },
                    { "Metric": "Health Score", "Value": `${healthData.score}/100 (${healthData.grade})` },
                ];

                const wb = XLSX.utils.book_new();

                const wsSummary = XLSX.utils.json_to_sheet(summaryData);
                wsSummary["!cols"] = [{ wch: 25 }, { wch: 25 }];

                const wsExp = XLSX.utils.json_to_sheet(expenseData);
                wsExp["!cols"] = [{ wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }];

                const wsInc = XLSX.utils.json_to_sheet(incomeData);
                wsInc["!cols"] = [{ wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }];

                XLSX.utils.book_append_sheet(wb, wsSummary, "Financial Summary");
                XLSX.utils.book_append_sheet(wb, wsExp, "Expenses List");
                XLSX.utils.book_append_sheet(wb, wsInc, "Income List");

                XLSX.writeFile(wb, `Spendly_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
            } catch (err) { console.error("Excel Export Error:", err); }
            finally { setExportingExcel(false); }
        }, 150);
    };

    return (
        <div className={`reports-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title="Reports" />
            <div className="page-container">

                <style>{`
                    .summary-card p, .card-title, .report-tabs button, input { font-family: 'Poppins', sans-serif !important; line-height: 1.7 !important; padding-bottom: 2px; }
                    .transaction-name { line-height: 1.6 !important; font-family: 'Poppins', sans-serif !important; }
                    .health-reason, .health-tip { line-height: 1.6 !important; margin-bottom: 6px; font-weight: 500; }
                    
                    /* Custom Date Range Picker Layout */
                    .top-actions-grid { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
                    .date-filter-row { display: flex; gap: 12px; background: var(--card-bg); padding: 16px; border-radius: 20px; border: 1px solid var(--border); align-items: center; flex-wrap: wrap; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
                    .date-input-wrapper { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 140px; background: var(--background); padding: 6px 12px; border-radius: 12px; border: 1px solid var(--border); }
                    .date-input-wrapper input { background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 13.5px; width: 100%; padding: 4px 0; }
                    .action-buttons-row { display: flex; gap: 10px; width: 100%; flex-wrap: wrap; }
                    .action-btn-styled { flex: 1; min-width: 130px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 16px; font-weight: 600; font-size: 13.5px; cursor: pointer; border: none; transition: all 0.2s; }
                    
                    /* Magic Slider Tabs */
                    .premium-tabs-container { width: 100%; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; padding-bottom: 12px; margin-bottom: 16px; }
                    .premium-tabs-container::-webkit-scrollbar { display: none; }
                    .premium-tabs-track { display: inline-flex; gap: 4px; padding: 6px; border-radius: 16px; background: var(--card-bg); border: 1px solid var(--border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
                    .premium-tab-btn { position: relative; padding: 10px 24px; border-radius: 12px; border: none; background: transparent; cursor: pointer; font-family: 'Poppins'; font-size: 13.5px; white-space: nowrap; z-index: 1; transition: color 0.3s ease; }
                    
                    /* Category Progress Bars */
                    .cap-bar-bg { height: 6px; background: var(--border); border-radius: 4px; overflow: hidden; margin-top: 6px; width: 100%; }
                    .cap-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
                    
                    /* FIXED BUDGET MODAL STYLING */
                    .budget-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 999999; padding: 16px; }
                    .budget-modal-container { background: var(--card-bg); width: 100%; max-width: 420px; border-radius: 24px; box-shadow: 0 24px 50px rgba(0,0,0,0.3); display: flex; flex-direction: column; max-height: 90vh; border: 1px solid var(--border); overflow: hidden; }
                    .budget-modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); z-index: 10; }
                    .budget-modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; scrollbar-width: none; -ms-overflow-style: none; }
                    .budget-modal-body::-webkit-scrollbar { display: none; }
                    .budget-modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 12px; background: var(--card-bg); z-index: 10; }
                    
                    .budget-input-wrapper { display: flex; align-items: center; background: var(--background); border: 2px solid var(--border); border-radius: 16px; padding: 14px 18px; transition: all 0.2s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
                    .budget-input-wrapper:focus-within { border-color: var(--primary); background: var(--card-bg); box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1); }
                    
                    .cap-input-row { display: flex; align-items: center; background: var(--background); padding: 12px 16px; border-radius: 16px; border: 1px solid var(--border); margin-bottom: 12px; transition: all 0.2s ease; }
                    .cap-input-row:focus-within { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1); }
                    .cap-input-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
                    .cap-input-right { display: flex; align-items: center; gap: 8px; background: var(--card-bg); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border); }
                    
                    .premium-budget-input::-webkit-outer-spin-button, .premium-budget-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                    .premium-budget-input[type=number] { -moz-appearance: textfield; border: none; background: transparent; outline: none; color: var(--text-primary); font-size: 15px; font-weight: 600; width: 70px; text-align: right; padding: 0; }
                `}</style>

                {/* CONSOLIDATED DATE PICKER & ACTION BUTTONS */}
                <div className="top-actions-grid">
                    <div className="date-filter-row">
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>📅 {rFallback.customRange}:</span>
                        <div className="date-input-wrapper">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>-</span>
                        <div className="date-input-wrapper">
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <AnimatePresence>
                            {(startDate || endDate) && (
                                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => { setStartDate(""); setEndDate(""); }} style={{ padding: "10px 16px", borderRadius: 12, background: "#FEE2E2", color: "#EF4444", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                    {rFallback.clear}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="action-buttons-row">
                        <motion.button className="action-btn-styled" onClick={() => setShowBudgetForm(true)} whileTap={{ scale: 0.95 }} style={{ background: "var(--gradient)", color: "white", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)" }}>
                            ⚙️ {rFallback.setBudgetCaps}
                        </motion.button>
                        <motion.button className="action-btn-styled" onClick={downloadPDF} disabled={downloadingPDF} whileTap={{ scale: 0.95 }} style={{ background: "var(--card-bg)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                            {downloadingPDF ? rFallback.generating : rFallback.downloadPdfBtn}
                        </motion.button>
                        <motion.button className="action-btn-styled" onClick={downloadExcel} disabled={exportingExcel} whileTap={{ scale: 0.95 }} style={{ background: "var(--card-bg)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                            {exportingExcel ? rFallback.generating : rFallback.downloadExcelBtn}
                        </motion.button>
                    </div>
                </div>

                {/* Summary Cards Grid */}
                <div className="summary-grid" style={{ marginBottom: 20 }}>
                    <motion.div className="summary-card income" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <p>{rFallback.income}</p>
                        <h3>₹{totalIncome.toLocaleString("en-IN")}</h3>
                    </motion.div>
                    <motion.div className="summary-card expense" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <p>{rFallback.expenses}</p>
                        <h3>₹{totalExpenses.toLocaleString("en-IN")}</h3>
                    </motion.div>
                    <motion.div className="summary-card savings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <p>{rFallback.savings}</p>
                        <h3>₹{savings.toLocaleString("en-IN")}</h3>
                    </motion.div>
                </div>

                {/* UPGRADED MAGIC SLIDING PILL TAB MENU */}
                <div className="premium-tabs-container">
                    <div className="premium-tabs-track">
                        {["weekly", "monthly", "yearly", "category", "trend", "networth", "forecast", "insights"].map(tab => (
                            <motion.button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                whileTap={{ scale: 0.95 }}
                                className="premium-tab-btn"
                                style={{
                                    fontWeight: activeTab === tab ? 600 : 500,
                                    color: activeTab === tab ? "#fff" : "var(--text-secondary)"
                                }}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeReportTab"
                                        style={{ position: "absolute", inset: 0, background: "var(--gradient)", borderRadius: "12px", zIndex: -1, boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)" }}
                                        transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }}
                                    />
                                )}
                                {tabsLabels[tab]}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* 1. WEEKLY TAB */}
                {activeTab === "weekly" && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="card-title">{rFallback.weeklyOverview}</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                                <Tooltip cursor={{ fill: "rgba(124,58,237,0.05)" }} contentStyle={{ background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border)" }} formatter={(val, name) => [`₹${val.toLocaleString("en-IN")}`, name === "income" ? rFallback.income : rFallback.expenses]} />
                                <Legend wrapperStyle={{ paddingTop: 16 }} formatter={(val) => val === "income" ? rFallback.income : rFallback.expenses} />
                                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="expenses" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 2. MONTHLY TAB */}
                {activeTab === "monthly" && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="card-title">{rFallback.monthlyOverview}</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={4}>
                                <defs>
                                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" stopOpacity={0.8} /></linearGradient>
                                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#EC4899" stopOpacity={0.8} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                                <Tooltip cursor={{ fill: "rgba(124,58,237,0.05)" }} contentStyle={{ background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border)" }} formatter={(val, name) => [`₹${val.toLocaleString("en-IN")}`, name === "income" ? rFallback.income : rFallback.expenses]} />
                                <Legend wrapperStyle={{ paddingTop: 16 }} formatter={(val) => val === "income" ? rFallback.income : rFallback.expenses} />
                                <Bar dataKey="income" fill="url(#incGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="expenses" fill="url(#expGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 3. YEARLY COMPARISON TAB */}
                {activeTab === "yearly" && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="card-title">{rFallback.yearlyOverview} ({rFallback.expenses})</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                                <Tooltip cursor={{ fill: "rgba(124,58,237,0.05)" }} contentStyle={{ background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border)" }} formatter={(val, name) => [`₹${val.toLocaleString("en-IN")}`, name === "thisYear" ? rFallback.thisYear : rFallback.lastYear]} />
                                <Legend wrapperStyle={{ paddingTop: 16 }} formatter={(val) => val === "thisYear" ? rFallback.thisYear : rFallback.lastYear} />
                                <Bar dataKey="lastYear" fill="#D1D5DB" radius={[4, 4, 0, 0]} maxBarSize={25} />
                                <Bar dataKey="thisYear" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 4. NET WORTH TAB */}
                {activeTab === "networth" && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="card-title">{rFallback.netWorthHistory}</h3>
                        {netWorthData.length === 0 ? (
                            <div className="empty-state"><p>{rFallback.noDataYet}</p></div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={netWorthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} minTickGap={30} />
                                    <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                                    <Tooltip contentStyle={{ background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border)", fontFamily: "Poppins", fontSize: 13 }} formatter={(val) => [`₹${val.toLocaleString("en-IN")}`, tabsLabels.networth]} labelStyle={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }} />
                                    <Area type="monotone" dataKey="netWorth" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                )}

                {/* 5. CATEGORY TAB WITH CAPS */}
                {activeTab === "category" && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="card-title">{rFallback.spendingByCat}</h3>
                        {categoryData.length === 0 ? (
                            <div className="empty-state"><p>{rFallback.noDataYet}</p></div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" outerRadius={110} innerRadius={50} paddingAngle={3} dataKey="value" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                                            const RADIAN = Math.PI / 180;
                                            const radius = outerRadius + 30;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            if (percent < 0.05) return null;
                                            return (
                                                <text x={x} y={y} fill="var(--text-primary)" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" style={{ fontSize: 12, fontFamily: "Poppins", fontWeight: 500 }}>
                                                    {`${name} ${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            );
                                        }}>
                                            {categoryData.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="var(--card-bg)" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }} formatter={(value, name) => [`₹${Number(value).toLocaleString("en-IN")}`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Category Legends with Dynamic Progress Caps */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 8 }}>
                                    {categoryData.map((item, index) => {
                                        const cap = categoryLimits[item.originalName] || 0;
                                        const hasCap = cap > 0;
                                        const capPercent = hasCap ? Math.min((item.value / cap) * 100, 100) : 0;
                                        const isDanger = capPercent >= 90;
                                        const isWarning = capPercent >= 75 && !isDanger;
                                        const capColor = isDanger ? "#EF4444" : isWarning ? "#F59E0B" : "#10B981";

                                        return (
                                            <div key={index} style={{ padding: "14px", borderRadius: 16, background: "var(--background)", border: `1px solid var(--border)` }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: hasCap ? 10 : 0 }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS[index % COLORS.length] + "20", color: COLORS[index % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                                                        {getCategoryIcon(item.originalName)}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px 0" }}>{item.name}</p>
                                                        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                                                            {((item.value / categoryData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(0)}% of total
                                                        </p>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px 0" }}>₹{item.value.toLocaleString("en-IN")}</p>
                                                    </div>
                                                </div>

                                                {hasCap && (
                                                    <div>
                                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                                                            <span style={{ color: isDanger ? "#EF4444" : "var(--text-secondary)", fontWeight: isDanger ? 600 : 500 }}>{capPercent.toFixed(0)}% {rFallback.used}</span>
                                                            <span>₹{cap.toLocaleString("en-IN")} {rFallback.limit}</span>
                                                        </div>
                                                        <div className="cap-bar-bg">
                                                            <div className="cap-bar-fill" style={{ width: `${capPercent}%`, background: capColor }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* 6. TREND TAB */}
                {activeTab === "trend" && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="card-title">{rFallback.incomeVsExpenseTrend}</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="inLineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" /></linearGradient>
                                    <linearGradient id="exLineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#c52235" /><stop offset="100%" stopColor="#e92c3c" /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                                <Tooltip contentStyle={{ background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border)" }} formatter={(val, name) => [`₹${val.toLocaleString("en-IN")}`, name === "income" ? rFallback.income : rFallback.expenses]} />
                                <Legend wrapperStyle={{ paddingTop: 16 }} formatter={(val) => val === "income" ? rFallback.income : rFallback.expenses} />
                                <Line type="monotone" dataKey="income" stroke="url(#inLineGrad)" strokeWidth={3} dot={{ r: 5, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }} name="income" />
                                <Line type="monotone" dataKey="expenses" stroke="url(#exLineGrad)" strokeWidth={3} dot={{ r: 5, fill: "#7C3AED", strokeWidth: 2, stroke: "#fff" }} name="expenses" />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* 7. PREDICTIVE FORECAST TAB */}
                {activeTab === "forecast" && (
                    <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="card-title" style={{ marginBottom: 20 }}>🔮 {rFallback.forecastTitle}</h3>
                        {!forecastInfo ? (
                            <div className="empty-state"><p>{rFallback.noDataYet}</p></div>
                        ) : (
                            <>
                                <div style={{ display: "flex", background: "var(--background)", padding: "16px", borderRadius: "16px", marginBottom: "20px", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)" }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{rFallback.runwayDesc}</p>
                                        <h2 style={{ margin: 0, color: "var(--primary)", fontSize: 24 }}>{forecastInfo.daysRemaining} <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>{rFallback.daysLeft}</span></h2>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{rFallback.zeroBalance}</p>
                                        <h4 style={{ margin: 0, color: "#EF4444", fontSize: 16 }}>{forecastInfo.zeroDate}</h4>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={forecastInfo.forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} minTickGap={20} />
                                        <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                                        <Tooltip contentStyle={{ background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--border)" }} formatter={(val) => [`₹${val.toLocaleString("en-IN")}`, "Projected Balance"]} />
                                        <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="projected" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: "#F59E0B" }} name="Projected Balance" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </>
                        )}
                    </motion.div>
                )}

                {/* 8. INSIGHTS TAB */}
                {activeTab === "insights" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="card">
                            <div className="health-header">
                                <div>
                                    <h3 className="card-title" style={{ marginBottom: 4 }}>{rFallback.finHealthScore}</h3>
                                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{rFallback.basedOnHabits}</p>
                                </div>
                                <div className="health-score-circle" style={{ borderColor: healthData.color }}>
                                    <span className="health-score-number" style={{ color: healthData.color }}>{healthData.score}</span>
                                    <span className="health-score-total">/100</span>
                                </div>
                            </div>
                            <div className="health-progress">
                                <motion.div className="health-progress-fill" style={{ background: healthData.color }} initial={{ width: 0 }} animate={{ width: `${healthData.score}%` }} transition={{ duration: 1.5 }} />
                            </div>
                            <div className="health-grade">
                                <span style={{ color: healthData.color, fontWeight: 700, fontSize: 18 }}>{healthData.emoji} {healthData.grade}</span>
                                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{rFallback.savingsRateLabel}: {savingsRate.toFixed(1)}%</span>
                            </div>
                        </div>

                        {healthData.reasons.length > 0 && (
                            <div className="card">
                                <h3 style={{ fontWeight: 600, marginBottom: 12, color: "var(--text-primary)", marginTop: 0 }}>{rFallback.whatsGoingWell}</h3>
                                <div className="health-reasons">
                                    {healthData.reasons.map((r, i) => <div key={i} className="health-reason good" style={{ fontSize: "13.5px", color: "var(--text-primary)", padding: "4px 0" }}>✅ {r}</div>)}
                                </div>
                            </div>
                        )}

                        {healthData.tips.length > 0 && (
                            <div className="card">
                                <h3 style={{ fontWeight: 600, marginBottom: 12, color: "var(--text-primary)", marginTop: 0 }}>{rFallback.tipsToImprove}</h3>
                                <div className="health-tips">
                                    {healthData.tips.map((tipText, i) => <div key={i} className="health-tip" style={{ fontSize: "13.5px", color: "var(--text-primary)", padding: "4px 0" }}>💡 {tipText}</div>)}
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <h3 style={{ fontWeight: 600, marginBottom: 16, color: "var(--text-primary)", marginTop: 0 }}>{rFallback.keyMetricsTitle}</h3>
                            {[
                                { label: metricsLabels.savingsRate, value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? "#10B981" : "#EF4444" },
                                { label: metricsLabels.budgetUsed, value: `${Math.min(budgetUsed, 999).toFixed(1)}%`, color: budgetUsed <= 80 ? "#10B981" : "#EF4444" },
                                { label: metricsLabels.totalTrans, value: filteredExpenses.length + filteredIncomes.length, color: "#7C3AED" },
                                { label: metricsLabels.expCatCount, value: new Set(filteredExpenses.map(e => e.category)).size, color: "#3B82F6" },
                                { label: metricsLabels.avgDailyExp, value: `₹${filteredExpenses.length > 0 ? Math.round(totalExpenses / 30).toLocaleString("en-IN") : 0}`, color: "#F59E0B" },
                                { label: metricsLabels.totalIncSrc, value: new Set(filteredIncomes.map(i => i.type)).size, color: "#10B981" },
                            ].map(metric => (
                                <div key={metric.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{metric.label}</span>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: metric.color }}>{metric.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* History Timeline Activity Feeds */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>{rFallback.transactionHistoryTitle}</h3>
                        <div style={{ display: "flex", gap: 6 }}>
                            {["all", "expense", "income"].map(f => (
                                <button key={f} onClick={() => setHistoryFilter(f)} style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "Poppins", fontSize: 12, fontWeight: 500, background: historyFilter === f ? "var(--gradient)" : "var(--background)", color: historyFilter === f ? "white" : "var(--text-secondary)", transition: "all 0.2s ease" }}>
                                    {filterHistoryLabels[f]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredHistory.length === 0 ? (
                        <div className="empty-state"><p>{rFallback.noTransactionsFound}</p></div>
                    ) : (
                        filteredHistory.map((transaction, index) => (
                            <motion.div key={transaction.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: transaction.type === "expense" ? "#FEE2E2" : "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                                    {transaction.type === "expense" ? getCategoryIcon(transaction.category) : "💰"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="transaction-name" style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 2px 0" }}>
                                        {transaction.description || (transaction.type === "expense" ? categoryTranslations[transaction.category] : filterHistoryLabels.income) || transaction.type}
                                    </p>
                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 2px 0" }}>
                                        {transaction.type === "expense" ? categoryTranslations[transaction.category] : filterHistoryLabels.income}
                                    </p>
                                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
                                        🕐 {formatLocalizedStamp(transaction.date)}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <p style={{ fontWeight: 700, fontSize: 15, color: transaction.type === "expense" ? "#EF4444" : "#10B981", margin: "0 0 4px 0" }}>
                                        {transaction.type === "expense" ? "-" : "+"}₹{Number(transaction.amount).toLocaleString("en-IN")}
                                    </p>
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: transaction.type === "expense" ? "#FEE2E2" : "#D1FAE5", color: transaction.type === "expense" ? "#EF4444" : "#10B981", fontWeight: 500 }}>
                                        {filterHistoryLabels[transaction.type]}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>

                {/* MODAL: SET BUDGET & CATEGORY CAPS */}
                <AnimatePresence>
                    {showBudgetForm && (
                        <div className="budget-modal-overlay">
                            <motion.div className="budget-modal-container" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>

                                <div className="budget-modal-header">
                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                                        ⚙️ {rFallback.setBudgetCaps}
                                    </h3>
                                    <button onClick={() => setShowBudgetForm(false)} style={{ background: "var(--background)", border: "none", width: 32, height: 32, borderRadius: "50%", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleUpdateBudget} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>

                                    <div className="budget-modal-body">
                                        <div style={{ marginBottom: 24 }}>
                                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                                                {rFallback.totalMonthly}
                                            </label>
                                            <div className="budget-input-wrapper">
                                                <span style={{ fontSize: 20, color: "var(--text-primary)", fontWeight: 700, marginRight: 12 }}>₹</span>
                                                <input
                                                    type="number"
                                                    className="premium-budget-input"
                                                    placeholder={budget}
                                                    value={budgetFormAmount}
                                                    onChange={e => setBudgetFormAmount(e.target.value)}
                                                    style={{ border: "none", background: "transparent", color: "var(--text-primary)", fontSize: 22, fontWeight: 700, width: "100%", outline: "none", padding: 0 }}
                                                />
                                            </div>
                                        </div>

                                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                            🎯 {rFallback.categoryCaps}
                                        </h4>

                                        <div className="category-cap-list">
                                            {Object.keys(categoryTranslations).map(catKey => {
                                                if (catKey === "Other") return null;
                                                return (
                                                    <div key={catKey} className="cap-input-row">
                                                        <div className="cap-input-left">
                                                            <span style={{ fontSize: 20 }}>{getCategoryIcon(catKey)}</span>
                                                            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {categoryTranslations[catKey][currentLanguage] || categoryTranslations[catKey].English || catKey}
                                                            </span>
                                                        </div>
                                                        <div className="cap-input-right">
                                                            <span style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 500 }}>₹</span>
                                                            <input
                                                                type="number"
                                                                className="premium-budget-input"
                                                                placeholder="0"
                                                                value={categoryLimits[catKey] || ""}
                                                                onChange={e => setCategoryLimits({ ...categoryLimits, [catKey]: Number(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="budget-modal-footer">
                                        <button type="button" onClick={() => setShowBudgetForm(false)} style={{ flex: 1, padding: "14px", border: "1px solid var(--border)", borderRadius: "14px", background: "var(--background)", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "background 0.2s" }}>
                                            {rFallback.cancelBtn || "Cancel"}
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={loadingBudget} style={{ flex: 1, padding: "14px", borderRadius: "14px", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)" }}>
                                            {loadingBudget ? "..." : (rFallback.saveBtn || "Save Caps")}
                                        </button>
                                    </div>

                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Reports;