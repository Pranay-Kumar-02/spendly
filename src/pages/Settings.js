import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { auth, db } from "../firebase/firebase";
import {
    signOut, updatePassword, EmailAuthProvider,
    reauthenticateWithCredential, updateProfile
} from "firebase/auth";
import {
    doc, getDoc, setDoc, collection,
    query, where, getDocs, deleteDoc
} from "firebase/firestore";
import Navbar from "../components/Navbar";
import * as XLSX from "xlsx";

const THEMES = [
    { id: "purple", type: "color", name: "Purple", emoji: "🔮", desc: "Classic purple", colors: ["#7C3AED", "#EC4899"] },
    { id: "blue", type: "color", name: "Blue", emoji: "🌊", desc: "Ocean blue", colors: ["#2563EB", "#06B6D4"] },
    { id: "green", type: "color", name: "Green", emoji: "🌿", desc: "Nature green", colors: ["#059669", "#34D399"] },
    { id: "orange", type: "color", name: "Orange", emoji: "🌅", desc: "Sunset orange", colors: ["#EA580C", "#FBBF24"] },
    { id: "pink", type: "color", name: "Pink", emoji: "🌸", desc: "Blossom pink", colors: ["#E11D48", "#FB7185"] },
    { id: "indigo", type: "color", name: "Indigo", emoji: "🌌", desc: "Deep indigo", colors: ["#4338CA", "#7C3AED"] },
    { id: "teal", type: "color", name: "Teal", emoji: "🦋", desc: "Tropical teal", colors: ["#0D9488", "#06B6D4"] },
    { id: "amber", type: "color", name: "Amber", emoji: "🍯", desc: "Honey amber", colors: ["#D97706", "#F59E0B"] },
    { id: "crimson", type: "color", name: "Crimson", emoji: "🔥", desc: "Bold crimson", colors: ["#DC2626", "#F97316"] },
    { id: "slate", type: "color", name: "Slate", emoji: "🪨", desc: "Cool slate", colors: ["#475569", "#64748B"] },
    { id: "particle-cosmos", type: "particle", name: "Cosmos", emoji: "✨", desc: "Cosmic particles", colors: ["#7C3AED", "#EC4899"], particle: "#A78BFA" },
    { id: "particle-ocean", type: "particle", name: "Deep Sea", emoji: "🐋", desc: "Ocean particles", colors: ["#0EA5E9", "#06B6D4"], particle: "#38BDF8" },
    { id: "particle-snow", type: "particle", name: "Snow", emoji: "❄️", desc: "Snowflakes", colors: ["#10B981", "#4ADE80"], particle: "#4ADE80" },
    { id: "particle-galaxy", type: "particle", name: "Galaxy", emoji: "🌌", desc: "Star clusters", colors: ["#F97316", "#FBBF24"], particle: "#FB923C" },
    { id: "particle-sakura", type: "particle", name: "Sakura", emoji: "🌺", desc: "Cherry petals", colors: ["#F43F5E", "#FDA4AF"], particle: "#FB7185" },
    { id: "particle-matrix", type: "particle", name: "Matrix", emoji: "💻", desc: "Digital rain", colors: ["#10B981", "#059669"], particle: "#4ADE80" },
    { id: "particle-fire", type: "particle", name: "Fire", emoji: "🔥", desc: "Fire particles", colors: ["#DC2626", "#F97316"], particle: "#FCA5A5" },
    { id: "particle-aurora", type: "particle", name: "Aurora", emoji: "🌈", desc: "Northern lights", colors: ["#4338CA", "#06B6D4"], particle: "#818CF8" },
    { id: "particle-gold", type: "particle", name: "Gold", emoji: "⭐", desc: "Golden sparkles", colors: ["#D97706", "#FCD34D"], particle: "#FCD34D" },
    { id: "particle-neon", type: "particle", name: "Neon", emoji: "⚡", desc: "Neon glow", colors: ["#7C3AED", "#4ADE80"], particle: "#4ADE80" },
];

const ALL_THEME_CLASSES = [
    "theme-blue", "theme-green", "theme-orange", "theme-pink",
    "theme-indigo", "theme-teal", "theme-amber", "theme-crimson", "theme-slate",
    "theme-particle-cosmos", "theme-particle-ocean", "theme-particle-snow",
    "theme-particle-galaxy", "theme-particle-sakura", "theme-particle-matrix",
    "theme-particle-fire", "theme-particle-aurora", "theme-particle-gold", "theme-particle-neon"
];

const LANGUAGES = [
    { label: "English", value: "en", flag: "🇬🇧" },
    { label: "हिंदी", value: "hi", flag: "🇮🇳" },
    { label: "తెలుగు", value: "te", flag: "🇮🇳" },
    { label: "தமிழ்", value: "ta", flag: "🇮🇳" },
    { label: "ಕನ್ನಡ", value: "kn", flag: "🇮🇳" },
    { label: "മലയാളം", value: "ml", flag: "🇮🇳" },
    { label: "मराठी", value: "mr", flag: "🇮🇳" },
    { label: "বাংলা", value: "bn", flag: "🇧🇩" },
    { label: "ગુજરાતી", value: "gu", flag: "🇮🇳" },
    { label: "ਪੰਜਾਬੀ", value: "pa", flag: "🇮🇳" },
    { label: "Français", value: "fr", flag: "🇫🇷" },
    { label: "Español", value: "es", flag: "🇪🇸" },
    { label: "Deutsch", value: "de", flag: "🇩🇪" },
    { label: "العربية", value: "ar", flag: "🇸🇦" },
];

// ── Mini Particle Canvas ──────────────────────────────
const MiniParticle = ({ theme }) => {
    const ref = useRef(null);
    const animRef = useRef(null);
    useEffect(() => {
        const canvas = ref.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = 56; canvas.height = 56;
        const hex2rgb = (hex) => {
            const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "255,255,255";
        };
        const rgb = hex2rgb(theme.particle || theme.colors[0]);
        const ps = Array.from({ length: 12 }, () => ({
            x: Math.random() * 56, y: Math.random() * 56,
            vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
            r: Math.random() * 1.5 + 0.5, o: Math.random() * 0.6 + 0.2,
            p: Math.random() * Math.PI * 2,
        }));
        const draw = () => {
            ctx.clearRect(0, 0, 56, 56);
            for (let i = 0; i < ps.length; i++) {
                for (let j = i + 1; j < ps.length; j++) {
                    const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 22) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${rgb},${(1 - d / 22) * 0.45})`;
                        ctx.lineWidth = 0.4;
                        ctx.moveTo(ps[i].x, ps[i].y);
                        ctx.lineTo(ps[j].x, ps[j].y);
                        ctx.stroke();
                    }
                }
            }
            ps.forEach(p => {
                p.p += 0.04; p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > 56) p.vx *= -1;
                if (p.y < 0 || p.y > 56) p.vy *= -1;
                const o = p.o * (0.7 + Math.sin(p.p) * 0.3);
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
                g.addColorStop(0, `rgba(${rgb},${o})`);
                g.addColorStop(1, `rgba(${rgb},0)`);
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
                ctx.fillStyle = g; ctx.fill();
            });
            animRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [theme]);
    return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: "50%" }} />;
};

// ── Preview Banner Canvas ─────────────────────────────
const PreviewCanvas = ({ theme }) => {
    const ref = useRef(null);
    const animRef = useRef(null);
    useEffect(() => {
        const canvas = ref.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.offsetWidth || 400;
        canvas.height = canvas.offsetHeight || 130;
        const hex2rgb = (hex) => {
            const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "255,255,255";
        };
        const rgb = hex2rgb(theme.particle || theme.colors[0]);
        const ps = Array.from({ length: 35 }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
            r: Math.random() * 2 + 0.8, o: Math.random() * 0.7 + 0.2,
            p: Math.random() * Math.PI * 2,
        }));
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < ps.length; i++) {
                for (let j = i + 1; j < ps.length; j++) {
                    const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 70) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${rgb},${(1 - d / 70) * 0.4})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(ps[i].x, ps[i].y);
                        ctx.lineTo(ps[j].x, ps[j].y);
                        ctx.stroke();
                    }
                }
            }
            ps.forEach(p => {
                p.p += 0.03; p.x += p.vx; p.y += p.vy;
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.y < -10) p.y = canvas.height + 10;
                if (p.y > canvas.height + 10) p.y = -10;
                const o = p.o * (0.7 + Math.sin(p.p) * 0.3);
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
                g.addColorStop(0, `rgba(${rgb},${o})`);
                g.addColorStop(1, `rgba(${rgb},0)`);
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
                ctx.fillStyle = g; ctx.fill();
            });
            animRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [theme]);
    return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 18 }} />;
};

// ── CHANGE 1: Crop Modal ──────────────────────────────
const CropModal = ({ src, onCrop, onCancel }) => {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const dragging = useRef(false);
    const startRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
    const SIZE = 280;
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const posRef = useRef({ x: 0, y: 0 });
    const scaleRef = useRef(1);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            const fit = Math.max(SIZE / img.width, SIZE / img.height) * 1.05;
            const ix = (SIZE - img.width * fit) / 2;
            const iy = (SIZE - img.height * fit) / 2;
            scaleRef.current = fit; posRef.current = { x: ix, y: iy };
            setScale(fit); setPos({ x: ix, y: iy });
        };
        img.src = src;
    }, [src]);

    useEffect(() => { posRef.current = pos; }, [pos]);
    useEffect(() => { scaleRef.current = scale; }, [scale]);

    const redraw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas || !imgRef.current) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.drawImage(imgRef.current, posRef.current.x, posRef.current.y,
            imgRef.current.width * scaleRef.current, imgRef.current.height * scaleRef.current);
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2.5; ctx.stroke();
    }, []);

    useEffect(() => { redraw(); }, [pos, scale, redraw]);

    const onMD = (ev) => { dragging.current = true; startRef.current = { mx: ev.clientX, my: ev.clientY, ox: pos.x, oy: pos.y }; };
    const onMM = (ev) => { if (!dragging.current) return; setPos({ x: startRef.current.ox + (ev.clientX - startRef.current.mx), y: startRef.current.oy + (ev.clientY - startRef.current.my) }); };
    const onMU = () => { dragging.current = false; };
    const onTS = (ev) => { const t = ev.touches[0]; dragging.current = true; startRef.current = { mx: t.clientX, my: t.clientY, ox: pos.x, oy: pos.y }; };
    const onTM = (ev) => { if (!dragging.current) return; const t = ev.touches[0]; setPos({ x: startRef.current.ox + (t.clientX - startRef.current.mx), y: startRef.current.oy + (t.clientY - startRef.current.my) }); };
    const onWheel = (ev) => { ev.preventDefault(); setScale(function (s) { return Math.min(5, Math.max(0.3, s - ev.deltaY * 0.001)); }); };

    const doCrop = () => {
        const img = imgRef.current; if (!img) return;
        const R = SIZE / 2 - 6;
        const out = document.createElement("canvas"); out.width = R * 2; out.height = R * 2;
        const ctx = out.getContext("2d");
        ctx.beginPath(); ctx.arc(R, R, R, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, posRef.current.x - (SIZE / 2 - R), posRef.current.y - (SIZE / 2 - R),
            img.width * scaleRef.current, img.height * scaleRef.current);
        onCrop(out.toDataURL("image/jpeg", 0.88));
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 20 }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>Drag to reposition · Scroll to zoom</p>
            <canvas ref={canvasRef} width={SIZE} height={SIZE}
                style={{ borderRadius: "50%", cursor: "grab", userSelect: "none", touchAction: "none", boxShadow: "0 0 0 4px rgba(255,255,255,0.15)" }}
                onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
                onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onMU} onWheel={onWheel}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 280 }}>
                <span style={{ fontSize: 16 }}>🔍</span>
                <input type="range" min="0.3" max="5" step="0.02" value={scale}
                    onChange={function (ev) { setScale(Number(ev.target.value)); }}
                    style={{ flex: 1, accentColor: "white" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
                <button onClick={doCrop} style={{ padding: "13px 32px", borderRadius: 14, background: "white", color: "#7C3AED", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "Poppins" }}>✓ Use Photo</button>
                <button onClick={onCancel} style={{ padding: "13px 32px", borderRadius: 14, background: "rgba(255,255,255,0.12)", color: "white", fontWeight: 700, fontSize: 15, border: "2px solid rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "Poppins" }}>Cancel</button>
            </div>
        </div>
    );
};

// ── SETTINGS ─────────────────────────────────────────
const Settings = () => {
    const {
        user, darkMode, setDarkMode,
        currentLanguage, setCurrentLanguage,
        currentTheme, changeTheme,
        setDisplayName: setCtxName,
        // CHANGE 2: get profilePic setters from context so all pages sync
        profilePic: ctxProfilePic,
        setProfilePic: setCtxProfilePic,
        expenses, incomes, budget,
    } = useApp();

    const [displayName, setDisplayName] = useState("");
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [editingEmail, setEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [emailAuthPass, setEmailAuthPass] = useState("");
    const [profilePic, setProfilePic] = useState(null);
    const [picLoading, setPicLoading] = useState(false);
    // CHANGE 1: crop state
    const [cropSrc, setCropSrc] = useState(null);
    const fileInputRef = useRef(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [budgetAlerts, setBudgetAlerts] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(false);
    const [transactionNotif, setTransactionNotif] = useState(true);
    const [billReminders, setBillReminders] = useState(true);
    const [pinLock, setPinLock] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [appLock, setAppLock] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [msg, setMsg] = useState({ text: "", ok: true });
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [showThemePanel, setShowThemePanel] = useState(false);
    const [showDev, setShowDev] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showExportOpts, setShowExportOpts] = useState(false);
    const [hoveredTheme, setHoveredTheme] = useState(null);
    const [previewTheme, setPreviewTheme] = useState(null);

    const active = THEMES.find(function (t) { return t.id === currentTheme; }) || THEMES[0];
    const displayed = previewTheme ? (THEMES.find(function (t) { return t.id === previewTheme; }) || active) : active;

    const toast = useCallback(function (text, ok) {
        if (ok === undefined) ok = true;
        setMsg({ text: text, ok: ok });
        setTimeout(function () { setMsg({ text: "", ok: true }); }, 3500);
    }, []);

    const applyThemeNow = useCallback(function (themeId) {
        ALL_THEME_CLASSES.forEach(function (cls) { document.body.classList.remove(cls); });
        if (themeId !== "purple") document.body.classList.add("theme-" + themeId);
    }, []);

    useEffect(function () {
        if (!user) return;
        const name = user.displayName
            || user.email?.split("@")[0]?.replace(/\./g, " ")?.replace(/\b\w/g, function (c) { return c.toUpperCase(); })
            || "User";
        setDisplayName(name);
        getDoc(doc(db, "settings", user.uid)).then(function (snap) {
            if (!snap.exists()) return;
            const d = snap.data();
            if (d.profilePic) {
                setProfilePic(d.profilePic);
                if (setCtxProfilePic) setCtxProfilePic(d.profilePic); // CHANGE 2: sync to context
            }
            if (d.pinLockEnabled !== undefined) setPinLock(d.pinLockEnabled);
            if (d.budgetAlerts !== undefined) setBudgetAlerts(d.budgetAlerts);
            if (d.weeklyReport !== undefined) setWeeklyReport(d.weeklyReport);
            if (d.appLock !== undefined) setAppLock(d.appLock);
            if (d.transactionNotif !== undefined) setTransactionNotif(d.transactionNotif);
            if (d.billReminders !== undefined) setBillReminders(d.billReminders);
        }).catch(console.error);
        applyThemeNow(currentTheme);
    }, [user]);

    const save = async function (key, value) {
        try { await setDoc(doc(db, "settings", user.uid), { [key]: value }, { merge: true }); } catch (e) { console.error(e); }
    };

    // CHANGE 1: file select → open crop instead of direct upload
    const handlePicSelect = function (e) {
        const file = e.target.files[0]; if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast("❌ Image must be under 10 MB!", false); return; }
        const reader = new FileReader();
        reader.onloadend = function () { setCropSrc(reader.result); };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleCropDone = async function (b64) {
        setCropSrc(null); setPicLoading(true);
        setProfilePic(b64);
        if (setCtxProfilePic) setCtxProfilePic(b64); // CHANGE 2: update all pages instantly
        await save("profilePic", b64);
        try { await updateProfile(auth.currentUser, { photoURL: b64 }); } catch (_) { }
        toast("✅ Profile picture updated!"); setPicLoading(false);
    };

    const handleRemovePic = async function () {
        setProfilePic(null);
        if (setCtxProfilePic) setCtxProfilePic(null); // CHANGE 2: sync removal
        await save("profilePic", "");
        try { await updateProfile(auth.currentUser, { photoURL: "" }); } catch (_) { }
        toast("✅ Profile picture removed!");
    };

    const handleSaveName = async function () {
        if (!nameInput.trim()) return; setLoading(true);
        try {
            await updateProfile(auth.currentUser, { displayName: nameInput.trim() });
            await save("displayName", nameInput.trim());
            setDisplayName(nameInput.trim());
            if (setCtxName) setCtxName(nameInput.trim());
            setEditingName(false); setNameInput(""); toast("✅ Name updated!");
        } catch (e) { toast("❌ " + e.message, false); }
        setLoading(false);
    };

    const handleUpdateEmail = async function () {
        if (!newEmail.trim() || !emailAuthPass) { toast("❌ Fill all fields!", false); return; }
        setLoading(true);
        try {
            const cred = EmailAuthProvider.credential(user.email, emailAuthPass);
            await reauthenticateWithCredential(auth.currentUser, cred);
            const { updateEmail } = await import("firebase/auth");
            await updateEmail(auth.currentUser, newEmail.trim());
            toast("✅ Email updated! Please verify your new email.");
            setEditingEmail(false); setNewEmail(""); setEmailAuthPass("");
        } catch (e) { toast("❌ " + e.message.replace("Firebase:", "").trim(), false); }
        setLoading(false);
    };

    const handlePassword = async function (e) {
        e.preventDefault();
        if (newPassword !== confirmPassword) { toast("❌ Passwords don't match!", false); return; }
        if (newPassword.length < 6) { toast("❌ Min 6 characters required!", false); return; }
        setLoading(true);
        try {
            const cred = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, cred);
            await updatePassword(auth.currentUser, newPassword);
            toast("✅ Password updated!"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch (e) { toast("❌ " + e.message.replace("Firebase:", "").trim(), false); }
        setLoading(false);
    };

    const handleThemeChange = async function (themeId) {
        applyThemeNow(themeId); changeTheme(themeId); await save("theme", themeId);
        const found = THEMES.find(function (t) { return t.id === themeId; });
        toast("✅ " + (found ? found.name : themeId) + " theme applied!");
    };

    const handleDarkMode = async function () {
        const v = !darkMode; setDarkMode(v); document.body.classList.toggle("dark-mode", v); await save("darkMode", v);
    };

    const handleLanguage = async function (lang) {
        setCurrentLanguage(lang.label); await save("language", lang.label); toast("✅ Language set to " + lang.label + "!");
    };

    const toggle = async function (key, value, setter, onMsg, offMsg) {
        setter(value); await save(key, value); toast(value ? onMsg : offMsg);
    };

    const handlePinToggle = function () {
        if (!pinLock) { setShowPinModal(true); }
        else { setPinLock(false); save("pinLockEnabled", false); save("pinCode", ""); localStorage.removeItem("spendly_pin"); toast("🔓 PIN lock disabled!"); }
    };

    const handleSetPin = async function () {
        if (pinInput.length !== 4) { toast("❌ Enter a 4-digit PIN!", false); return; }
        setPinLock(true); await save("pinLockEnabled", true); await save("pinCode", pinInput);
        localStorage.setItem("spendly_pin", pinInput); setShowPinModal(false); setPinInput(""); toast("🔒 PIN set successfully!");
    };

    // FIXED: arrow functions replaced with proper function syntax (no more e/i undefined errors)
    const handleExportXLSX = async function () {
        setDataLoading(true);
        try {
            const wb = XLSX.utils.book_new();
            const totalExp = (expenses || []).reduce(function (s, ex) { return s + Number(ex.amount); }, 0);
            const totalInc = (incomes || []).reduce(function (s, inc) { return s + Number(inc.amount); }, 0);
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
                { Field: "Name", Value: displayName },
                { Field: "Email", Value: user ? user.email : "" },
                { Field: "Total Income", Value: "₹" + totalInc.toLocaleString("en-IN") },
                { Field: "Total Expenses", Value: "₹" + totalExp.toLocaleString("en-IN") },
                { Field: "Net Savings", Value: "₹" + (totalInc - totalExp).toLocaleString("en-IN") },
                { Field: "Budget", Value: "₹" + (budget || 0).toLocaleString("en-IN") },
                { Field: "Export Date", Value: new Date().toLocaleDateString("en-IN") },
            ]), "Summary");
            if ((expenses || []).length > 0) {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
                    (expenses || []).map(function (ex, idx) {
                        return {
                            "#": idx + 1,
                            "Date": new Date(ex.date).toLocaleDateString("en-IN"),
                            "Category": ex.category,
                            "Description": ex.description || "-",
                            "Amount (₹)": Number(ex.amount),
                        };
                    })
                ), "Expenses");
            }
            if ((incomes || []).length > 0) {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
                    (incomes || []).map(function (inc, idx) {
                        return {
                            "#": idx + 1,
                            "Date": new Date(inc.date).toLocaleDateString("en-IN"),
                            "Type": inc.type || "Income",
                            "Description": inc.description || "-",
                            "Amount (₹)": Number(inc.amount),
                        };
                    })
                ), "Income");
            }
            XLSX.writeFile(wb, "Spendly_" + new Date().toLocaleDateString("en-IN").replace(/\//g, "-") + ".xlsx");
            toast("✅ Exported as Excel!");
        } catch (err) { toast("❌ Export failed: " + err.message, false); }
        setDataLoading(false); setShowExportOpts(false);
    };

    const handleExportJSON = async function () {
        setDataLoading(true);
        try {
            const totalExp = (expenses || []).reduce(function (s, ex) { return s + Number(ex.amount); }, 0);
            const totalInc = (incomes || []).reduce(function (s, inc) { return s + Number(inc.amount); }, 0);
            const blob = new Blob([JSON.stringify({
                exportDate: new Date().toISOString(),
                user: { name: displayName, email: user ? user.email : "" },
                summary: { totalIncome: totalInc, totalExpenses: totalExp, netSavings: totalInc - totalExp, budget: budget },
                expenses: expenses || [],
                income: incomes || [],
            }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Spendly_" + new Date().toLocaleDateString("en-IN").replace(/\//g, "-") + ".json";
            a.click(); URL.revokeObjectURL(url);
            toast("✅ Exported as JSON!");
        } catch (err) { toast("❌ Export failed!", false); }
        setDataLoading(false); setShowExportOpts(false);
    };

    const handleClearData = async function () {
        if (deleteConfirmText !== "DELETE") { toast("❌ Type DELETE to confirm!", false); return; }
        setDataLoading(true);
        try {
            const cols = ["expenses", "income", "goals", "bills", "budgets", "emergency", "creditcards"];
            for (let c = 0; c < cols.length; c++) {
                const q = query(collection(db, cols[c]), where("userId", "==", user.uid));
                const snap = await getDocs(q);
                await Promise.all(snap.docs.map(function (d) { return deleteDoc(doc(db, cols[c], d.id)); }));
            }
            toast("✅ All data cleared!"); setShowDeleteModal(false); setDeleteConfirmText("");
        } catch (err) { toast("❌ Failed: " + err.message, false); }
        setDataLoading(false);
    };

    const card = { background: "var(--card-bg)", borderRadius: 20, padding: 24, border: "1px solid var(--border)", boxShadow: "var(--shadow)", marginBottom: 16 };

    const Toggle = function ({ on, toggle: fn, color }) {
        if (!color) color = "var(--primary)";
        return (
            <motion.div onClick={fn} whileTap={{ scale: 0.95 }}
                style={{ width: 54, height: 30, borderRadius: 15, cursor: "pointer", flexShrink: 0, position: "relative", background: on ? color : "var(--border)", transition: "background 0.3s ease", boxShadow: on ? "0 4px 12px " + color + "55" : "none" }}>
                <motion.div animate={{ left: on ? 27 : 3 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{ width: 24, height: 24, borderRadius: "50%", background: "white", position: "absolute", top: 3, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
            </motion.div>
        );
    };

    const Row = function ({ icon, label, desc, right, onClick }) {
        return (
            <div onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: onClick ? "pointer" : "default", padding: "6px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
                    <div>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px", fontSize: 14 }}>{label}</p>
                        {desc && <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{desc}</p>}
                    </div>
                </div>
                {right}
            </div>
        );
    };

    const Divider = function () { return <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />; };

    const ThemeOrb = function ({ theme }) {
        const isActive = currentTheme === theme.id;
        const isHovered = hoveredTheme === theme.id;
        return (
            <motion.div
                onHoverStart={function () { setHoveredTheme(theme.id); setPreviewTheme(theme.id); }}
                onHoverEnd={function () { setHoveredTheme(null); setPreviewTheme(null); }}
                onClick={function () { handleThemeChange(theme.id); }}
                whileHover={{ y: -5, scale: 1.1 }} whileTap={{ scale: 0.9 }}
                style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <div style={{ position: "relative", width: 52, height: 52 }}>
                    {isActive && (
                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                            style={{ position: "absolute", inset: -7, borderRadius: "50%", border: "2px solid " + theme.colors[0], pointerEvents: "none" }} />
                    )}
                    <div style={{
                        width: 52, height: 52, borderRadius: "50%", position: "relative", overflow: "hidden",
                        background: "linear-gradient(135deg," + theme.colors[0] + "," + theme.colors[1] + ")",
                        border: isActive ? "3px solid white" : "3px solid transparent",
                        boxShadow: isActive ? "0 0 0 3px " + theme.colors[0] + ", 0 8px 24px " + theme.colors[0] + "70" : isHovered ? "0 8px 22px " + theme.colors[0] + "60" : "0 4px 12px " + theme.colors[0] + "30",
                        transition: "all 0.3s ease"
                    }}>
                        {theme.type === "particle" && (isActive || isHovered) && <MiniParticle theme={theme} />}
                        <motion.div animate={{ x: isActive || isHovered ? [-70, 70] : -70 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            style={{ position: "absolute", inset: 0, width: 26, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }} />
                        {theme.type === "particle" && (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                style={{ position: "absolute", inset: 0, background: "conic-gradient(transparent,rgba(255,255,255,0.12),transparent)", borderRadius: "50%", pointerEvents: "none" }} />
                        )}
                        {isActive
                            ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                                style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white", fontWeight: 800 }}>✓</motion.span>
                            : <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{theme.emoji}</span>
                        }
                    </div>
                    {theme.type === "particle" && (
                        <div style={{ position: "absolute", bottom: -3, right: -3, background: "linear-gradient(135deg,#7C3AED,#EC4899)", borderRadius: 6, padding: "1px 5px", fontSize: 7, fontWeight: 800, color: "white", zIndex: 2 }}>3D</div>
                    )}
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, textAlign: "center", margin: 0, color: isActive ? theme.colors[0] : "var(--text-secondary)", transition: "color 0.3s" }}>{theme.name}</p>
            </motion.div>
        );
    };

    return (
        <div className={darkMode ? "dark-mode" : ""} style={{ minHeight: "100vh", background: "var(--background)" }}>
            <Navbar title="Settings" />

            {/* CHANGE 1: Crop modal above everything */}
            {cropSrc && <CropModal src={cropSrc} onCrop={handleCropDone} onCancel={function () { setCropSrc(null); }} />}

            <div className="page-container">

                {/* Toast */}
                <AnimatePresence>
                    {msg.text && (
                        <motion.div initial={{ opacity: 0, y: -16, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16 }}
                            style={{ position: "sticky", top: 12, zIndex: 9999, padding: "14px 18px", borderRadius: 16, marginBottom: 16, fontWeight: 600, fontSize: 14, background: msg.ok ? "#D1FAE5" : "#FEE2E2", color: msg.ok ? "#065F46" : "#991B1B", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                            {msg.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── PROFILE ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>👤 Profile</h3>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 20 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg," + active.colors[0] + "," + active.colors[1] + ")", boxShadow: "0 8px 24px " + active.colors[0] + "50", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid " + active.colors[0] }}>
                                {profilePic
                                    ? <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <span style={{ fontSize: 30, fontWeight: 800, color: "white" }}>{displayName ? displayName.charAt(0).toUpperCase() : "U"}</span>
                                }
                            </div>
                            <div style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "#10B981", border: "3px solid var(--card-bg)" }} />
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                onClick={function () { fileInputRef.current && fileInputRef.current.click(); }} disabled={picLoading}
                                style={{ position: "absolute", top: -4, right: -4, width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg," + active.colors[0] + "," + active.colors[1] + ")", border: "2px solid var(--card-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                                {picLoading ? "⏳" : "📷"}
                            </motion.button>
                            {/* CHANGE 1: use handlePicSelect */}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePicSelect} style={{ display: "none" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px" }}>{displayName}</h3>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 10px" }}>{user ? user.email : ""}</p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, background: active.colors[0] + "20", color: active.colors[0], padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{active.emoji} {active.name}</span>
                                <span style={{ fontSize: 11, background: "var(--background)", color: "var(--text-secondary)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>🌐 {currentLanguage}</span>
                                {user && user.emailVerified && <span style={{ fontSize: 11, background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>✅ Verified</span>}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            onClick={function () { fileInputRef.current && fileInputRef.current.click(); }} disabled={picLoading}
                            style={{ flex: 1, padding: "11px", borderRadius: 12, border: "2px dashed " + active.colors[0], background: active.colors[0] + "08", color: active.colors[0], fontFamily: "Poppins", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            📷 {picLoading ? "Uploading…" : "Upload & Crop Photo"}
                        </motion.button>
                        {profilePic && (
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleRemovePic}
                                style={{ padding: "11px 14px", borderRadius: 12, border: "2px solid #FCA5A5", background: "#FEE2E2", color: "#EF4444", fontFamily: "Poppins", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                🗑️ Remove
                            </motion.button>
                        )}
                    </div>
                    <Divider />
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingName ? 12 : 0 }}>
                            <div>
                                <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px", fontSize: 14 }}>Display Name</p>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{displayName}</p>
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={function () { setEditingName(!editingName); setNameInput(displayName); }}
                                style={{ background: active.colors[0] + "18", border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", color: active.colors[0], fontSize: 13, fontWeight: 700, fontFamily: "Poppins" }}>
                                ✏️ Edit
                            </motion.button>
                        </div>
                        <AnimatePresence>
                            {editingName && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                    <input value={nameInput} onChange={function (e) { setNameInput(e.target.value); }} placeholder="Your display name"
                                        style={{ marginBottom: 10, padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", width: "100%", boxSizing: "border-box", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none" }} />
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={handleSaveName} disabled={loading} className="btn-primary" style={{ flex: 1, padding: 12, borderRadius: 12 }}>{loading ? "Saving…" : "Save Name"}</button>
                                        <button onClick={function () { setEditingName(false); }} style={{ flex: 1, padding: 12, border: "2px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontFamily: "Poppins" }}>Cancel</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <Divider />
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingEmail ? 12 : 0 }}>
                            <div>
                                <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px", fontSize: 14 }}>Email Address</p>
                                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{user ? user.email : ""}</p>
                            </div>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={function () { setEditingEmail(!editingEmail); }}
                                style={{ background: active.colors[0] + "18", border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", color: active.colors[0], fontSize: 13, fontWeight: 700, fontFamily: "Poppins" }}>
                                ✏️ Edit
                            </motion.button>
                        </div>
                        <AnimatePresence>
                            {editingEmail && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                    <input value={newEmail} onChange={function (e) { setNewEmail(e.target.value); }} placeholder="New email address" type="email"
                                        style={{ marginBottom: 10, padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", width: "100%", boxSizing: "border-box", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none" }} />
                                    <input value={emailAuthPass} onChange={function (e) { setEmailAuthPass(e.target.value); }} placeholder="Current password to confirm" type="password"
                                        style={{ marginBottom: 10, padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", width: "100%", boxSizing: "border-box", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none" }} />
                                    <p style={{ fontSize: 11, color: "#F59E0B", margin: "0 0 10px" }}>⚠️ A verification email will be sent to confirm the change.</p>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={handleUpdateEmail} disabled={loading} className="btn-primary" style={{ flex: 1, padding: 12, borderRadius: 12 }}>{loading ? "Updating…" : "Update Email"}</button>
                                        <button onClick={function () { setEditingEmail(false); }} style={{ flex: 1, padding: 12, border: "2px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontFamily: "Poppins" }}>Cancel</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* ── THEME ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                    <motion.div onClick={function () { setShowThemePanel(!showThemePanel); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, overflow: "hidden", position: "relative", flexShrink: 0, background: "linear-gradient(135deg," + active.colors[0] + "," + active.colors[1] + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 14px " + active.colors[0] + "50" }}>
                                {active.type === "particle" && <MiniParticle theme={active} />}
                                <span style={{ position: "relative", zIndex: 1 }}>{active.emoji}</span>
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px", fontSize: 15 }}>🎨 App Theme</p>
                                <p style={{ fontSize: 12, color: active.colors[0], margin: 0, fontWeight: 600 }}>{active.name}{active.type === "particle" ? " • 3D Live" : ""} — tap to change</p>
                            </div>
                        </div>
                        <motion.div animate={{ rotate: showThemePanel ? 180 : 0 }} transition={{ type: "spring", stiffness: 280, damping: 25 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: 14 }}>▼</div>
                        </motion.div>
                    </motion.div>
                    <AnimatePresence>
                        {showThemePanel && (
                            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 20 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} style={{ overflow: "hidden" }}>
                                <div style={{ position: "relative", height: 130, borderRadius: 18, overflow: "hidden", marginBottom: 20 }}>
                                    <PreviewCanvas theme={displayed} />
                                    <motion.div key={displayed.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                                        style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg," + displayed.colors[0] + "CC," + displayed.colors[1] + "AA)", borderRadius: 18 }} />
                                    {[{ s: 110, t: -35, r: -25, o: 0.1 }, { s: 70, b: -25, l: 15, o: 0.08 }].map(function (c, i) {
                                        return (
                                            <motion.div key={i} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 3 + i, repeat: Infinity }}
                                                style={{ position: "absolute", width: c.s, height: c.s, borderRadius: "50%", background: "white", opacity: c.o, top: c.t, right: c.r, bottom: c.b, left: c.l }} />
                                        );
                                    })}
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 5, zIndex: 2 }}>
                                        <motion.span key={displayed.emoji} initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }} style={{ fontSize: 32 }}>{displayed.emoji}</motion.span>
                                        <motion.p key={displayed.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ fontWeight: 800, fontSize: 17, color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.3)", margin: 0 }}>{displayed.name}</motion.p>
                                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", margin: 0 }}>{displayed.type === "particle" ? "⚡ 3D Live • " : ""}{displayed.desc}</p>
                                    </div>
                                    <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "white", zIndex: 3 }}>{previewTheme ? "👁 Preview" : "✓ Active"}</div>
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>🎨 Color Themes</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 22 }}>
                                    {THEMES.filter(function (t) { return t.type === "color"; }).map(function (t) { return <ThemeOrb key={t.id} theme={t} />; })}
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>✨ 3D Live Themes</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 18 }}>
                                    {THEMES.filter(function (t) { return t.type === "particle"; }).map(function (t) { return <ThemeOrb key={t.id} theme={t} />; })}
                                </div>
                                <div style={{ background: active.colors[0] + "12", borderRadius: 12, padding: "10px 14px", border: "1px solid " + active.colors[0] + "25", display: "flex", gap: 10 }}>
                                    <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}><strong style={{ color: "var(--primary)" }}>3D Live themes</strong> render animated particles across every page. Hover any orb to preview it — click to apply instantly.</p>
                                </div>
                                <motion.div key={currentTheme} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.55, ease: "easeOut" }}
                                    style={{ marginTop: 16, height: 5, borderRadius: 10, transformOrigin: "left", background: "linear-gradient(90deg," + active.colors[0] + "," + active.colors[1] + ")", boxShadow: "0 2px 8px " + active.colors[0] + "45" }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── APPEARANCE ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>⚙️ Appearance</h3>
                    <Row icon={darkMode ? "🌙" : "☀️"} label="Dark Mode" desc={darkMode ? "Dark theme is active" : "Light theme is active"} right={<Toggle on={darkMode} toggle={handleDarkMode} />} />
                </motion.div>

                {/* ── LANGUAGE ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>🌐 Language</h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>Changes all labels, greetings and interface text across the entire app</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {LANGUAGES.map(function (lang) {
                            return (
                                <motion.button key={lang.value} onClick={function () { handleLanguage(lang); }} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                                    style={{
                                        padding: "11px 14px", borderRadius: 14, fontFamily: "Poppins", fontSize: 13, cursor: "pointer", fontWeight: 600, transition: "all 0.2s", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                                        border: "2px solid " + (currentLanguage === lang.label ? active.colors[0] : "var(--border)"),
                                        background: currentLanguage === lang.label ? "linear-gradient(135deg," + active.colors[0] + "," + active.colors[1] + ")" : "var(--background)",
                                        color: currentLanguage === lang.label ? "white" : "var(--text-primary)",
                                        boxShadow: currentLanguage === lang.label ? "0 4px 12px " + active.colors[0] + "40" : "none"
                                    }}>
                                    <span style={{ fontSize: 16 }}>{lang.flag}</span>
                                    <span style={{ flex: 1 }}>{lang.label}</span>
                                    {currentLanguage === lang.label && <span>✓</span>}
                                </motion.button>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--background)", borderRadius: 12, border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>🌍 Active: <strong style={{ color: "var(--primary)" }}>{currentLanguage}</strong></p>
                    </div>
                </motion.div>

                {/* ── NOTIFICATIONS ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>🔔 Notifications</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Row icon="💰" label="Budget Alerts" desc={budgetAlerts ? "✅ Alert when budget exceeds 80%" : "❌ Budget alerts off"} right={<Toggle on={budgetAlerts} toggle={function () { toggle("budgetAlerts", !budgetAlerts, setBudgetAlerts, "🔔 Budget alerts on!", "🔕 Budget alerts off!"); }} />} />
                        <Divider />
                        <Row icon="📊" label="Weekly Summary" desc={weeklyReport ? "✅ Weekly spending summary active" : "❌ Weekly reports off"} right={<Toggle on={weeklyReport} toggle={function () { toggle("weeklyReport", !weeklyReport, setWeeklyReport, "📊 Weekly reports on!", "📊 Weekly reports off!"); }} />} />
                        <Divider />
                        <Row icon="💸" label="Transaction Alerts" desc={transactionNotif ? "✅ Notify on every transaction" : "❌ Transaction alerts off"} right={<Toggle on={transactionNotif} toggle={function () { toggle("transactionNotif", !transactionNotif, setTransactionNotif, "🔔 Transaction alerts on!", "🔕 Transaction alerts off!"); }} />} />
                        <Divider />
                        <Row icon="📅" label="Bill Reminders" desc={billReminders ? "✅ Remind 3 days before due date" : "❌ Bill reminders off"} right={<Toggle on={billReminders} toggle={function () { toggle("billReminders", !billReminders, setBillReminders, "📅 Bill reminders on!", "📅 Bill reminders off!"); }} />} />
                    </div>
                </motion.div>

                {/* ── SECURITY ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>🔑 Security & Privacy</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Row icon={pinLock ? "🔒" : "🔓"} label={pinLock ? "4-Digit PIN • Active" : "4-Digit PIN • Not Set"} desc={pinLock ? "Your data is PIN protected" : "Set a PIN to protect your data"}
                            right={
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {pinLock && <motion.button whileTap={{ scale: 0.95 }} onClick={function () { setShowPinModal(true); }} style={{ background: active.colors[0] + "20", color: active.colors[0], border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins" }}>Change</motion.button>}
                                    <Toggle on={pinLock} toggle={handlePinToggle} color="#10B981" />
                                </div>
                            } />
                        <Divider />
                        <Row icon="🛡️" label="App Lock" desc={appLock ? "✅ Requires login on app open" : "❌ App lock disabled"} right={<Toggle on={appLock} toggle={function () { toggle("appLock", !appLock, setAppLock, "🔒 App lock on!", "🔓 App lock off!"); }} color="#EF4444" />} />
                    </div>
                </motion.div>

                {/* ── CHANGE PASSWORD ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>🔐 Change Password</h3>
                    <form onSubmit={handlePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {[
                            { label: "Current Password", val: currentPassword, set: setCurrentPassword, ph: "Enter current password" },
                            { label: "New Password", val: newPassword, set: setNewPassword, ph: "Min 6 characters" },
                            { label: "Confirm New Password", val: confirmPassword, set: setConfirmPassword, ph: "Re-enter new password" },
                        ].map(function (f) {
                            return (
                                <div key={f.label}>
                                    <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8, fontWeight: 600 }}>{f.label}</label>
                                    <input type="password" placeholder={f.ph} value={f.val} onChange={function (e) { f.set(e.target.value); }} required
                                        style={{ padding: "13px 16px", borderRadius: 14, border: "2px solid var(--border)", width: "100%", boxSizing: "border-box", background: "var(--background)", color: "var(--text-primary)", fontFamily: "Poppins", fontSize: 14, outline: "none" }} />
                                </div>
                            );
                        })}
                        {newPassword && confirmPassword && newPassword !== confirmPassword && <p style={{ color: "#EF4444", fontSize: 12, margin: 0 }}>❌ Passwords don't match!</p>}
                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: 14, borderRadius: 14 }}>{loading ? "Updating…" : "Update Password"}</button>
                    </form>
                </motion.div>

                {/* ── DATA & BACKUP ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>💾 Data & Backup</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                        {[
                            { l: "Expenses", v: (expenses || []).length, icon: "💸", c: "#EF4444" },
                            { l: "Income", v: (incomes || []).length, icon: "💰", c: "#10B981" },
                            { l: "Budget", v: "₹" + ((budget || 0) / 1000).toFixed(0) + "k", icon: "🏦", c: active.colors[0] },
                        ].map(function (s) {
                            return (
                                <div key={s.l} style={{ background: "var(--background)", borderRadius: 14, padding: "12px", textAlign: "center" }}>
                                    <p style={{ fontSize: 18, margin: "0 0 4px" }}>{s.icon}</p>
                                    <p style={{ fontWeight: 800, fontSize: 15, color: s.c, margin: "0 0 2px" }}>{s.v}</p>
                                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{s.l}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginBottom: 10 }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={function () { setShowExportOpts(!showExportOpts); }} disabled={dataLoading}
                            style={{ width: "100%", padding: "14px 20px", borderRadius: 14, border: "2px solid " + active.colors[0], background: active.colors[0] + "15", color: active.colors[0], fontFamily: "Poppins", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            <span style={{ fontSize: 20 }}>📤</span>{dataLoading ? "Exporting…" : "Export All Data"}
                            <motion.span animate={{ rotate: showExportOpts ? 180 : 0 }} style={{ marginLeft: "auto" }}>▼</motion.span>
                        </motion.button>
                    </div>
                    <AnimatePresence>
                        {showExportOpts && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 10 }}>
                                <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleExportXLSX} disabled={dataLoading}
                                        style={{ flex: 1, padding: "13px", borderRadius: 12, border: "2px solid #10B981", background: "#D1FAE5", color: "#065F46", fontFamily: "Poppins", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>📊 Excel (.xlsx)</motion.button>
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleExportJSON} disabled={dataLoading}
                                        style={{ flex: 1, padding: "13px", borderRadius: 12, border: "2px solid #3B82F6", background: "#DBEAFE", color: "#1E40AF", fontFamily: "Poppins", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>📋 JSON</motion.button>
                                </div>
                                <p style={{ fontSize: 11, color: "var(--text-secondary)", textAlign: "center", marginTop: 8 }}>Exports all expenses, income and financial data</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={function () { setShowDeleteModal(true); }}
                        style={{ width: "100%", padding: "14px 20px", borderRadius: 14, border: "2px solid #FCA5A5", background: "#FEE2E2", color: "#EF4444", fontFamily: "Poppins", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>🗑️</span> Clear All Data
                    </motion.button>
                </motion.div>

                {/* ── ABOUT ── */}
                <motion.div style={card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div onClick={function () { setShowDev(!showDev); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>ℹ️</span>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>About Spendly</h3>
                        </div>
                        <motion.span animate={{ rotate: showDev ? 180 : 0 }} transition={{ type: "spring" }} style={{ fontSize: 12, color: "var(--text-secondary)", display: "inline-block" }}>▼</motion.span>
                    </div>
                    <AnimatePresence>
                        {showDev && (
                            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 16 }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                style={{ overflow: "hidden", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                                {[
                                    { label: "Application", value: "Spendly" },
                                    { label: "Version", value: "v1.0.0", badge: true },
                                    { label: "Developer", value: "Pranay Kumar Vonamala" },
                                    {
                                        label: "GitHub",
                                        value: "github.com/Pranay-Kumar-02/spendly",
                                        link: "https://github.com/Pranay-Kumar-02/spendly"
                                    },
                                    { label: "Contact", value: "vonamala.pranay@gmail.com", link: "mailto:vonamala.pranay@gmail.com" },
                                    { label: "Phone", value: "+91 6301905015", link: "tel:+916301905015" },
                                ].map(function (item, i) {
                                    return (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 5 ? "1px solid var(--border)" : "none" }}>
                                            <span style={{ fontSize: 13.5, color: "var(--text-secondary)", fontWeight: 500 }}>{item.label}</span>
                                            {item.link
                                                ? <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>{item.value}</a>
                                                : item.badge
                                                    ? <span style={{ fontSize: 11, color: "var(--primary)", background: "rgba(124,58,237,0.12)", padding: "2px 10px", borderRadius: 8, fontWeight: 700, fontFamily: "monospace" }}>{item.value}</span>
                                                    : <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{item.value}</span>
                                            }
                                        </div>
                                    );
                                })}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
                                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>System Status</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <motion.div animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                                            style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                                        <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700, textTransform: "uppercase" }}>Operational</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── APP IDENTITY — kept as requested ── */}
                <motion.div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg," + active.colors[0] + "18," + active.colors[1] + "18)", border: "1px solid " + active.colors[0] + "30" }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                    <motion.span animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                        style={{ fontSize: 44, display: "block", marginBottom: 10 }}>{active.emoji}</motion.span>
                    <p style={{ margin: "0 0 4px" }}>
                        <span style={{ fontWeight: 800, fontSize: 24, background: "linear-gradient(135deg," + active.colors[0] + "," + active.colors[1] + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Spendly</span>
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0" }}>Version 1.0.0</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 18px" }}>AI-Powered Personal Finance Tracker</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
                        {[{ i: "🎨", l: "20 Themes" }, { i: "🌐", l: "14 Languages" }, { i: "🤖", l: "AI Advisor" }, { i: "🔒", l: "Secure" }].map(function (f) {
                            return (
                                <div key={f.l} style={{ textAlign: "center" }}>
                                    <p style={{ fontSize: 22, margin: "0 0 3px" }}>{f.i}</p>
                                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0, fontWeight: 600 }}>{f.l}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ── LOGOUT ── */}
                <motion.button onClick={function () { signOut(auth); }} whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(239,68,68,0.3)" }} whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}
                    style={{ width: "100%", padding: 16, background: "#FEE2E2", color: "#EF4444", border: "2px solid #FCA5A5", borderRadius: 18, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 32, fontFamily: "Poppins", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    🚪 Sign Out
                </motion.button>
            </div>

            {/* ══ PIN MODAL ══ */}
            <AnimatePresence>
                {showPinModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={function () { setShowPinModal(false); setPinInput(""); }}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", zIndex: 9000 }} />
                        <motion.div initial={{ opacity: 0, scale: 0.88, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, y: 30 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--card-bg)", borderRadius: 24, padding: 32, width: "calc(100% - 40px)", maxWidth: 340, zIndex: 9001, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", border: "1px solid var(--border)" }}>
                            <h3 style={{ fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 8, fontSize: 18 }}>{pinLock ? "Change PIN 🔑" : "Set PIN Lock 🔒"}</h3>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", marginBottom: 24 }}>Enter a 4-digit security PIN</p>
                            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24 }}>
                                {[0, 1, 2, 3].map(function (i) {
                                    return (
                                        <motion.div key={i} animate={{ scale: i < pinInput.length ? 1.2 : 1 }} transition={{ type: "spring" }}
                                            style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + active.colors[0], background: i < pinInput.length ? active.colors[0] : "transparent", transition: "background 0.2s" }} />
                                    );
                                })}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map(function (num, i) {
                                    return (
                                        <motion.button key={i} whileTap={{ scale: 0.88 }}
                                            onClick={function () { if (num === "⌫") { setPinInput(function (p) { return p.slice(0, -1); }); } else if (num !== "" && pinInput.length < 4) { setPinInput(function (p) { return p + num; }); } }}
                                            style={{ padding: "16px", borderRadius: 14, border: "2px solid var(--border)", background: num === "" ? "transparent" : "var(--background)", fontFamily: "Poppins", fontSize: 18, fontWeight: 600, cursor: num === "" ? "default" : "pointer", color: "var(--text-primary)" }}>
                                            {num}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <button className="btn-primary" onClick={handleSetPin} disabled={pinInput.length !== 4} style={{ padding: 14, borderRadius: 14, width: "100%", marginBottom: 10 }}>Set PIN ✓</button>
                            <button onClick={function () { setShowPinModal(false); setPinInput(""); }} style={{ width: "100%", padding: 10, background: "transparent", border: "none", color: "var(--text-secondary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ══ CHANGE 3: DELETE MODAL — properly centred with flex container ══ */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
                        {/* backdrop */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={function () { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }} />
                        {/* modal */}
                        <motion.div initial={{ opacity: 0, scale: 0.85, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 40 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            style={{ position: "relative", background: "var(--card-bg)", borderRadius: 24, padding: 32, width: "100%", maxWidth: 400, zIndex: 1, boxShadow: "0 32px 80px rgba(0,0,0,0.45)", border: "2px solid #FCA5A5" }}>
                            <p style={{ fontSize: 48, textAlign: "center", marginBottom: 8 }}>⚠️</p>
                            <h3 style={{ fontWeight: 700, color: "#EF4444", textAlign: "center", marginBottom: 8, fontSize: 18 }}>Delete All Data?</h3>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
                                This permanently deletes all your <strong>expenses, income, goals, bills</strong> and financial data. This <strong>cannot be undone!</strong>
                            </p>
                            <div style={{ background: "#FEE2E2", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
                                <p style={{ fontSize: 12, color: "#991B1B", margin: "0 0 8px", fontWeight: 600 }}>Type <strong>DELETE</strong> to confirm:</p>
                                <input value={deleteConfirmText} onChange={function (e) { setDeleteConfirmText(e.target.value); }} placeholder="Type DELETE here" autoFocus
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid " + (deleteConfirmText === "DELETE" ? "#EF4444" : "#FCA5A5"), background: "white", color: "#EF4444", fontFamily: "Poppins", fontSize: 14, fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={function () { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                                    style={{ flex: 1, padding: 13, border: "2px solid var(--border)", borderRadius: 12, background: "transparent", color: "var(--text-secondary)", fontFamily: "Poppins", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClearData} disabled={deleteConfirmText !== "DELETE" || dataLoading}
                                    style={{
                                        flex: 1, padding: 13, borderRadius: 12, border: "none", fontFamily: "Poppins", fontWeight: 700, fontSize: 14,
                                        cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed",
                                        background: deleteConfirmText === "DELETE" ? "linear-gradient(135deg,#EF4444,#DC2626)" : "rgba(0,0,0,0.08)",
                                        color: deleteConfirmText === "DELETE" ? "white" : "var(--text-secondary)", transition: "all 0.2s"
                                    }}>
                                    {dataLoading ? "Deleting…" : "🗑️ Delete All"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Settings;
