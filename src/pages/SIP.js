import React, { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SIP = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [monthly, setMonthly] = useState("");
    const [rate, setRate] = useState("");
    const [years, setYears] = useState("");
    const [result, setResult] = useState(null);

    // 3. COMPREHENSIVE MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const sipLabels = {
        title: { English: "SIP Calculator", "हिंदी": "एसआईपी कैलकुलेटर", "తెలుగు": "SIP క్యాలిక్యులేటర్", "ಕನ್ನಡ": "SIP ಕ್ಯಾಲ್ಕುಲೇಟರ್", "മലയാളം": "SIP കാൽക്കുലേറ്റർ" }[currentLanguage] || "SIP Calculator",
        monthlyInvestment: { English: "Monthly Investment (₹)", "हिंदी": "मासिक निवेश (₹)", "తెలుగు": "నెలవారీ పెట్టుబడి (₹)", "ಕನ್ನಡ": "ಮಾಸಿಕ ಹೂಡಿಕೆ (₹)", "മലയാളം": "പ്രതിമാസ നിക്ഷേപം (₹)" }[currentLanguage] || "Monthly Investment (₹)",
        expectedReturn: { English: "Expected Annual Return (%)", "हिंदी": "अपेक्षित वार्षिक रिटर्न (%)", "తెలుగు": "ఆశించిన వార్షిక రిటర్న్ (%)", "ಕನ್ನಡ": "ನಿರೀಕ್ಷಿತ ವಾರ್ಷಿಕ ಆದಾಯ (%)", "മലയാളം": "പ്രതീക്ഷിക്കുന്ന വാർഷിക വരുമാനം (%)" }[currentLanguage] || "Expected Annual Return (%)",
        timePeriod: { English: "Time Period (Years)", "हिंदी": "समय अवधि (वर्ष)", "తెలుగు": "కాల వ్యవధి (సంవత్సరాలు)", "ಕನ್ನಡ": "ಸಮಯದ ಅವಧಿ (ವರ್ಷಗಳು)", "മലയാളം": "കാലയളവ് (വർഷങ്ങൾ)" }[currentLanguage] || "Time Period (Years)",
        calculateBtn: { English: "Calculate Returns 📈", "हिंदी": "रिटर्न की गणना करें 📈", "తెలుగు": "రిటర్న్స్ లెక్కించు 📈", "ಕನ್ನಡ": "ಆದಾಯ ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ 📈", "മലയാളം": "റിട്ടേൺസ് കണക്കാക്കുക 📈" }[currentLanguage] || "Calculate Returns 📈",
        totalInvested: { English: "Total Invested", "हिंदी": "कुल निवेशित राशि", "తెలుగు": "మొత్తం పెట్టుబడి", "ಕನ್ನಡ": "ಒಟ್ಟು ಹೂಡಿಕೆ", "മലയാളം": "ആകെ നിക്ഷേപിച്ചത്" }[currentLanguage] || "Total Invested",
        estReturns: { English: "Est. Returns", "हिंदी": "अनुमानित रिटर्न", "తెలుగు": "అంచనా రిటర్న్స్", "ಕನ್ನಡ": "ನಿರೀಕ್ಷಿತ ಆದಾಯ", "മലയാളം": "പ്രതീക്ഷിക്കുന്ന റിട്ടേൺസ്" }[currentLanguage] || "Est. Returns",
        maturityValue: { English: "Total Value at Maturity", "हिंदी": "परिपक्वता पर कुल मूल्य", "తెలుగు": "మెచ్యూరిటీ వద్ద మొత్తం విలువ", "ಕನ್ನಡ": "ಮೆಚ್ಯೂರಿಟಿ ಮುಕ್ತಾಯದ ಒಟ್ಟು ಮೌಲ್ಯ", "മലയാളം": "മെച്യൂരിറ്റിയിലെ ആകെ മൂല്യം" }[currentLanguage] || "Total Value at Maturity",
        growthChartTitle: { English: "Growth Chart", "हिंदी": "विकास चार्ट", "తెలుగు": "వృద్ధి చార్ట్", "ಕನ್ನಡ": "ಬೆಳವಣಿಗೆಯ ಚಾರ್ಟ್", "മലയാളം": "വളർച്ചാ ചാർട്ട്" }[currentLanguage] || "Growth Chart",
        placeholderAmt: { English: "e.g. 5000", "हिंदी": "जैसे: 5000", "తెలుగు": "ఉదా: 5000", "ಕನ್ನಡ": "ಉದಾ: 5000" }[currentLanguage] || "e.g. 5000",
        placeholderRate: { English: "e.g. 12", "हिंदी": "जैसे: 12", "తెలుగు": "ఉదా: 12", "ಕನ್ನಡ": "ಉದಾ: 12" }[currentLanguage] || "e.g. 12",
        placeholderYears: { English: "e.g. 10", "हिंदी": "जैसे: 10", "తెలుగు": "ఉదా: 10", "ಕನ್ನಡ": "ಉದಾ: 10" }[currentLanguage] || "e.g. 10",
        yearXAxis: { English: "Yr", "हिंदी": "वर्ष", "తెలుగు": "సంవత్సరం", "ಕನ್ನಡ": "ವರ್ಷ", "മലയാളം": "വർഷം" }[currentLanguage] || "Yr"
    };

    // 4. MATHEMATICAL CALCULATION & GRID GENERATION ENGINE
    const calculate = () => {
        const P = Number(monthly);
        const r = Number(rate) / 12 / 100;
        const n = Number(years) * 12;

        if (!P || !rate || !years) return;

        const amount = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        const invested = P * n;
        const returns = amount - invested;

        const chartData = [];
        for (let y = 1; y <= Number(years); y++) {
            const months = y * 12;
            const val = P * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
            chartData.push({
                year: `${sipLabels.yearXAxis} ${y}`,
                [sipLabels.totalInvested]: P * months,
                [sipLabels.maturityValue]: Math.round(val),
            });
        }
        setResult({ amount: Math.round(amount), invested, returns: Math.round(returns), chartData });
    };

    return (
        <div className={`sip-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={sipLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Avoids broken line spacing collisions in Indic scripts */}
                <style>{`
                    .card h3, .card p, .btn-primary, label { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Input Workspace Card */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 20, color: "var(--text-primary)" }}>{sipLabels.title}</h3>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{sipLabels.monthlyInvestment}</label>
                        <input type="number" placeholder={sipLabels.placeholderAmt} value={monthly} onChange={e => setMonthly(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{sipLabels.expectedReturn}</label>
                        <input type="number" placeholder={sipLabels.placeholderRate} value={rate} onChange={e => setRate(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{sipLabels.timePeriod}</label>
                        <input type="number" placeholder={sipLabels.placeholderYears} value={years} onChange={e => setYears(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                    </div>

                    <button className="btn-primary" onClick={calculate} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px" }}>
                        {sipLabels.calculateBtn}
                    </button>
                </motion.div>

                {/* Localized Metric Output Blocks Grid */}
                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                            <div className="card" style={{ textAlign: "center", background: darkMode ? "rgba(91, 33, 182, 0.15)" : "#EDE9FE", border: darkMode ? "1px solid #5B21B6" : "1px solid var(--border)" }}>
                                <p style={{ fontSize: 13, color: darkMode ? "#C4B5FD" : "#5B21B6", marginBottom: 4, marginTop: 0 }}>{sipLabels.totalInvested}</p>
                                <h3 style={{ color: darkMode ? "#C4B5FD" : "#5B21B6", margin: 0, fontSize: 18, fontWeight: 700 }}>₹{result.invested.toLocaleString("en-IN")}</h3>
                            </div>
                            <div className="card" style={{ textAlign: "center", background: darkMode ? "rgba(6, 95, 70, 0.15)" : "#D1FAE5", border: darkMode ? "1px solid #065F46" : "1px solid var(--border)" }}>
                                <p style={{ fontSize: 13, color: darkMode ? "#34D399" : "#065F46", marginBottom: 4, marginTop: 0 }}>{sipLabels.estReturns}</p>
                                <h3 style={{ color: darkMode ? "#34D399" : "#065F46", margin: 0, fontSize: 18, fontWeight: 700 }}>₹{result.returns.toLocaleString("en-IN")}</h3>
                            </div>
                        </div>

                        {/* Combined Maturity Banner Card */}
                        <div className="card" style={{ textAlign: "center", background: "var(--gradient)", color: "white", marginBottom: 16, padding: "20px" }}>
                            <p style={{ opacity: 0.9, marginBottom: 6, marginTop: 0, fontSize: "14px" }}>{sipLabels.maturityValue}</p>
                            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>₹{result.amount.toLocaleString("en-IN")}</h2>
                        </div>

                        {/* Interactive Vector Analytics Graph */}
                        <div className="card">
                            <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{sipLabels.growthChartTitle}</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={result.chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: "Poppins", fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fontFamily: "Poppins", fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(value) => value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`} />
                                    <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(value, name) => [`₹${Number(value).toLocaleString("en-IN")}`, name]} labelStyle={{ fontWeight: 600, color: "var(--text-primary)" }} />
                                    <Legend wrapperStyle={{ fontFamily: "Poppins", fontSize: 12, paddingTop: 8 }} />
                                    <Line type="monotone" dataKey={sipLabels.totalInvested} stroke="#EC4899" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey={sipLabels.maturityValue} stroke="#7C3AED" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default SIP;