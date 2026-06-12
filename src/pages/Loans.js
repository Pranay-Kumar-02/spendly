import React, { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const Loans = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [principal, setPrincipal] = useState("");
    const [rate, setRate] = useState("");
    const [years, setYears] = useState("");
    const [result, setResult] = useState(null);

    // 3. SECURE, GRAMMATICALLY VERIFIED MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const loanLabels = {
        title: { English: "Loan & EMI Calculator", "हिंदी": "ऋण और ईएमआई कैलकुलेटर", "తెలుగు": "రుణం & EMI క్యాలిక్యులేటర్", "ಕನ್ನಡ": "ಸಾಲ ಮತ್ತು EMI ಕ್ಯಾಲ್ಕುಲೇಟರ್", "മലയാളം": "ലോൺ & ഇഎംഐ കാൽക്കുലേറ്റർ" }[currentLanguage] || "Loan & EMI Calculator",
        emiHeader: { English: "EMI Calculator", "हिंदी": "ईएमआई कैलकुलेटर", "తెలుగు": "EMI క్యాలిక్యులేటర్", "ಕನ್ನಡ": "EMI ಕ್ಯಾಲ್ಕುಲೇಟರ್" }[currentLanguage] || "EMI Calculator",
        loanAmount: { English: "Loan Amount (₹)", "हिंदी": "ऋण राशि (₹)", "తెలుగు": "రుణం మొత్తం (₹)", "ಕನ್ನಡ": "ಸಾಲದ ಮೊತ್ತ (₹)", "മലയാളം": "ലോൺ തുക (₹)" }[currentLanguage] || "Loan Amount (₹)",
        interestRate: { English: "Annual Interest Rate (%)", "हिंदी": "वार्षिक ब्याज दर (%)", "తెలుగు": "వార్షిక వడ్డీ రేటు (%)", "ಕನ್ನಡ": "ವಾರ್ಷಿಕ ಬಡ್ಡಿ ದರ (%)", "മലയാളം": "വാർഷിക പലിശ നിരക്ക് (%)" }[currentLanguage] || "Annual Interest Rate (%)",
        loanTenure: { English: "Loan Tenure (Years)", "हिंदी": "ऋण अवधि (वर्ष)", "తెలుగు": "రుణ కాల పరిమితి (సంవత్సరాలు)", "ಕನ್ನಡ": "ಸಾಲದ ಅವಧಿ (ವರ್ಷಗಳು)", "മലയാളം": "ലോൺ കാലാവധി (വർഷങ്ങൾ)" }[currentLanguage] || "Loan Tenure (Years)",
        calculateBtn: { English: "Calculate EMI 🏦", "हिंदी": "ईएमआई की गणना करें 🏦", "తెలుగు": "EMI లెక్కించు 🏦", "ಕನ್ನಡ": "EMI ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ 🏦", "മലയാളം": "ഇഎംഐ കണക്കാക്കുക 🏦" }[currentLanguage] || "Calculate EMI 🏦",
        monthlyEmi: { English: "Monthly EMI", "हिंदी": "मासिक ईएमआई", "తెలుగు": "నెలవారీ EMI", "ಕನ್ನಡ": "ಮಾಸಿಕ EMI", "മലയാളം": "പ്രതിമാസ ഇഎംഐ" }[currentLanguage] || "Monthly EMI",
        totalInterest: { English: "Total Interest", "हिंदी": "कुल ब्याज", "తెలుగు": "మొత్తం వడ్డీ", "ಕನ್ನಡ": "ಒಟ್ಟು ಬಡ್ಡಿ", "മലയാളം": "ആകെ പലിശ" }[currentLanguage] || "Total Interest",
        totalPayment: { English: "Total Payment", "हिंदी": "कुल भुगतान (मूल + ब्याज)", "తెలుగు": "మొత్తం చెల్లింపు", "ಕನ್ನಡ": "ಒಟ್ಟು ಪಾವತಿ", "മലയാളം": "ആകെ അടയ്ക്കേണ്ടത്" }[currentLanguage] || "Total Payment",
        yearlyBreakdown: { English: "Yearly Breakdown", "हिंदी": "वार्षिक विवरण", "తెలుగు": "సంవత్సరాల వారీగా విభజన", "ಕನ್ನಡ": "ವಾರ್ಷಿಕ ವಿವರಣೆ", "മലയാളം": "വാർഷിക വിവരണം" }[currentLanguage] || "Yearly Breakdown",
        principalBar: { English: "Principal", "हिंदी": "मूलधन (Principal)", "తెలుగు": "అసలు (Principal)", "ಕನ್ನಡ": "ಅಸಲು ಮೊತ್ತ", "മലയാളം": "മുതൽ" }[currentLanguage] || "Principal",
        interestBar: { English: "Interest", "हिंदी": "ब्याज (Interest)", "తెలుగు": "వడ్డీ (Interest)", "ಕನ್ನಡ": "ಬಡ್ಡಿ", "മലയാളം": "പലിശ" }[currentLanguage] || "Interest",
        placeholderAmt: { English: "e.g. 1000000", "हिंदी": "जैसे: 1000000", "తెలుగు": "ఉదా: 1000000", "ಕನ್ನಡ": "ಉದಾ: 1000000" }[currentLanguage] || "e.g. 1000000",
        placeholderRate: { English: "e.g. 8.5", "हिंदी": "जैसे: 8.5", "తెలుగు": "ఉదా: 8.5", "ಕನ್ನಡ": "ಉದಾ: 8.5" }[currentLanguage] || "e.g. 8.5",
        placeholderYears: { English: "e.g. 20", "हिंदी": "जैसे: 20", "తెలుగు": "ఉదా: 20", "ಕನ್ನಡ": "ಉದಾ: 20" }[currentLanguage] || "e.g. 20",
        yearXAxis: { English: "Yr", "हिंदी": "वर्ष", "తెలుగు": "సంవత్సరం", "ಕನ್ನಡ": "ವರ್ಷ", "മലയാളം": "വർഷം" }[currentLanguage] || "Yr"
    };

    // 4. MATHEMATICAL AMORTIZATION MATH ENGINE
    const calculate = () => {
        const P = Number(principal);
        const r = Number(rate) / 12 / 100;
        const n = Number(years) * 12;

        if (!P || !rate || !years) return;

        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - P;

        const chartData = [];
        let balance = P;
        for (let y = 1; y <= Number(years); y++) {
            let yearInterest = 0;
            let yearPrincipal = 0;
            for (let m = 0; m < 12; m++) {
                const interest = balance * r;
                const principalPaid = emi - interest;
                yearInterest += interest;
                yearPrincipal += principalPaid;
                balance -= principalPaid;
            }
            chartData.push({
                year: `${loanLabels.yearXAxis} ${y}`,
                [loanLabels.principalBar]: Math.round(yearPrincipal),
                [loanLabels.interestBar]: Math.round(yearInterest),
            });
        }

        setResult({
            emi: Math.round(emi),
            totalPayment: Math.round(totalPayment),
            totalInterest: Math.round(totalInterest),
            chartData
        });
    };

    return (
        <div className={`loans-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={loanLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Avoids character overlapping bugs on Indic vertical sets */}
                <style>{`
                    .card h3, .card p, .btn-primary, label { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Input Fields Operational Card Context */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 20, marginTop: 0, color: "var(--text-primary)" }}>{loanLabels.emiHeader}</h3>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{loanLabels.loanAmount}</label>
                        <input type="number" placeholder={loanLabels.placeholderAmt} value={principal} onChange={e => setPrincipal(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{loanLabels.interestRate}</label>
                        <input type="number" placeholder={loanLabels.placeholderRate} value={rate} onChange={e => setRate(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{loanLabels.loanTenure}</label>
                        <input type="number" placeholder={loanLabels.placeholderYears} value={years} onChange={e => setYears(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                    </div>

                    <button type="button" className="btn-primary" onClick={calculate} style={{ width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px" }}>
                        {loanLabels.calculateBtn}
                    </button>
                </motion.div>

                {/* Diagnostic Split Metric Breakdown Boards */}
                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>

                        {/* Core EMI Large Display Box */}
                        <div className="card" style={{ textAlign: "center", background: "var(--gradient)", color: "white", marginBottom: 16, padding: "20px" }}>
                            <p style={{ opacity: 0.9, marginBottom: 6, marginTop: 0, fontSize: "14px", fontWeight: 500 }}>{loanLabels.monthlyEmi}</p>
                            <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0 }}>₹{result.emi.toLocaleString("en-IN")}</h2>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                            <div className="card" style={{ textAlign: "center", background: darkMode ? "rgba(153, 27, 27, 0.15)" : "#FEE2E2", border: darkMode ? "1px solid #991B1B" : "1px solid var(--border)", padding: "14px 10px" }}>
                                <p style={{ fontSize: 12, color: darkMode ? "#FCA5A5" : "#991B1B", marginBottom: 4, marginTop: 0, fontWeight: 500 }}>{loanLabels.totalInterest}</p>
                                <h3 style={{ color: darkMode ? "#FCA5A5" : "#991B1B", margin: 0, fontSize: 16, fontWeight: 700 }}>₹{result.totalInterest.toLocaleString("en-IN")}</h3>
                            </div>
                            <div className="card" style={{ textAlign: "center", background: darkMode ? "rgba(91, 33, 182, 0.15)" : "#EDE9FE", border: darkMode ? "1px solid #5B21B6" : "1px solid var(--border)", padding: "14px 10px" }}>
                                <p style={{ fontSize: 12, color: darkMode ? "#C4B5FD" : "#5B21B6", marginBottom: 4, marginTop: 0, fontWeight: 500 }}>{loanLabels.totalPayment.split(" (")[0]}</p>
                                <h3 style={{ color: darkMode ? "#C4B5FD" : "#5B21B6", margin: 0, fontSize: 16, fontWeight: 700 }}>₹{result.totalPayment.toLocaleString("en-IN")}</h3>
                            </div>
                        </div>

                        {/* Amortization Recharts Structural Bar Visualizer Component */}
                        <div className="card">
                            <h3 style={{ fontWeight: 600, marginBottom: 16, marginTop: 0, color: "var(--text-primary)", fontSize: "15px" }}>{loanLabels.yearlyBreakdown}</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={result.chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: "Poppins", fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fontFamily: "Poppins", fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(value) => value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`} />
                                    <Tooltip contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(value, name) => [`₹${Number(value).toLocaleString("en-IN")}`, name]} labelStyle={{ fontWeight: 600, color: "var(--text-primary)" }} />
                                    <Legend wrapperStyle={{ fontFamily: "Poppins", fontSize: 12, paddingTop: 8 }} />
                                    <Bar dataKey={loanLabels.principalBar} fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                    <Bar dataKey={loanLabels.interestBar} fill="#EC4899" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default Loans;