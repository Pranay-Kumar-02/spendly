import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const FormattedMessage = ({ content }) => {
    const lines = content.split("\n");
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} style={{ height: 3 }} />;
                const renderBold = (text) => {
                    const parts = text.split(/\*\*(.*?)\*\*/g);
                    return parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ fontWeight: 700, color: "inherit" }}>{part}</strong> : part);
                };
                if (line.trim().match(/^[\*\-•]\s/)) {
                    const text = line.trim().slice(2);
                    return (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ color: "#A78BFA", fontWeight: 700, flexShrink: 0, fontSize: 14 }}>›</span>
                            <span style={{ fontSize: 13, lineHeight: 1.6 }}>{renderBold(text)}</span>
                        </div>
                    );
                }
                if (/^\d+\./.test(line.trim())) {
                    const num = line.match(/^(\d+)\./)[1];
                    const text = line.replace(/^\d+\.\s*/, "");
                    return (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, flexShrink: 0, fontSize: 13 }}>{num}.</span>
                            <span style={{ fontSize: 13, lineHeight: 1.6 }}>{renderBold(text)}</span>
                        </div>
                    );
                }
                if (line.trim().startsWith("#")) {
                    const text = line.replace(/^#+\s*/, "");
                    return <p key={i} style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", margin: "4px 0 2px" }}>{text}</p>;
                }
                const renderBoldInline = (text) => {
                    const parts = text.split(/\*\*(.*?)\*\*/g);
                    return parts.map((part, j) =>
                        j % 2 === 1 ? <strong key={j} style={{ fontWeight: 700 }}>{part}</strong> : part
                    );
                };
                return <p key={i} style={{ fontSize: 13, lineHeight: 1.65, margin: 0 }}>{renderBoldInline(line)}</p>;
            })}
        </div>
    );
};

const FloatingAI = () => {
    const { user, displayName, currentLanguage } = useApp();
    const [open, setOpen] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [budget, setBudget] = useState(50000);
    const [profilePic, setProfilePic] = useState(user?.photoURL || null);

    const [cards, setCards] = useState([]);
    const [emergencyData, setEmergencyData] = useState(null);
    const [goals, setGoals] = useState([]);
    const [bills, setBills] = useState([]);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const UI_LABELS = {
        headerTitle: {
            English: "AI Financial Advisor",
            "हिंदी": "एआई वित्तीय सलाहकार",
            "తెలుగు": "AI ఆర్థిక సలహాదారు",
            "தமிழ்": "AI நிதி ஆலோசகர்",
            "मराठी": "एआय आर्थिक सल्लागार",
            "বাংলা": "এআই আর্থিক উপদেষ্টা",
            "ગુજરાતી": "એઆઈ નાણાકીય સલાહકાર",
            "ಕನ್ನಡ": "AI ಹಣಕಾಸು ಸಲಹೆಗಾರ",
            "മലയാളം": "AI സാമ്പത്തിക ഉപദേശകൻ",
            "ਪੰਜਾਬੀ": "ਏਆਈ ਵਿੱਤੀ ਸਲਾਹਕਾਰ"
        }[currentLanguage] || "AI Financial Advisor",
        clearBtn: {
            English: "Clear", "हिंदी": "साफ़", "తెలుగు": "క్లియర్", "தமிழ்": "நீக்கு", "मराठी": "साफ करा", "বাংলা": "পরিষ্কার", "ગુજરાતી": "સાફ કરો", "ಕನ್ನಡ": "ಅಳಿಸಿ", "മലയാളം": "മാറ്റുക", "ਪੰਜਾਬੀ": "ਸਾਫ਼"
        }[currentLanguage] || "Clear",
        statusOnline: {
            English: "Online"
        }[currentLanguage] || "Online ",
        inputPlaceholder: {
            English: "Ask your financial advisor...", "हिंदी": "वित्तीय सलाहकार से पूछें...", "తెలుగు": "ఆర్థిక సలహాదారుని అడగండి...", "ಕನ್ನಡ": "ಆರ್ಥಿಕ ಸಲಹೆಗಾರರನ್ನು ಕೇಳಿ..."
        }[currentLanguage] || "Ask your financial advisor...",
        analyzingMetrics: {
            English: "Analyzing metrics...", "हिंदी": "गणना कर रहा हूँ...", "తెలుగు": "ఖర్చులను లెక్కిస్తోంది...", "ಕನ್ನಡ": "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..."
        }[currentLanguage] || "Analyzing metrics..."
    };

    const QUICK_QUESTIONS_MAP = {
        English: [
            { icon: "💰", text: "How am I doing?" }, { icon: "📊", text: "Where am I overspending?" },
            { icon: "💡", text: "How to save more?" }, { icon: "📈", text: "SIP advice for me" },
            { icon: "🎯", text: "Make me a budget plan" }, { icon: "🏦", text: "Emergency fund tips" },
            { icon: "🧾", text: "Tax saving tips" }, { icon: "📉", text: "Cut my expenses" }
        ],
        "हिंदी": [
            { icon: "💰", text: "मेरा वित्तीय प्रदर्शन कैसा है?" }, { icon: "📊", text: "मैं कहाँ अधिक खर्च कर रहा हूँ?" },
            { icon: "💡", text: "अधिक बचत कैसे करें?" }, { icon: "📈", text: "मेरे लिए एसआईपी सलाह" },
            { icon: "🎯", text: "एक बजट योजना बनाएं" }, { icon: "🏦", text: "आपातकालीन कोष युक्तियाँ" },
            { icon: "🧾", text: "टैक्स बचाने के उपाय" }, { icon: "📉", text: "मेरे खर्च कम करो" }
        ],
        "తెలుగు": [
            { icon: "💰", text: "నా ఆర్థిక స్థితి ఎలా ఉంది?" }, { icon: "📊", text: "నేను ఎక్కడ ఎక్కువ ఖర్చు చేస్తున్నాను?" },
            { icon: "💡", text: "ఎక్కువ ఎలా ఆదా చేయాలి?" }, { icon: "📈", text: "నా కోసం SIP సలహా" },
            { icon: "🎯", text: "నాకోసం ఒక బడ్జెట్ ప్లాన్ చేయి" }, { icon: "🏦", text: "ఎమర్జెన్సీ ఫండ్ చిట్కాలు" },
            { icon: "🧾", text: "టాక్స్ సేవింగ్ చిట్కాలు" }, { icon: "📉", text: "నా ఖర్చులు తగ్గించు" }
        ],
        "தமிழ்": [
            { icon: "💰", text: "என் நிதி நிலைமை எப்படி உள்ளது?" }, { icon: "📊", text: "நான் எங்கே அதிக செலவு செய்கிறேன்?" },
            { icon: "💡", text: "அதிகம் சேமிப்பது எப்படி?" }, { icon: "📈", text: "எனக்கான SIP ஆலோசனை" },
            { icon: "🎯", text: "பட்ஜெட் திட்டம் ஒன்றை உருவாக்கு" }, { icon: "🏦", text: "அவசரகால நிதி உதவிக்குறிப்புகள்" },
            { icon: "🧾", text: "வரி சேமிப்பு உதவிக்குறிப்புகள்" }, { icon: "📉", text: "என் செலவுகளைக் குறைக்கவும்" }
        ],
        "मराठी": [
            { icon: "💰", text: "माझी आर्थिक स्थिती कशी आहे?" }, { icon: "📊", text: "मी कुठे जास्त खर्च करत आहे?" },
            { icon: "💡", text: "अधिक बचत कशी करावी?" }, { icon: "📈", text: "माझ्यासाठी एसआयपी सल्ला" },
            { icon: "🎯", text: "बजेट प्लॅन तयार करा" }, { icon: "🏦", text: "आणीबाणी निधी टिप्स" },
            { icon: "🧾", text: "कर बचत टिप्स" }, { icon: "📉", text: "माझे खर्च कमी करा" }
        ],
        "বাংলা": [
            { icon: "💰", text: "আমার আর্থিক অবস্থা কেমন?" }, { icon: "📊", text: "আমি কোথায় বেশি খরচ করছি?" },
            { icon: "💡", text: "কীভাবে আরও সঞ্চয় করব?" }, { icon: "📈", text: "আমার জন্য এসআইপি পরামর্শ" },
            { icon: "🎯", text: "একটি বাজেট পরিকল্পনা করুন" }, { icon: "🏦", text: "জরুরী তহবিল টিপস" },
            { icon: "🧾", text: "কর সাশ্রয় টিপস" }, { icon: "📉", text: "আমার খরচ কমান" }
        ],
        "ગુજરાતી": [
            { icon: "💰", text: "મારી આર્થિક સ્થિતિ કેવી છે?" }, { icon: "📊", text: "હું ક્યાં વધારે ખર્ચ કરું છું?" },
            { icon: "💡", text: "વધારે બચત કેવી રીતે કરવી?" }, { icon: "📈", text: "મારા માટે SIP સલાહ" },
            { icon: "🎯", text: "બજેટ પ્લાન બનાવો" }, { icon: "🏦", text: "ઇમરજન્સી ફંડ ટિપ્સ" },
            { icon: "🧾", text: "ટેક્સ બચત ટિપ્સ" }, { icon: "📉", text: "મારો kharch ઓછો કરો" }
        ],
        "ಕನ್ನಡ": [
            { icon: "💰", text: "ನನ್ನ ಆರ್ಥಿಕ ಪರಿಸ್ಥಿತಿ ಹೇಗಿದೆ?" }, { icon: "📊", text: "ನಾನು ಎಲ್ಲಿ ಹೆಚ್ಚು ಖರ್ಚು ಮಾಡುತ್ತಿದ್ದೇನೆ?" },
            { icon: "💡", text: "ಹೆಚ್ಚು ಉಳಿಸುವುದು ಹೇಗೆ?" }, { icon: "📈", text: "ನನಗಾಗಿ SIP ಸಲಹೆ" },
            { icon: "🎯", text: "ಬಜೆಟ್ ಯೋಜನೆ ಸಿದ್ಧಪಡಿಸಿ" }, { icon: "🏦", text: "ತುರ್ತು ನಿಧಿ ಸಲಹೆಗಳು" },
            { icon: "🧾", text: "ತೆರಿಗೆ ಉಳಿತಾಯ ಸಲಹೆಗಳು" }, { icon: "📉", text: "ನನ್ನ ಖರ್ಚುಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿ" }
        ],
        "മലയാളം": [
            { icon: "💰", text: "എന്റെ സാമ്പത്തിക നില എങ്ങനെയുണ്ട്?" }, { icon: "📊", text: "ഞാൻ എവിടെയാണ് അമിതമായി ചിലവഴിക്കുന്നത്?" },
            { icon: "💡", text: "എങ്ങനെ കൂടുതൽ സമ്പാദിക്കാം?" }, { icon: "📈", text: "എനിക്കുള്ള SIP ഉപദേശം" },
            { icon: "🎯", text: "ഒരു ബജറ്റ് പ്ലാൻ ഉണ്ടാക്കുക" }, { icon: "🏦", text: "എമർജൻസി ഫണ്ട് ടിപ്പുകൾ" },
            { icon: "🧾", text: "നികുതി ലാഭിക്കൽ ടിപ്പുകൾ" }, { icon: "📉", text: "എന്റെ ചിലവുകൾ കുറയ്ക്കുക" }
        ],
        "ਪੰਜਾਬੀ": [
            { icon: "💰", text: "ਮੇਰੀ ਵਿੱਤੀ ਸਥਿਤੀ ਕਿਹੋ ਜਿਹੀ ਹੈ?" }, { icon: "📊", text: "ਮੈਂ ਕਿੱਥੇ ਜ਼ਿਆਦਾ ਖਰਚ ਕਰ ਰਿਹਾ ਹਾਂ?" },
            { icon: "💡", text: "ਜ਼ਿਆਦਾ ਬਚਤ ਕਿਵੇਂ ਕਰੀਏ?" }, { icon: "📈", text: "ਮੇਰੇ ਲਈ SIP ਸਲਾਹ" },
            { icon: "🎯", text: "ਇੱਕ ਬਜਟ ਯੋਜਨਾ ਬਣਾਓ" }, { icon: "🏦", text: "ਐਮਰਜੈਂਸੀ ਫੰਡ ਟਿਪਸ" },
            { icon: "🧾", text: "ਟੈਕਸ ਬਚਤ ਟਿਪਸ" }, { icon: "📉", text: "ਮੇਰੇ ਖਰਚੇ ਘਟਾਓ" }
        ]
    };

    const activeQuickQuestions = QUICK_QUESTIONS_MAP[currentLanguage] || QUICK_QUESTIONS_MAP.English;

    useEffect(() => {
        if (!user) return;

        const expQuery = query(collection(db, "expenses"), where("userId", "==", user.uid));
        const incQuery = query(collection(db, "income"), where("userId", "==", user.uid));
        const cardQuery = query(collection(db, "creditcards"), where("userId", "==", user.uid));
        const goalsQuery = query(collection(db, "goals"), where("userId", "==", user.uid));
        const billsQuery = query(collection(db, "bills"), where("userId", "==", user.uid));

        const unsub1 = onSnapshot(expQuery, snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsub2 = onSnapshot(incQuery, snap => setIncomes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubCards = onSnapshot(cardQuery, snap => setCards(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubGoals = onSnapshot(goalsQuery, snap => setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubBills = onSnapshot(billsQuery, snap => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        // Real-time listener for profile picture updates
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

        const fetchStaticSettings = async () => {
            try {
                const bSnap = await getDoc(doc(db, "budgets", user.uid));
                if (bSnap.exists() && bSnap.data().totalBudget) setBudget(bSnap.data().totalBudget);

                const eSnap = await getDoc(doc(db, "emergency", user.uid));
                if (eSnap.exists()) setEmergencyData(eSnap.data());
            } catch (err) { console.error(err); }
        };

        fetchStaticSettings();

        return () => {
            unsub1(); unsub2(); unsubCards(); unsubGoals(); unsubBills(); unsubSettings();
        };
    }, [user]);

    useEffect(() => {
        if (user && displayName) {
            const dynamicGreetings = {
                English: `Hi **${displayName}**! 👋 I'm your personal **AI Financial Advisor**.\n\nI can help you with:\n\n• 💰 Spending analysis & insights\n• 📊 Budget planning\n• 📈 SIP & investment advice\n• 🏦 EMI calculations\n• 🎯 Savings goals\n• 🧾 Tax saving (80C, 80D, HRA)\n\nWhat would you like to explore today?`,
                "हिंदी": `नमस्ते **${displayName}**! 👋 मैं आपका व्यक्तिगत **एआई वित्तीय सलाहकार** हूँ।\n\nमैं खर्चों के विश्लेषण, बजट योजना, निवेश सलाह, बचत लक्ष्यों और टैक्स बचत के बारे में आपकी सहायता कर सकता हूँ। आप आज क्या जानना चाहते हैं?`,
                "తెలుగు": `నమస్తే **${displayName}**! 👋 నేను మీ వ్యక్తిగత **AI ఫైనాన్షియల్ అడ్వైజర్**.\n\nనేను మీ ఖర్చుల విశ్లేషణ, బడ్జెట్ ప్రణాళిక, ఇన్వెస్ట్‌మెంట్ సలహాలు, పొదుపు లక్ష్యాలు మరియు టాక్స్ సేవింగ్స్‌లో సహాయం చేయగలను. ఈరోజు మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?`,
                "தமிழ்": `வணக்கம் **${displayName}**! 👋 நான் உங்கள் தனிப்பட்ட **AI நிதி ஆலோசகர்**.\n\nஉங்கள் செலவு பகுப்பாய்வு, பட்ஜெட் திட்டமிடல், முதலீட்டு ஆலோசனைகள் மற்றும் வரி சேமிப்பு ஆகியவற்றிற்கு நான் உதவ முடியும். இன்று நீங்கள் என்ன ஆராய விரும்புகிறீர்கள்?`,
                "मराठी": `नमस्कार **${displayName}**! 👋 मी तुमचा वैयक्तिक **एआय आर्थिक सल्लागार** आहे.\n\nमी तुम्हाला खर्च विश्लेषण, बजेट नियोजन,गुंतवणूक आणि कर बचतीमध्ये मदत करू शकतो. आज तुम्हाला काय जाणून घ्यायचे आहे?`,
                "বাংলা": `নমস্কার **${displayName}**! 👋 আমি আপনার ব্যক্তিগত **এআই আর্থিক উপদেষ্টা**।\n\nআমি আপনার ব্যয় বিশ্লেষণ, বাজেট পরিকল্পনা, বিনিয়োগ এবং কর সাশ্রয় সংক্রান্ত বিষয়ে সহায়তা করতে পারি। আজ আপনি কী জানতে চান?`,
                "ગુજરાતી": `નમસ્તે **${displayName}**! 👋 હું તમારો અંગત **એઆઈ નાણાકીય સલાહકાર** છું.\n\nહું તમને ખર્ચ વિશ્લેષણ, બજેટ આયોજન, રોકાણની સલાહ અને ટેક્સ બચતમાં મદદ કરી શકું છું. આજે તમે શું જાણવા માંગો છો?`,
                "ಕನ್ನಡ": `ನಮಸ್ತೆ **${displayName}**! 👋 ನಾನು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ **AI ಹಣಕಾಸು ಸಲಹೆಗಾರ**.\n\nನಾನು ನಿಮಗೆ ಖರ್ಚು ವಿಶ್ಲೇಷಣೆ, ಬಜೆಟ್ ಯೋಜನೆ, ಹೂಡಿಕೆ ಸಲಹೆ ಮತ್ತು ತೆರಿಗೆ ಉಳಿತಾಯದಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನೀವು ಏನನ್ನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?`,
                "മലയാളം": `നമസ്കാരം **${displayName}**! 👋 ഞാൻ നിങ്ങളുടെ വ്യക്തിഗത **AI സാമ്പത്തിക ഉപദേശകൻ** ആണ്.\n\nനിങ്ങളുടെ ചെലവ് വിശകലനം, ബജറ്റ് ആസൂത്രണം, നിക്ഷേപ ഉപദേശങ്ങൾ എന്നിവയിൽ എനിക്ക് സഹായിക്കാനാകും. ഇന്ന് നിങ്ങൾക്ക് എന്താണ് അറിയേണ്ടത്?`,
                "ਪੰਜਾਬੀ": `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ **${displayName}**! 👋 ਮੈਂ ਤੁਹਾਡਾ ਨਿੱਜੀ **ਏਆਈ ਵਿੱਤੀ ਸਲਾਹਕਾਰ** ਹਾਂ।\n\nਮੈਂ ਖਰਚਿਆਂ ਦੇ ਵਿਸ਼ਲੇਸ਼ਣ, ਬਜਟ ਯੋਜਨਾਬੰਦੀ, ਨਿਵੇਸ਼ ਸਲਾਹ ਅਤੇ ਟੈਕਸ ਬਚਤ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਅੱਜ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
                Français: `Bonjour **${displayName}** ! 👋 Je suis votre **conseiller financier IA** personnel.\n\nJe peux vous aider à analyser vos dépenses, planifier votre budget, simuler des placements et réduire vos impôts. Que souhaitez-vous explorer aujourd'hui ?`,
                Español: `¡Hola **${displayName}**! 👋 Soy tu **Asesor Financiero de IA** personal.\n\nPuedo ayudarte con el análisis de gastos, planificación de presupuestos, consejos de inversión SIP y ahorro de impuestos. ¿Qué te gustaría explorar hoy?`,
                Deutsch: `Hallo **${displayName}**! 👋 Ich bin Ihr persönlicher **KI-Finanzberater**.\n\nIch kann Ihnen bei der Ausgabenanalyse, Budgetplanung, SIP-Anlageberatung und beim Steuersparen helfen. Was möchten Sie heute auswerten?`,
                "العربية": `مرحباً **${displayName}**! 👋 أنا **مستشارك المالي الذكي** الشخصي.\n\nيمكنني مساعدتك في تحليل النفقات، تخطيط الميزانية، خطط الاستثمار وتوفير الضرائب. ما الذي ترغب في استكشافه اليوم؟`
            };

            const clearConfirmations = {
                English: "Fresh start — what would you like to know?",
                "हिंदी": "एक नई शुरुआत — आप क्या जानना चाहते हैं?",
                "తెలుగు": "కొత్త ప్రారంభం — మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
                "தமிழ்": "புதிய தொடக்கம் — நீங்கள் என்ன அறிய விரும்புகிறீர்கள்?",
                "मराठी": "नवीन सुरुवात — तुम्हाला काय जाणून घ्यायचे आहे?",
                "বাংলা": "নতুন শুরু — আপনি কী জানতে চান?",
                "ગુજરાતી": "નવી શરૂઆત — તમે શું જાણવા માંગો છો?",
                "ಕನ್ನಡ": "ಹೊಸ ಆರಂಭ — ನೀವು ಏನನ್ನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?",
                "മലയാളം": "പുതിയ തുടക്കം — നിങ്ങൾക്ക് എന്താണ് അറിയേണ്ടത്?",
                "ਪੰਜਾਬੀ": "ਨਵੀਂ ਸ਼ੁਰੂਆਤ — ਤੁਸੀਂ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
                Français: "Nouveau départ — que voulez-vous savoir ?",
                Español: "Un nuevo comienzo — ¿qué te gustaría saber?",
                Deutsch: "Neustart — was möchten Sie wissen?",
                "العربية": "بداية جديدة — ما الذي تود معرفته؟"
            };

            window.__aiFreshGreeting = dynamicGreetings[currentLanguage] || dynamicGreetings.English;
            window.__aiClearText = clearConfirmations[currentLanguage] || clearConfirmations.English;

            setMessages([{
                role: "assistant",
                content: dynamicGreetings[currentLanguage] || dynamicGreetings.English,
                time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            }]);
        }
    }, [user, displayName, currentLanguage]);

    useEffect(() => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, [messages, isTyping]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 400);
    }, [open]);

    const getFinancialContext = () => {
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
        const savings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;
        const budgetUsed = budget > 0 ? ((totalExpenses / budget) * 100).toFixed(1) : 0;

        const categoryBreakdown = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
            return acc;
        }, {});
        const categoryDetails = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => `- ${cat}: Rs.${amt.toLocaleString("en-IN")} (${totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : 0}%)`)
            .join("\n");

        const recentExpenses = expenses.slice(0, 5).map(e =>
            `- ${e.category}: Rs.${e.amount} on ${new Date(e.date).toLocaleDateString("en-IN")}${e.description ? ` (${e.description})` : ""}`
        ).join("\n");

        const cardDetails = cards.map(c => {
            const util = c.limit > 0 ? ((c.used / c.limit) * 100).toFixed(0) : 0;
            return `- ${c.cardName} (${c.bank}): Used ₹${c.used.toLocaleString("en-IN")}/₹${c.limit.toLocaleString("en-IN")} (${util}% Used) | Due: ₹${c.dueAmount.toLocaleString("en-IN")} on ${new Date(c.dueDate).toLocaleDateString("en-IN")}`;
        }).join("\n");

        const emergencyDetails = emergencyData
            ? `- Saved: ₹${emergencyData.saved.toLocaleString("en-IN")} / Target: ₹${emergencyData.target.toLocaleString("en-IN")} (Covers ${(emergencyData.saved / emergencyData.monthlyExpense).toFixed(1)} months)`
            : "No emergency fund milestones initialized yet.";

        const goalDetails = goals.map(g => {
            const comp = g.target > 0 ? ((g.saved / g.target) * 100).toFixed(0) : 0;
            return `- ${g.icon} ${g.name}: Saved ₹${g.saved.toLocaleString("en-IN")}/₹${g.target.toLocaleString("en-IN")} (${comp}% Achieved)`;
        }).join("\n");

        const billDetails = bills.map(b => {
            const today = new Date();
            const due = new Date(b.dueDate);
            const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            const status = diffDays < 0 ? "OVERDUE" : `${diffDays} days left`;
            return `- ${b.name} (${b.category}): ₹${b.amount.toLocaleString("en-IN")} | Status: ${status}`;
        }).join("\n");

        return `
USER: ${displayName} | Regional India Data Focus Context
BUDGET CAPACITY: Rs.${budget.toLocaleString("en-IN")} | RUNWAY METRIC USED: ${budgetUsed}%
CASH FLOW MATRIX: Income Rs.${totalIncome.toLocaleString("en-IN")} | Expenses Rs.${totalExpenses.toLocaleString("en-IN")}
NET SURPLUS REVENUE: Rs.${savings.toLocaleString("en-IN")} (${savingsRate}%)
CREDIT CARD UNIONS:\n${cardDetails || "No active lines."}
EMERGENCY RESERVE MILITARY PROFILE:\n${emergencyDetails}
FINANCIAL GOALS MATRICES:\n${goalDetails || "No asset tracking routes initialized."}
UPCOMING INVOICES & OUTSTANDING BILLS:\n${billDetails || "Clean history context."}
SPENDING DISTRIBUTION BY SECTOR:\n${categoryDetails || "Empty profile ledger."}
RECENT ACCOUNT ACTIVITY LOGS:\n${recentExpenses || "No base transactions saved."}`;
    };

    const sendMessage = async (messageText) => {
        const text = (messageText || input).trim();
        if (!text || loading) return;
        setMessages(prev => [...prev, {
            role: "user", content: text,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        }]);
        setInput("");
        setLoading(true);
        setIsTyping(true);
        try {
            const systemPrompt = `You are an expert personal finance advisor for the Spendly tracking application.

USER METRICS SIGNATURE DATA ACCOUNT ANALYSIS PROFILE:
${getFinancialContext()}

MANDATORY RESPONSE CONFIGURATIONS:
- Balance metrics seamlessly within conversational paragraphs.
- Inject calculation numbers using bold markup indicators (**value**).
- Keep text direct, punchy, and thoroughly accurate. Limit words constraint: 200 words.
- ABSOLUTE TARGET VOCABULARY LANGUAGE LAW: You MUST write your complete assessment and reply fully in the specific target language requested below. Never alternate back to English vocabulary layout grids.
- RUNTIME TARGET LANGUAGE EXCLUSIVE REQUIREMENT: "${currentLanguage}"`;

            const conversationHistory = messages.slice(-8).map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content
            }));

            if (!OPENROUTER_API_KEY) {
                throw new Error("Missing client authorization signature variables inside active client files.");
            }

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://spendly.app",
                    "X-Title": "Spendly AI"
                },
                body: JSON.stringify({
                    model: "openrouter/auto",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...conversationHistory,
                        { role: "user", content: text }
                    ],
                    max_tokens: 1024,
                    temperature: 0.65,
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || `Error ${response.status}`);
            const aiText = data.choices?.[0]?.message?.content;
            if (!aiText) throw new Error("No response");

            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: "assistant", content: aiText,
                time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            }]);
        } catch (err) {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `❌ Error: ${err.message}`,
                time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            }]);
        }
        setLoading(false);
    };

    if (!user) return null;

    return (
        <>
            <style>{`
                .ai-trigger-wrapper { position: fixed; bottom: 100px; right: 24px; z-index: 9998; }
                .ai-trigger-relative { position: relative; display: flex; align-items: center; justify-content: center; }
                .ai-main-glow-btn { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 3; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4); font-size: 26px; overflow: hidden; padding: 0; }
                .ai-label-pill { position: absolute; right: 80px; background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); padding: 8px 16px; border-radius: 20px; white-space: nowrap; color: #ffffff; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.25); display: flex; align-items: center; z-index: 2; pointer-events: none; }
                .ai-pill-arrow-tip { position: absolute; right: -4px; top: 50%; transform: translateY(-50%) rotate(45deg); width: 10px; height: 10px; background: #CE44BC; border-radius: 2px; }
                .ai-ambient-ring { position: absolute; border-radius: 50%; background: transparent; z-index: 1; pointer-events: none; }
                .ai-ambient-ring.layer-1 { width: 78px; height: 78px; border: 1.5px solid rgba(124, 58, 237, 0.15); background: rgba(124, 58, 237, 0.02); }
                .ai-ambient-ring.layer-2 { width: 92px; height: 92px; border: 1px solid rgba(124, 58, 237, 0.08); }
                body.dark-mode .ai-ambient-ring.layer-1 { border-color: rgba(167, 139, 250, 0.25); background: rgba(167, 139, 250, 0.03); }
                body.dark-mode .ai-ambient-ring.layer-2 { border-color: rgba(167, 139, 250, 0.12); }
            `}</style>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(2px)", zIndex: 9990 }}
                            onClick={() => setOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.7, y: 60, x: 20 }} animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.7, y: 60, x: 20 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            style={{
                                position: "fixed", bottom: 100, right: 20, width: 380, height: 560,
                                background: "var(--card-bg)", borderRadius: 28,
                                boxShadow: "0 32px 80px rgba(124,58,237,0.3), 0 8px 32px rgba(0,0,0,0.2)",
                                zIndex: 9999, display: "flex", flexDirection: "column",
                                overflow: "hidden", border: "1px solid rgba(124,58,237,0.2)",
                            }}>

                            {/* Top Dynamic Header Bar */}
                            <div style={{ position: "relative", background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #EC4899 100%)", padding: "18px 18px 16px", flexShrink: 0, overflow: "hidden" }}>
                                {[
                                    { size: 80, top: -30, right: -20, opacity: 0.12 },
                                    { size: 50, top: 10, right: 60, opacity: 0.08 },
                                    { size: 40, bottom: -20, left: 30, opacity: 0.1 },
                                ].map((c, i) => (
                                    <motion.div key={i}
                                        animate={{ scale: [1, 1.1, 1], opacity: [c.opacity, c.opacity * 1.5, c.opacity] }}
                                        transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                                        style={{ position: "absolute", width: c.size, height: c.size, borderRadius: "50%", background: "white", top: c.top, right: c.right, bottom: c.bottom, left: c.left, opacity: c.opacity }} />
                                ))}

                                <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
                                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, backdropFilter: "blur(10px)", border: "2px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>🤖</motion.div>

                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: "white", fontWeight: 800, fontSize: 15, letterSpacing: 0.3, margin: 0, fontFamily: 'Poppins', lineHeight: '1.4' }}>
                                            {UI_LABELS.headerTitle}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                            <motion.div animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                                                style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                                            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11.5, fontWeight: 500, margin: 0, fontFamily: 'Poppins' }}>{UI_LABELS.statusOnline}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <motion.button whileTap={{ scale: 0.9 }}
                                            onClick={() => setMessages([{ role: "assistant", content: window.__aiFreshGreeting || "Fresh start!", time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }])}
                                            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "5px 12px", color: "white", cursor: "pointer", fontSize: 11.5, fontFamily: "Poppins", fontWeight: 600, backdropFilter: "blur(10px)" }}>
                                            🗑️ {UI_LABELS.clearBtn}
                                        </motion.button>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpen(false)}
                                            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>✕</motion.button>
                                    </div>
                                </div>
                            </div>

                            {/* Horizontal Quick Actions List */}
                            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none", flexShrink: 0, background: "var(--card-bg)" }}>
                                {activeQuickQuestions.map((q, i) => (
                                    <motion.button key={i} onClick={() => sendMessage(q.text)} disabled={loading}
                                        whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid var(--border)", background: "var(--background)", color: "var(--text-secondary)", fontFamily: "Poppins", fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
                                        <span>{q.icon}</span>
                                        <span>{q.text}</span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Main Chat Conversation Space */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, background: "var(--background)" }}>
                                {messages.map((msg, index) => (
                                    <motion.div key={index} initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.05 }}
                                        style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>

                                        {msg.role === "assistant" && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>🤖</motion.div>
                                        )}

                                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}
                                            style={{
                                                maxWidth: "80%", padding: "12px 15px",
                                                borderRadius: msg.role === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                                                background: msg.role === "user" ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "var(--card-bg)",
                                                color: msg.role === "user" ? "white" : "var(--text-primary)",
                                                boxShadow: msg.role === "user" ? "0 6px 20px rgba(124,58,237,0.4)" : "0 2px 16px rgba(0,0,0,0.08)",
                                                border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                                            }}>
                                            {msg.role === "assistant" ? <FormattedMessage content={msg.content} /> : <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0, fontFamily: 'Poppins' }}>{msg.content}</p>}
                                            <p style={{ fontSize: 10, opacity: 0.45, marginTop: 6, textAlign: "right", letterSpacing: 0.3, fontFamily: 'Poppins' }}>{msg.time}</p>
                                        </motion.div>

                                        {msg.role === "user" && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6D28D9,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, fontWeight: 700, color: "white", boxShadow: "0 2px 8px rgba(109,40,217,0.3)", fontFamily: 'Poppins', overflow: 'hidden' }}>
                                                {profilePic ? (
                                                    <img src={profilePic} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    displayName?.charAt(0).toUpperCase() || "U"
                                                )}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}

                                <AnimatePresence>
                                    {isTyping && (
                                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                            style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>🤖</div>
                                            <div style={{ background: "var(--card-bg)", padding: "14px 18px", borderRadius: "20px 20px 20px 5px", border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", display: "flex", gap: 5, alignItems: "center" }}>
                                                {[0, 1, 2].map(i => (
                                                    <motion.div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}
                                                        animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }} />
                                                ))}
                                                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 6, fontFamily: 'Poppins', fontWeight: 500 }}>
                                                    {UI_LABELS.analyzingMetrics}
                                                </motion.span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* User Input Submission Bar */}
                            <motion.div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center", flexShrink: 0, background: "var(--card-bg)" }}>
                                <div style={{ flex: 1, position: "relative" }}>
                                    <input ref={inputRef} type="text"
                                        placeholder={UI_LABELS.inputPlaceholder}
                                        value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === "Enter" && !loading && sendMessage()} disabled={loading}
                                        style={{ width: "100%", padding: "12px 16px", borderRadius: 24, border: "2px solid var(--border)", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                                        onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(124, 58, 237, 0.1)"; }}
                                        onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                                </div>

                                <motion.button onClick={() => sendMessage()} disabled={loading || !input.trim()} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88, rotate: 5 }}
                                    style={{ width: 46, height: 46, borderRadius: "50%", background: input.trim() && !loading ? "var(--gradient)" : "var(--border)", border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: input.trim() && !loading ? "0 6px 16px rgba(124,58,237,0.45)" : "none", transition: "all 0.3s ease" }}>
                                    {loading ? (
                                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "inline-block" }}>
                                            ⏳
                                        </motion.span>
                                    ) : (
                                        "🚀"
                                    )}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Core Global Floating Launcher Wrapper Button */}
            <div className="ai-trigger-wrapper">
                <div className="ai-trigger-relative">
                    {!open && (
                        <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="ai-label-pill">
                            <span style={{ fontFamily: 'Poppins' }}>{UI_LABELS.headerTitle}</span>
                            <div className="ai-pill-arrow-tip"></div>
                        </motion.div>
                    )}

                    <motion.button className="ai-main-glow-btn" onClick={() => setOpen(!open)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                        animate={open ? { rotate: 0 } : { y: [0, -4, 0] }} transition={open ? {} : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                        <motion.span animate={{ rotate: open ? 180 : 0, scale: open ? 0.85 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                            {open ? "✕" : "🤖"}
                        </motion.span>
                    </motion.button>

                    {!open && (
                        <>
                            <div className="ai-ambient-ring layer-1"></div>
                            <div className="ai-ambient-ring layer-2"></div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default FloatingAI;