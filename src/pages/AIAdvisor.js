import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const FormattedMessage = ({ content }) => {
    const lines = content.split("\n");
    const renderBold = (text) => {
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} style={{ fontWeight: 700 }}>{part}</strong> : part
        );
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
                if (line.trim().match(/^[\*\-•]\s/)) {
                    return (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ color: "#7C3AED", fontWeight: 700, flexShrink: 0 }}>•</span>
                            <span style={{ fontSize: 14, lineHeight: 1.6 }}>{renderBold(line.trim().slice(2))}</span>
                        </div>
                    );
                }
                if (/^\d+\./.test(line.trim())) {
                    const num = line.match(/^(\d+)\./)[1];
                    return (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, flexShrink: 0 }}>{num}.</span>
                            <span style={{ fontSize: 14, lineHeight: 1.6 }}>{renderBold(line.replace(/^\d+\.\s*/, ""))}</span>
                        </div>
                    );
                }
                if (line.trim().startsWith("#")) {
                    return <p key={i} style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", margin: "6px 0 2px" }}>{line.replace(/^#+\s*/, "")}</p>;
                }
                return <p key={i} style={{ fontSize: 14, lineHeight: 1.65, margin: 0 }}>{renderBold(line)}</p>;
            })}
        </div>
    );
};

const AIAdvisor = () => {
    const { user, darkMode, displayName, currentLanguage, t } = useApp();
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [budget, setBudget] = useState(50000);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [insightLoading, setInsightLoading] = useState(false);
    const [insights, setInsights] = useState(null);
    const [profilePic, setProfilePic] = useState(user?.photoURL || null); // 🚀 NEW: PFP State

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // SYSTEM COMPREHENSIVE TRANSLATION DICTIONARY MATRIX 
    const advLabels = {
        title: { English: "AI Financial Advisor", "हिंदी": "एआई वित्तीय सलाहकार", "తెలుగు": "AI ఆర్థిక సలహాదారు", "ಕನ್ನಡ": "AI ಹಣಕಾಸು ಸಲಹೆಗಾರ", "മലയാളം": "AI സാമ്പത്തിക ഉപദേശകൻ" }[currentLanguage] || "AI Financial Advisor",
        subTitle: { English: "Powered by Advanced AI • Your Personal Finance Expert", "हिंदी": "उन्नत एआई द्वारा संचालित • आपका व्यक्तिगत वित्त विशेषज्ञ", "తెలుగు": "అడ్వాన్స్డ్ AI పవర్డ్ • మీ వ్యక్తిగత ఆర్థిక నిపుణుడు", "ಕನ್ನಡ": "ಸುಧಾರಿತ AI ತಂತ್ರಜ್ಞಾನ • ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಹಣಕಾಸು ತಜ್ಞ" }[currentLanguage] || "Powered by Advanced AI • Your Personal Finance Expert",
        income: { English: "Income", "हिंदी": "आय", "తెలుగు": "ఆదాయం", "ಕನ್ನಡ": "ಆದಾಯ" }[currentLanguage] || "Income",
        expenses: { English: "Expenses", "हिंदी": "खर्च", "తెలుగు": "ఖర్చులు", "ಕನ್ನಡ": "ವೆಚ್ಚಗಳು" }[currentLanguage] || "Expenses",
        savings: { English: "Savings", "हिंदी": "बचत", "తెలుగు": "పొదుపు", "ಕನ್ನಡ": "ಉಳಿತಾಯ" }[currentLanguage] || "Savings",
        quickAnalysis: { English: "🧠 Quick Analysis", "हिंदी": "🧠 त्वरित विश्लेषण", "తెలుగు": "🧠 త్వరిత విశ్లేషణ", "ಕನ್ನಡ": "🧠 ತ್ವರಿತ ವಿಶ್ಲೇಷಣೆ" }[currentLanguage] || "🧠 Quick Analysis",
        quickQuestions: { English: "💬 Quick Questions", "हिंदी": "💬 त्वरित प्रश्न", "తెలుగు": "💬 త్వరిత ప్రశ్నలు", "ಕನ್ನಡ": "💬 ತ್ವರಿತ ಪ್ರಶ್ನೆಗಳು" }[currentLanguage] || "💬 Quick Questions",
        chatHeader: { English: "💬 Chat with AI Advisor", "हिंदी": "💬 एआई सलाहकार के साथ चैट करें", "తెలుగు": "💬 AI సలహాదారుతో చాట్ చేయండి", "ಕನ್ನಡ": "💬 AI ಸಲಹೆಗಾರರೊಂದಿಗೆ ಚಾಟ್ ಮಾಡಿ" }[currentLanguage] || "💬 Chat with AI Advisor",
        placeholderInput: { English: "Ask anything about your finances...", "हिंदी": "अपने वित्त के बारे में कुछ भी पूछें...", "తెలుగు": "మీ ఆర్థిక విషయాల గురించి ఏదైనా అడగండి...", "ಕನ್ನಡ": "ನಿಮ್ಮ ಹಣಕಾಸಿನ ಬಗ್ಗೆ ಏನ್ನನ್ನಾದರೂ ಕೇಳಿ..." }[currentLanguage] || "Ask anything about your finances...",
        generateBtn: { English: "✨ Generate AI Insights", "हिंदी": "✨ एआई अंतर्दृष्टि जनरेट करें", "తెలుగు": "✨ AI సలహాలు పొందండి", "ಕನ್ನಡ": "✨ AI ಒಳನೋಟಗಳನ್ನು ರಚಿಸಿ" }[currentLanguage] || "✨ Generate AI Insights",
        generatingStatus: { English: "⏳ Analyzing your finances...", "हिंदी": "⏳ आपके वित्त का विश्लेषण किया जा रहा है...", "తెలుగు": "⏳ మీ ఆర్థిక స్థితిని విశ్లేషిస్తోంది...", "ಕನ್ನಡ": "⏳ ನಿಮ್ಮ ಹಣಕಾಸನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..." }[currentLanguage] || "⏳ Analyzing your finances...",
        analyzingLoader: { English: "Analyzing...", "हिंदी": "विश्लेषण किया जा रहा है...", "తెలుగు": "విశ్లేషిస్తోంది...", "ಕನ್ನಡ": "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..." }[currentLanguage] || "Analyzing..."
    };

    const QUICK_QUESTIONS = [
        { icon: "💰", text: { English: "How am I doing financially?", "हिंदी": "मेरी वित्तीय स्थिति कैसी है?", "తెలుగు": "నా ఆర్థిక స్థితి ఎలా ఉంది?", "ಕನ್ನಡ": "ನನ್ನ ಆರ್ಥಿಕ ಪರಿಸ್ಥಿತಿ ಹೇಗಿದೆ?" }[currentLanguage] || "How am I doing financially?" },
        { icon: "📊", text: { English: "Where am I overspending?", "हिंदी": "मैं कहाँ अधिक खर्च कर रहा हूँ?", "తెలుగు": "నేను ఎక్కడ ఎక్కువ ఖర్చు చేస్తున్నాను?", "ಕನ್ನಡ": "ನಾನು ಎಲ್ಲಿ ಹೆಚ್ಚು ಖರ್ಚು ಮಾಡುತ್ತಿದ್ದೇನೆ?" }[currentLanguage] || "Where am I overspending?" },
        { icon: "💡", text: { English: "How can I save more money?", "हिंदी": "मैं अधिक पैसे कैसे बचा सकता हूँ?", "తెలుగు": "నేను ఎక్కువ డబ్బు ఎలా ఆదా చేయగలను?", "ಕನ್ನಡ": "ನಾನು ಹೆಚ್ಚು ಹಣವನ್ನು ಹೇಗೆ ಉಳಿಸಬಹುದು?" }[currentLanguage] || "How can I save more money?" },
        { icon: "📈", text: { English: "Should I invest in SIP?", "हिंदी": "क्या मुझे एसआईपी में निवेश करना चाहिए?", "తెలుగు": "నేను SIPలో పెట్టుబడి పెట్టవచ్చా?", "ಕನ್ನಡ": "ನಾನು SIP ನಲ್ಲಿ ಹೂಡಿಕೆ ಮಾಡಬೇಕೇ?" }[currentLanguage] || "Should I invest in SIP?" },
        { icon: "🎯", text: { English: "Give me a budget plan", "हिंदी": "मुझे एक बजट योजना दें", "తెలుగు": "నాకోసం ఒక బడ్జెట్ ప్లాన్ ఇవ్వండి", "ಕನ್ನಡ": "ನನಗೊಂದು ಬಜೆಟ್ ಯೋಜನೆ ನೀಡಿ" }[currentLanguage] || "Give me a budget plan" },
        { icon: "🏦", text: { English: "How to build emergency fund?", "हिंदी": "आपातकालीन कोष कैसे बनाएं?", "తెలుగు": "అత్యవసర నిధిని ఎలా ఏర్పాటు చేయాలి?", "ಕನ್ನಡ": "ತುರ್ತು ನಿಧಿಯನ್ನು ಹೇಗೆ ನಿರ್ಮಿಸುವುದು?" }[currentLanguage] || "How to build emergency fund?" },
        { icon: "🧾", text: { English: "Tax saving tips for me", "हिंदी": "मेरे लिए टैक्स बचाने के उपाय", "తెలుగు": "నా కోసం టాక్స్ సేవింగ్ చిట్కాలు", "ಕನ್ನಡ": "ನನಗಾಗಿ ತೆರಿಗೆ ಉಳಿತಾಯ ಸಲಹೆಗಳು" }[currentLanguage] || "Tax saving tips for me" },
        { icon: "💳", text: { English: "How to manage credit card?", "हिंदी": "क्रेडिट कार्ड का प्रबंधन कैसे करें?", "తెలుగు": "క్రెడిట్ కార్డ్‌ను ఎలా మేనేజ్ చేయాలి?", "ಕನ್ನಡ": "ಕಾರ್ಡ್ ಬಳಕೆಯನ್ನು ನಿರ್ವಹಿಸುವುದು ಹೇಗೆ?" }[currentLanguage] || "How to manage credit card?" }
    ];

    const INSIGHT_CATEGORIES = [
        { icon: "💰", label: { English: "Spending", "हिंदी": "खर्च", "తెలుగు": "ఖర్చులు", "ಕನ್ನಡ": "ವೆಚ್ಚಗಳು" }[currentLanguage] || "Spending", prompt: "Analyze my spending patterns in detail and give insights" },
        { icon: "📈", label: { English: "Invest", "हिंदी": "निवेश", "తెలుగు": "పెట్టుబడి", "ಕನ್ನಡ": "ಹೂಡಿಕೆ" }[currentLanguage] || "Invest", prompt: "Give me personalized investment advice based on my savings" },
        { icon: "🎯", label: { English: "Goals", "हिंदी": "लक्ष्य", "తెలుగు": "లక్ష్యాలు", "ಕನ್ನಡ": "ಗುರಿಗಳು" }[currentLanguage] || "Goals", prompt: "Help me set realistic financial goals based on my income" },
        { icon: "🧾", label: { English: "Tax", "हिंदी": "टैक्स", "తెలుగు": "టాక్స్", "ಕನ್ನಡ": "ತೆರಿಗೆ" }[currentLanguage] || "Tax", prompt: "Give me tax saving tips and deductions I can use" },
        { icon: "⚠️", label: { English: "Alerts", "हिंदी": "चेतावनी", "తెలుగు": "అలర్ట్స్", "ಕನ್ನಡ": "ಎಚ್ಚರಿಕೆಗಳು" }[currentLanguage] || "Alerts", prompt: "What financial risks should I be aware of?" },
        { icon: "📊", label: { English: "Budget", "हिंदी": "बजट", "తెలుగు": "బడ్జెట్", "ಕನ್ನಡ": "ಬಜೆಟ್" }[currentLanguage] || "Budget", prompt: "Create an optimized monthly budget plan for me" },
    ];

    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const initialGreets = {
            English: `Hi **${displayName || "User"}**! 👋 Welcome to your **AI Financial Advisor**.\n\nI have full access to your financial data and can provide:\n\n• 💰 Detailed spending analysis\n• 📊 Personalized budget plans\n• 📈 Investment recommendations (SIP, MF, PPF)\n• 🏦 Loan & EMI calculations\n• 🎯 Savings goal strategies\n• 🧾 Tax optimization tips\n• ⚠️ Financial risk alerts\n\nWhat would you like to explore today?`,
            "हिंदी": `नमस्ते **${displayName || "User"}**! 👋 आपके **एआई वित्तीय सलाहकार** में आपका स्वागत है।\n\nमेरे पास आपके संपूर्ण वित्तीय डेटा की पहुंच है और मैं विस्तृत खर्च विश्लेषण, बजट योजना, निवेश अनुशंसाएं और टैक्स बचत रणनीतियां प्रदान कर सकता हूँ। आज आप क्या जानना चाहते हैं?`,
            "తెలుగు": `నమస్తే **${displayName || "User"}**! 👋 మీ **AI ఆర్థిక సలహాదారు**కు స్వాగతం.\n\nనేను మీ ఖర్చుల విశ్లేషణ, బడ్జెట్ ప్రణాళిక, ఇన్వెస్ట్‌మెంట్ సలహాలు, పొదుపు లక్ష్యాలు మరియు టాక్స్ సేవింగ్స్ వివరాలను అందించగలను. ఈరోజు మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?`,
            "ಕನ್ನಡ": `ನಮಸ್ತೆ **${displayName || "User"}**! 👋 ನಿಮ್ಮ **AI ಹಣಕಾಸು ಸಲಹೆಗಾರರಿಗೆ** ಪ್ರೀತಿಯ ಸುಸ್ವಾಗತ.\n\nನಾನು ನಿಮ್ಮ ಖರ್ಚುಗಳ ವಿಶ್ಲೇಷಣೆ, ಬಜೆಟ್ ಯೋಜನೆ, ಹೂಡಿಕೆ ಸಲಹೆ ಮತ್ತು ತೆರಿಗೆ ಉಳಿತಾಯದಲ್ಲಿ ಸಂಪೂರ್ಣ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನೀವು ಏನನ್ನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?`
        };
        setMessages([{
            role: "assistant",
            content: initialGreets[currentLanguage] || initialGreets.English,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        }]);
    }, [displayName, currentLanguage]);

    useEffect(() => {
        if (!user) return;
        const expQuery = query(collection(db, "expenses"), where("userId", "==", user.uid));
        const incQuery = query(collection(db, "income"), where("userId", "==", user.uid));

        const unsub1 = onSnapshot(expQuery, snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsub2 = onSnapshot(incQuery, snap => setIncomes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        // 🚀 NEW: Real-time listener for profile picture updates in AIAdvisor
        const unsubSettings = onSnapshot(doc(db, "settings", user.uid), snap => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.photoURL || data.profilePic) {
                    setProfilePic(data.photoURL || data.profilePic);
                } else {
                    setProfilePic(null);
                }
            }
        });

        const fetchBudget = async () => {
            const snap = await getDoc(doc(db, "budgets", user.uid));
            if (snap.exists() && snap.data().totalBudget) setBudget(snap.data().totalBudget);
        };
        fetchBudget();

        return () => { unsub1(); unsub2(); unsubSettings(); };
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const getFinancialContext = () => {
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
        const savings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;
        const budgetUsed = budget > 0 ? ((totalExpenses / budget) * 100).toFixed(1) : 0;
        const categoryBreakdown = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc; }, {});
        const categoryDetails = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => `- ${cat}: Rs.${amt.toLocaleString("en-IN")} (${totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : 0}%)`)
            .join("\n");
        return `
USER: ${displayName} | India | INR
BUDGET: Rs.${budget.toLocaleString("en-IN")} | USED: ${budgetUsed}%
INCOME: Rs.${totalIncome.toLocaleString("en-IN")}
EXPENSES: Rs.${totalExpenses.toLocaleString("en-IN")}
SAVINGS: Rs.${savings.toLocaleString("en-IN")} (${savingsRate}%)
TRANSACTIONS: ${expenses.length}
EXPENSE BREAKDOWN:
${categoryDetails || "No expenses yet"}
INCOME SOURCES:
${incomes.map(i => `- ${i.type}: Rs.${i.amount}`).join("\n") || "None yet"}`;
    };

    const sendMessage = async (messageText) => {
        const text = (messageText || input).trim();
        if (!text || loading) return;
        setMessages(prev => [...prev, { role: "user", content: text, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
        setInput("");
        setLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://spendly.app", "X-Title": "Spendly AI Advisor" },
                body: JSON.stringify({
                    model: "openrouter/auto",
                    messages: [
                        { role: "system", content: `You are an expert Indian personal finance advisor for Spendly.\n\nUSER DATA:\n${getFinancialContext()}\n\nMANDATORY DIRECTION: You MUST formulate your entire response inside the selected user language context which is: "${currentLanguage}". Use **bold** for key points. Use Rs. for amounts. Max 250 words.` },
                        ...messages.slice(-6).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
                        { role: "user", content: text }
                    ],
                    max_tokens: 1024, temperature: 0.7,
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Error");
            const aiText = data.choices?.[0]?.message?.content;
            if (!aiText) throw new Error("No response");
            setMessages(prev => [...prev, { role: "assistant", content: aiText, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: `❌ **Error:** ${err.message}\n\nPlease try again! 🙏`, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
        }
        setLoading(false);
    };

    const generateInsights = async () => {
        setInsightLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://spendly.app", "X-Title": "Spendly" },
                body: JSON.stringify({
                    model: "openrouter/auto",
                    messages: [{
                        role: "user",
                        content: `Analyze this Indian user's finances and give 3 key insights in pure JSON format (no markdown):
${getFinancialContext()}
Return exactly: [{"emoji":"emoji","title":"short title","insight":"one sentence response written completely in ${currentLanguage}","type":"good/warning/tip"}]
3 items only. No extra text.`
                    }],
                    max_tokens: 400, temperature: 0.5,
                })
            });
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim();
            if (text) {
                const parsed = JSON.parse(text);
                setInsights(parsed);
            }
        } catch (err) { console.error(err); }
        setInsightLoading(false);
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const savings = totalIncome - totalExpenses;

    return (
        <div className={darkMode ? "dark-mode" : ""} style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "30px" }}>
            <Navbar title={advLabels.title} />
            <div className="page-container">

                <style>{`
                    .card h3, .card h2, .card p, .btn-primary, label { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 13px 18px; border-radius: 24px; box-sizing: border-box; }
                `}</style>

                {/* Dashboard Header Panel */}
                <motion.div className="card" style={{ background: "linear-gradient(135deg,#4C1D95,#7C3AED,#EC4899)", color: "white", textAlign: "center", position: "relative", overflow: "hidden", padding: "24px", borderRadius: "20px" }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {[{ s: 100, t: -30, r: -20, o: 0.1 }, { s: 60, b: -20, l: 20, o: 0.08 }].map((c, i) => (
                        <div key={i} style={{ position: "absolute", width: c.s, height: c.s, borderRadius: "50%", background: "white", opacity: c.o, top: c.t, right: c.r, bottom: c.b, left: c.l }} />
                    ))}
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: 44, marginBottom: 8, position: "relative" }}>🤖</motion.div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, margin: 0 }}>{advLabels.title}</h2>
                    <p style={{ opacity: 0.85, fontSize: 13, margin: "4px 0 0 0" }}>{advLabels.subTitle}</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "14px" }}>
                        {[{ l: advLabels.income, v: totalIncome }, { l: advLabels.expenses, v: totalExpenses }, { l: advLabels.savings, v: savings }].map(item => (
                            <div key={item.l}>
                                <p style={{ fontSize: 11, opacity: 0.8, margin: "0 0 2px 0" }}>{item.l}</p>
                                <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>₹{item.v.toLocaleString("en-IN")}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Insight Category Trigger Matrices */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginTop: 16, borderRadius: "20px", padding: "20px" }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 14, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{advLabels.quickAnalysis}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                        {INSIGHT_CATEGORIES.map((cat, i) => (
                            <motion.button key={i} onClick={() => sendMessage(cat.prompt)} disabled={loading}
                                whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                                style={{ padding: "14px 8px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--background)", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                                <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.icon}</div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{cat.label}</p>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Structured Vector Metrics Generation Dispatch */}
                <motion.button className="btn-primary" onClick={generateInsights} disabled={insightLoading}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.95 }}
                    style={{ marginBottom: 16, marginTop: 16, width: "100%", padding: "14px", borderRadius: "14px", fontWeight: 600, fontSize: "14px" }}>
                    {insightLoading ? advLabels.generatingStatus : advLabels.generateBtn}
                </motion.button>

                {/* Parsing Vectors Response Cards Stream */}
                <AnimatePresence>
                    {insights && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 16 }}>
                            {insights.map((insight, i) => (
                                <motion.div key={i} className="card"
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    style={{ borderLeft: `4px solid ${insight.type === "good" ? "#10B981" : insight.type === "warning" ? "#F59E0B" : "#7C3AED"}`, marginBottom: 12, padding: "16px", borderRadius: "16px" }}>
                                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                        <span style={{ fontSize: 28, flexShrink: 0 }}>{insight.emoji}</span>
                                        <div>
                                            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, marginTop: 0, fontSize: "14.5px" }}>{insight.title}</p>
                                            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{insight.insight}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Questions Stream Blocks */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ marginBottom: 16, borderRadius: "20px", padding: "20px" }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 14, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{advLabels.quickQuestions}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {QUICK_QUESTIONS.map((q, i) => (
                            <motion.button key={i} onClick={() => sendMessage(q.text)} disabled={loading}
                                whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.96 }}
                                style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontSize: "12.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                                <span>{q.icon}</span><span>{q.text}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Operational Realtime Conversation Space Container */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 24, borderRadius: "20px", padding: "20px" }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{advLabels.chatHeader}</h3>

                    <div style={{ maxHeight: 450, overflowY: "auto", marginBottom: 16, display: "flex", flexDirection: "column", gap: 14, paddingRight: "4px" }}>
                        {messages.map((msg, index) => (
                            <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>

                                {msg.role === "assistant" && (
                                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, boxShadow: "0 4px 10px rgba(124,58,237,0.25)" }}>🤖</div>
                                )}

                                <div style={{
                                    maxWidth: "78%", padding: "12px 16px",
                                    borderRadius: msg.role === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                                    background: msg.role === "user" ? "var(--gradient)" : "var(--background)",
                                    color: msg.role === "user" ? "white" : "var(--text-primary)",
                                    boxShadow: msg.role === "user" ? "0 6px 16px rgba(124,58,237,0.3)" : "0 2px 10px rgba(0,0,0,0.04)",
                                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                                }}>
                                    {msg.role === "assistant" ? <FormattedMessage content={msg.content} /> : <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>{msg.content}</p>}
                                    <p style={{ fontSize: 10, opacity: 0.5, marginTop: 6, textAlign: "right", margin: "4px 0 0 0" }}>{msg.time}</p>
                                </div>

                                {msg.role === "user" && (
                                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6D28D9,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, fontWeight: 700, color: "white", boxShadow: "0 2px 8px rgba(109,40,217,0.2)", overflow: "hidden" }}>
                                        {/* 🚀 LIVE SYNCED PFP IN AI ADVISOR CHAT BUBBLES */}
                                        {profilePic ? (
                                            <img src={profilePic} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            displayName?.charAt(0).toUpperCase() || "U"
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {loading && (
                            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                                <div style={{ background: "var(--background)", padding: "14px 18px", borderRadius: "20px 20px 20px 5px", border: "1px solid var(--border)", display: "flex", gap: 5, alignItems: "center" }}>
                                    {[0, 1, 2].map(i => (
                                        <motion.div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}
                                            animate={{ y: [0, -7, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.18 }} />
                                    ))}
                                    <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 6 }}>{advLabels.analyzingLoader}</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Operational Dispatcher Controls */}
                    <div style={{ display: "flex", gap: 8 }}>
                        <input ref={inputRef} type="text" placeholder={advLabels.placeholderInput}
                            value={input} onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === "Enter" && !loading && sendMessage()}
                            disabled={loading}
                            style={{ flex: 1, border: "2px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontSize: "13.5px", outline: "none", borderRadius: "24px", padding: "13px 18px" }}
                            onFocus={e => { e.target.style.borderColor = "#7C3AED"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                        <motion.button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                            whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}
                            style={{ width: 50, height: 50, borderRadius: "50%", background: input.trim() && !loading ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "var(--border)", border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: input.trim() && !loading ? "0 6px 16px rgba(124,58,237,0.4)" : "none", transition: "all 0.3s" }}>
                            {/* 🚀 ROCKET ROTATION BUG FIXED HERE */}
                            {loading ? (
                                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block" }}>
                                    ⏳
                                </motion.span>
                            ) : (
                                "🚀"
                            )}
                        </motion.button>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default AIAdvisor;