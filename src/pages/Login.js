import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabase/supabase";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "../styles/Login.css";

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Email verification states
    const [awaitingVerification, setAwaitingVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState("");

    const navigate = useNavigate();
    const { user } = useApp();

    useEffect(() => {
        if (user) navigate("/");
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResendSuccess("");
        setLoading(true);
        try {
            if (isLogin) {
                const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
                if (err) {
                    // Check if unconfirmed account
                    if (err.message && err.message.toLowerCase().includes("email not confirmed")) {
                        setVerificationEmail(email);
                        setAwaitingVerification(true);
                        setError("Your email has not been verified yet. Please enter your verification code below or resend.");
                        setLoading(false);
                        return;
                    }
                    throw err;
                }
                if (data?.session) {
                    navigate("/");
                }
            } else {
                if (!name.trim()) { setError("Please enter your full name"); setLoading(false); return; }
                const { data, error: err } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { display_name: name.trim() } }
                });
                if (err) throw err;

                // Check verification state
                const isConfirmed = data?.user?.email_confirmed_at || data?.user?.confirmed_at;
                
                if (data?.session && isConfirmed) {
                    // Pre-confirmed / auto-confirmed session
                    if (data.user) {
                        try {
                            await supabase.from("settings").upsert({
                                id: data.user.id,
                                display_name: name.trim(),
                                language: "English",
                            });
                        } catch (setErr) {
                            console.warn("Settings init warning:", setErr);
                        }
                    }
                    navigate("/");
                } else {
                    // Unconfirmed user: email verification / OTP required
                    setVerificationEmail(email);
                    setAwaitingVerification(true);
                }
            }
        } catch (err) {
            console.error("Auth error:", err);
            if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
                setError("Unable to connect to Supabase backend (Failed to fetch). Please verify that your Supabase project is unpaused in your Supabase dashboard, or verify your REACT_APP_SUPABASE_URL.");
            } else {
                setError(err.message || "Authentication failed. Please check your credentials.");
            }
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp.trim()) {
            setError("Please enter the 6-digit verification code");
            return;
        }
        setError("");
        setResendSuccess("");
        setLoading(true);
        try {
            // Attempt verification with signup type first, fallback to email type
            let res = await supabase.auth.verifyOtp({
                email: verificationEmail,
                token: otp.trim(),
                type: 'signup'
            });

            if (res.error) {
                res = await supabase.auth.verifyOtp({
                    email: verificationEmail,
                    token: otp.trim(),
                    type: 'email'
                });
            }

            if (res.error) throw res.error;

            if (res.data?.user) {
                try {
                    await supabase.from("settings").upsert({
                        id: res.data.user.id,
                        display_name: name.trim() || res.data.user.user_metadata?.display_name || "User",
                        language: "English",
                    });
                } catch (setErr) {
                    console.warn("Settings init warning:", setErr);
                }
                navigate("/");
            }
        } catch (err) {
            console.error("OTP verification error:", err);
            setError(err.message || "Invalid or expired verification code. Please try again.");
        }
        setLoading(false);
    };

    const handleResendOtp = async () => {
        if (!verificationEmail) return;
        setResendLoading(true);
        setError("");
        setResendSuccess("");
        try {
            const { error: resendErr } = await supabase.auth.resend({
                type: 'signup',
                email: verificationEmail
            });
            if (resendErr) throw resendErr;
            setResendSuccess("A new verification code has been sent to your email!");
        } catch (err) {
            console.error("Resend error:", err);
            setError(err.message || "Failed to resend verification code. Please wait a moment and try again.");
        }
        setResendLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
            </div>

            <motion.div className="login-container"
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

                <div className="login-header">
                    <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        Spend<span>ly</span>
                    </motion.h1>
                    <p>Track your money, grow your future 🚀</p>
                </div>

                {awaitingVerification ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <div style={{ fontSize: 44, marginBottom: 8 }}>📩</div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary, #1e293b)" }}>
                                Verify Your Email
                            </h2>
                            <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", margin: 0, lineHeight: 1.5 }}>
                                We sent a 6-digit confirmation code to<br />
                                <strong style={{ color: "var(--text-primary, #0f172a)" }}>{verificationEmail}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="login-form">
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                maxLength={8}
                                style={{ textAlign: "center", letterSpacing: "4px", fontSize: 18, fontWeight: 700 }}
                                required
                                autoFocus
                            />

                            {error && <p className="error-msg">⚠️ {error}</p>}
                            {resendSuccess && <p style={{ color: "#10B981", fontSize: 13, fontWeight: 600, textAlign: "center", margin: "4px 0" }}>✅ {resendSuccess}</p>}

                            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                                {loading ? "Verifying..." : "Verify & Continue →"}
                            </button>
                        </form>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, fontSize: 13 }}>
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendLoading}
                                style={{ background: "transparent", border: "none", color: "#7C3AED", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                                {resendLoading ? "Resending..." : "Resend code"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAwaitingVerification(false); setError(""); setResendSuccess(""); }}
                                style={{ background: "transparent", border: "none", color: "var(--text-secondary, #64748b)", fontWeight: 500, cursor: "pointer", padding: 0 }}>
                                ← Back
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        <div className="login-tabs">
                            <button className={isLogin ? "active" : ""} onClick={() => { setIsLogin(true); setError(""); }}>Login</button>
                            <button className={!isLogin ? "active" : ""} onClick={() => { setIsLogin(false); setError(""); }}>Sign Up</button>
                        </div>

                        <form onSubmit={handleSubmit} className="login-form">
                            {!isLogin && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                                    <input type="text" placeholder="Full Name (e.g. Chris Evans)"
                                        value={name} onChange={e => setName(e.target.value)} required />
                                </motion.div>
                            )}
                            <input type="email" placeholder="Email Address"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                            <input type="password" placeholder="Password (min 6 characters)"
                                value={password} onChange={e => setPassword(e.target.value)} required />
                            {error && <p className="error-msg">⚠️ {error}</p>}
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Please wait..." : isLogin ? "Login →" : "Create Account →"}
                            </button>
                        </form>

                        <p className="login-footer">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span onClick={() => { setIsLogin(!isLogin); setError(""); }}>
                                {isLogin ? "Sign Up" : "Login"}
                            </span>
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default Login;