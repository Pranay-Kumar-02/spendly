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
    const navigate = useNavigate();
    const { user } = useApp();

    useEffect(() => {
        if (user) navigate("/");
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isLogin) {
                const { error: err } = await supabase.auth.signInWithPassword({ email, password });
                if (err) throw err;
                navigate("/");
            } else {
                if (!name.trim()) { setError("Please enter your full name"); setLoading(false); return; }
                const { data, error: err } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { display_name: name.trim() } }
                });
                if (err) throw err;
                if (data.user) {
                    // Create settings row
                    await supabase.from("settings").upsert({
                        id: data.user.id,
                        display_name: name.trim(),
                        language: "English",
                    });
                }
                navigate("/");
            }
        } catch (err) {
            setError(err.message || "Something went wrong");
        }
        setLoading(false);
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
            </motion.div>
        </div>
    );
};

export default Login;