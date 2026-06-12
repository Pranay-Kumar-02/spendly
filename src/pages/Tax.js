import React, { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import Navbar from "../components/Navbar";

const Tax = () => {
    // 1. GLOBAL CONTEXT STATE PROVIDERS
    const { darkMode, currentLanguage } = useApp();

    // 2. LOCAL STATE INITIALIZERS
    const [income, setIncome] = useState("");
    const [regime, setRegime] = useState("new");
    const [deductions, setDeductions] = useState({
        section80C: "",
        hra: "",
        section80D: "",
        homeLoan: "",
        nps: "",
    });
    const [result, setResult] = useState(null);

    // 3. SECURE, GRAMMATICALLY VERIFIED MULTILINGUAL LOCALIZATION DICTIONARY MATRIX
    const taxLabels = {
        title: { English: "Tax Calculator", "हिंदी": "कर कैलकुलेटर", "తెలుగు": "పన్ను క్యాలిక్యులేటర్", "ಕನ್ನಡ": "ತೆರಿಗೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್", "മലയാളം": "നികുതി കാൽക്കുലേറ്റർ" }[currentLanguage] || "Tax Calculator",
        header: { English: "Income Tax Calculator FY 2025-26", "हिंदी": "आयकर कैलकुलेटर वित्त वर्ष 2025-26", "తెలుగు": "ఆదాయ పన్ను క్యాలిక్యులేటర్ FY 2025-26", "ಕನ್ನಡ": "ಆದಾಯ ತೆರಿಗೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್ FY 2025-26" }[currentLanguage] || "Income Tax Calculator FY 2025-26",
        annualIncome: { English: "Annual Income (₹)", "हिंदी": "वार्षिक आय (₹)", "తెలుగు": "वार्षिक ఆదాయం (₹)", "ಕನ್ನಡ": "ವಾರ್ಷಿಕ ಆದಾಯ (₹)", "മലയാളം": "വാർഷിക വരുമാനം (₹)" }[currentLanguage] || "Annual Income (₹)",
        taxRegime: { English: "Tax Regime", "हिंदी": "कर व्यवस्था", "తెలుగు": "పన్ను విధానం", "ಕನ್ನಡ": "ತೆರಿಗೆ ಪದ್ಧತಿ", "മലയാളം": "നികുതി വ്യവസ്ഥ" }[currentLanguage] || "Tax Regime",
        newRegime: { English: "New Regime", "हिंदी": "नई व्यवस्था", "తెలుగు": "కొత్త విధానం", "ಕನ್ನಡ": "ಹೊಸ ಪದ್ಧತಿ", "മലയാളം": "പുതിയ വ്യവസ്ഥ" }[currentLanguage] || "New Regime",
        oldRegime: { English: "Old Regime", "हिंदी": "पुरानी व्यवस्था", "తెలుగు": "పాత విధానం", "ಕನ್ನಡ": "ಹಳೆಯ ಪದ್ಧತಿ", "മലയാളം": "പഴയ വ്യവസ്ഥ" }[currentLanguage] || "Old Regime",
        deductionsHeader: { English: "Deductions", "हिंदी": "कटौतियां", "తెలుగు": "మినహాయింపులు", "ಕನ್ನಡ": "ವಿನಾಯಿತಿಗಳು", "മലയാളം": "കിഴിവുകൾ" }[currentLanguage] || "Deductions",
        calculateBtn: { English: "Calculate Tax 🧾", "हिंदी": "कर की गणना करें 🧾", "తెలుగు": "పన్ను లెక్కించు 🧾", "ಕನ್ನಡ": "ತೆರಿಗೆ ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ 🧾", "മലയാളം": "നികുതി കണക്കാക്കുക 🧾" }[currentLanguage] || "Calculate Tax 🧾",
        totalTaxPayable: { English: "Total Tax Payable", "हिंदी": "कुल देय कर", "తెలుగు": "మొత్తం చెల్లించాల్సిన పన్ను", "ಕನ್ನಡ": "ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ತೆರಿಗೆ", "മലയാളം": "ആകെ അടയ്ക്കേണ്ട നികുതി" }[currentLanguage] || "Total Tax Payable",
        effectiveRate: { English: "Effective Rate", "हिंदी": "प्रभावी दर", "తెలుగు": "సమర్థవంతమైన రేటు", "ಕನ್ನಡ": "ಪರಿಣಾಮಕಾರಿ ದರ", "മലയാളം": "യഥാർത്ഥ നിരക്ക്" }[currentLanguage] || "Effective Rate",
        taxableIncome: { English: "Taxable Income", "हिंदी": "कर योग्य आय", "తెలుగు": "పన్ను పరిధిలోకి వచ్చే ఆదాయం", "ಕನ್ನಡ": "ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಆದಾಯ", "മലയാളം": "നികുതി വിധേയമായ വരുമാനം" }[currentLanguage] || "Taxable Income",
        incomeTax: { English: "Income Tax", "हिंदी": "आयकर", "తెలుగు": "ఆదాయ పన్ను", "ಕನ್ನಡ": "ಆದಾಯ ತೆರಿಗೆ", "മലയാളം": "ആദായ നികുതി" }[currentLanguage] || "Income Tax",
        cessLabel: { English: "Health & Ed. Cess", "हिंदी": "स्वास्थ्य और शिक्षा उपकर", "తెలుగు": "హెల్త్ & ఎడ్యుకేషన్ సెస్", "ಕನ್ನಡ": "ಆರೋಗ್ಯ ಮತ್ತು ಶಿಕ್ಷಣ ಸೆಸ್" }[currentLanguage] || "Health & Ed. Cess",
        monthlyTax: { English: "Monthly Tax", "हिंदी": "मासिक कर", "తెలుగు": "నెలవారీ పన్ను", "ಕನ್ನಡ": "ಮಾಸಿಕ ತೆರಿಗೆ", "മലയാളം": "പ്രതിമാസ നികുതി" }[currentLanguage] || "Monthly Tax",
        inHandSalary: { English: "Annual In-Hand Salary", "हिंदी": "वार्षिक इन-हैंड वेतन", "తెలుగు": "వార్షిక చేతికి వచ్చే జీతం", "ಕನ್ನಡ": "ವಾರ್ಷಿಕ ಕೈಗೆ ಸಿಗುವ ಸಂಬಳ", "മലയാളം": "വാർഷിക ഇൻ-ഹാൻഡ് ശമ്പളം" }[currentLanguage] || "Annual In-Hand Salary",
        placeholderAmt: { English: "e.g. 800000", "हिंदी": "जैसे: 800000", "తెలుగు": "ఉదా: 800000", "ಕನ್ನಡ": "ಉದಾ: 800000" }[currentLanguage] || "e.g. 800000"
    };

    const deductionItems = [
        { key: "section80C", label: { English: "Section 80C (max ₹1.5L)", "हिंदी": "धारा 80C (अधिकतम ₹1.5L)", "తెలుగు": "సెక్షన్ 80C (గరిష్టంగా ₹1.5లక్షలు)", "ಕನ್ನಡ": "ಸೆಕ್ಷನ್ 80C (ಗರಿಷ್ಠ ₹1.5L)" }[currentLanguage] || "Section 80C (max ₹1.5L)", placeholder: { English: "PF, ELSS, LIC etc.", "हिंदी": "पीएफ, ईएलएसएस, एलआईसी आदि", "తెలుగు": "PF, ELSS, LIC మొదలైనవి", "ಕನ್ನಡ": "PF, ELSS, LIC ಇತ್ಯಾದಿ" }[currentLanguage] || "PF, ELSS, LIC etc." },
        { key: "hra", label: { English: "HRA Exemption", "हिंदी": "एचआरए छूट", "తెలుగు": "HRA మినహాయింపు", "ಕನ್ನಡ": "HRA ವಿನಾಯಿತಿ" }[currentLanguage] || "HRA Exemption", placeholder: { English: "House Rent Allowance", "हिंदी": "मकान किराया भत्ता", "తెలుగు": "ఇంటి అద్దె అలవెన్స్", "ಕನ್ನಡ": "ಮನೆ ಬಾಡಿಗೆ ಭತ್ಯೆ" }[currentLanguage] || "House Rent Allowance" },
        { key: "section80D", label: { English: "Section 80D (max ₹25K)", "हिंदी": "धारा 80D (अधिकतम ₹25K)", "తెలుగు": "సెక్షన్ 80D (గరిష్టంగా ₹25వేలు)", "ಕನ್ನಡ": "ಸೆಕ್ಷನ್ 80D (ಗರಿಷ್ಠ ₹25K)" }[currentLanguage] || "Section 80D (max ₹25K)", placeholder: { English: "Health Insurance", "हिंदी": "स्वास्थ्य बीमा", "తెలుగు": "ఆరోగ్య భీమా", "ಕನ್ನಡ": "ಆರೋಗ್ಯ ವಿಮೆ" }[currentLanguage] || "Health Insurance" },
        { key: "homeLoan", label: { English: "Home Loan Interest (max ₹2L)", "हिंदी": "गृह ऋण ब्याज (अधिकतम ₹2L)", "తెలుగు": "హోమ్ లోన్ వడ్డీ (గరిష్టంగా ₹2లక్షలు)", "ಕನ್ನಡ": "ಗೃಹ ಸಾಲದ ಬಡ್ಡಿ (ಗರಿಷ್ಠ ₹2L)" }[currentLanguage] || "Home Loan Interest (max ₹2L)", placeholder: "Section 24b" },
        { key: "nps", label: { English: "NPS (max ₹50K)", "हिंदी": "एनपीएस (अधिकतम ₹50K)", "తెలుగు": "NPS (గరిష్టంగా ₹50వేలు)", "ಕನ್ನಡ": "NPS (ಗರಿಷ್ಠ ₹50K)" }[currentLanguage] || "NPS (max ₹50K)", placeholder: "Section 80CCD(1B)" }
    ];

    // 4. INCOME TAX CALCULATION SLABS MATH ENGINE
    const calculateTax = () => {
        const annualIncome = Number(income);
        if (!annualIncome) return;

        let taxableIncome = annualIncome;

        if (regime === "old") {
            const standardDeduction = 50000;
            const total80C = Math.min(Number(deductions.section80C), 150000);
            const totalHRA = Number(deductions.hra);
            const total80D = Math.min(Number(deductions.section80D), 25000);
            const homeLoan = Math.min(Number(deductions.homeLoan), 200000);
            const nps = Math.min(Number(deductions.nps), 50000);
            const totalDeductions = standardDeduction + total80C + totalHRA + total80D + homeLoan + nps;
            taxableIncome = Math.max(annualIncome - totalDeductions, 0);
        }

        let tax = 0;
        if (regime === "new") {
            if (taxableIncome <= 300000) tax = 0;
            else if (taxableIncome <= 600000) tax = (taxableIncome - 300000) * 0.05;
            else if (taxableIncome <= 900000) tax = 15000 + (taxableIncome - 600000) * 0.10;
            else if (taxableIncome <= 1200000) tax = 45000 + (taxableIncome - 900000) * 0.15;
            else if (taxableIncome <= 1500000) tax = 90000 + (taxableIncome - 1200000) * 0.20;
            else tax = 150000 + (taxableIncome - 1500000) * 0.30;
        } else {
            if (taxableIncome <= 250000) tax = 0;
            else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
            else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20;
            else tax = 112500 + (taxableIncome - 1000000) * 0.30;
        }

        const cess = tax * 0.04;
        const totalTax = tax + cess;
        const monthlyTax = totalTax / 12;
        const effectiveRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

        setResult({
            taxableIncome: Math.round(taxableIncome),
            tax: Math.round(tax),
            cess: Math.round(cess),
            totalTax: Math.round(totalTax),
            monthlyTax: Math.round(monthlyTax),
            effectiveRate: effectiveRate.toFixed(2),
            inHand: Math.round(annualIncome - totalTax),
        });
    };

    return (
        <div className={`tax-page ${darkMode ? "dark-mode" : ""}`}>
            <Navbar title={taxLabels.title} />
            <div className="page-container">

                {/* CRITICAL SPACE BUFFER: Corrects line height issues for text rendering */}
                <style>{`
                    .card h3, .card h4, .card p, .btn-primary, label { font-family: 'Poppins', sans-serif !important; line-height: 1.6 !important; }
                    input { font-family: 'Poppins', sans-serif !important; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; }
                `}</style>

                {/* Configuration Entry Form */}
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 20, color: "var(--text-primary)" }}>{taxLabels.header}</h3>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{taxLabels.annualIncome}</label>
                        <input type="number" placeholder={taxLabels.placeholderAmt} value={income} onChange={e => setIncome(e.target.value)} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>{taxLabels.taxRegime}</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={() => setRegime("new")}
                                style={{ flex: 1, padding: "12px", border: "2px solid", borderColor: regime === "new" ? "var(--primary)" : "var(--border)", borderRadius: 12, background: regime === "new" ? "var(--primary)" : "transparent", color: regime === "new" ? "white" : "var(--text-primary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                                {taxLabels.newRegime}
                            </button>
                            <button type="button" onClick={() => setRegime("old")}
                                style={{ flex: 1, padding: "12px", border: "2px solid", borderColor: regime === "old" ? "var(--primary)" : "var(--border)", borderRadius: 12, background: regime === "old" ? "var(--primary)" : "transparent", color: regime === "old" ? "white" : "var(--text-primary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                                {taxLabels.oldRegime}
                            </button>
                        </div>
                    </div>

                    {/* Old Regime Nested Deductions Layout Component */}
                    {regime === "old" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20 }}>
                            <h4 style={{ fontWeight: 600, marginBottom: 14, marginTop: 0, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>{taxLabels.deductionsHeader}</h4>
                            {deductionItems.map(d => (
                                <div key={d.key} style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{d.label}</label>
                                    <input type="number" placeholder={d.placeholder} value={deductions[d.key]} onChange={e => setDeductions({ ...deductions, [d.key]: e.target.value })} style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--text-primary)" }} />
                                </div>
                            ))}
                        </motion.div>
                    )}

                    <button className="btn-primary" onClick={calculateTax} style={{ marginTop: 12, width: "100%", padding: "14px", borderRadius: "12px", fontWeight: 600, fontSize: "14px" }}>
                        {taxLabels.calculateBtn}
                    </button>
                </motion.div>

                {/* Final Diagnostic Calculation Results Dashboard View */}
                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
                        <div className="card" style={{ background: "var(--gradient)", color: "white", textAlign: "center", marginBottom: 16, padding: "22px" }}>
                            <p style={{ opacity: 0.9, marginBottom: 6, marginTop: 0, fontSize: "14px" }}>{taxLabels.totalTaxPayable}</p>
                            <h2 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 4px 0" }}>₹{result.totalTax.toLocaleString("en-IN")}</h2>
                            <p style={{ opacity: 0.8, fontSize: 12, margin: 0 }}>{taxLabels.effectiveRate}: {result.effectiveRate}%</p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                            {[
                                { label: taxLabels.taxableIncome, value: result.taxableIncome, color: darkMode ? "rgba(91, 33, 182, 0.15)" : "#EDE9FE", textColor: darkMode ? "#C4B5FD" : "#5B21B6", border: "1px solid #5B21B6" },
                                { label: taxLabels.incomeTax, value: result.tax, color: darkMode ? "rgba(153, 27, 27, 0.15)" : "#FEE2E2", textColor: darkMode ? "#FCA5A5" : "#991B1B", border: "1px solid #991B1B" },
                                { label: taxLabels.cessLabel, value: result.cess, color: darkMode ? "rgba(146, 64, 14, 0.15)" : "#FEF3C7", textColor: darkMode ? "#FCD34D" : "#92400E", border: "1px solid #92400E" },
                                { label: taxLabels.monthlyTax, value: result.monthlyTax, color: darkMode ? "rgba(153, 27, 27, 0.15)" : "#FEE2E2", textColor: darkMode ? "#FCA5A5" : "#991B1B", border: "1px solid #991B1B" },
                            ].map(item => (
                                <div key={item.label} className="card" style={{ textAlign: "center", background: item.color, border: darkMode ? item.border : "1px solid var(--border)", padding: "14px 10px" }}>
                                    <p style={{ fontSize: 12, color: item.textColor, marginBottom: 4, marginTop: 0, fontWeight: 500 }}>{item.label}</p>
                                    <h3 style={{ color: item.textColor, margin: 0, fontSize: 16, fontWeight: 700 }}>₹{item.value.toLocaleString("en-IN")}</h3>
                                </div>
                            ))}
                        </div>

                        <div className="card" style={{ background: darkMode ? "rgba(6, 95, 70, 0.15)" : "#D1FAE5", border: darkMode ? "1px solid #065F46" : "1px solid var(--border)", textAlign: "center", padding: "18px" }}>
                            <p style={{ fontSize: 13, color: darkMode ? "#34D399" : "#065F46", marginBottom: 4, marginTop: 0, fontWeight: 500 }}>{taxLabels.inHandSalary}</p>
                            <h2 style={{ color: darkMode ? "#34D399" : "#065F46", margin: 0, fontSize: 26, fontWeight: 800 }}>₹{result.inHand.toLocaleString("en-IN")}</h2>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default Tax;