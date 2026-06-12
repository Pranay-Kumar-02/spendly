import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { translations } from "../utils/translations";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [displayName, setDisplayName] = useState("");

    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [cards, setCards] = useState([]);
    const [goals, setGoals] = useState([]);
    const [bills, setBills] = useState([]);
    const [budget, setBudget] = useState(50000);
    const [emergencyData, setEmergencyData] = useState(null);

    const [currentLanguage, setCurrentLanguage] = useState("English");
    const [t, setT] = useState(translations.English);

    // ===== NEW: THEME STATE =====
    const [currentTheme, setCurrentTheme] = useState("purple");

    // ===== THEME APPLICATION =====
    const applyTheme = (theme) => {
        document.body.classList.remove(
            "theme-blue", "theme-green", "theme-orange", "theme-rose"
        );
        if (theme !== "purple") {
            document.body.classList.add(`theme-${theme}`);
        }
    };

    const changeTheme = (theme) => {
        setCurrentTheme(theme);
        applyTheme(theme);
    };

    // Language pivot
    useEffect(() => {
        setT(translations[currentLanguage] || translations.English);
    }, [currentLanguage]);

    // Auth listener
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const snap = await getDoc(doc(db, "settings", currentUser.uid));
                    if (snap.exists()) {
                        const data = snap.data();
                        if (data.displayName) setDisplayName(data.displayName);
                        if (data.language) setCurrentLanguage(data.language);

                        // ===== LOAD SAVED THEME =====
                        if (data.theme) {
                            setCurrentTheme(data.theme);
                            applyTheme(data.theme);
                        }

                        // ===== LOAD SAVED DARK MODE =====
                        if (data.darkMode !== undefined) setDarkMode(data.darkMode);

                    } else if (currentUser.displayName) {
                        setDisplayName(currentUser.displayName);
                    } else {
                        const formatted = currentUser.email
                            ?.split("@")[0]
                            ?.replace(/\./g, " ")
                            ?.replace(/\b\w/g, c => c.toUpperCase());
                        setDisplayName(formatted || "User");
                    }
                } catch (err) {
                    setDisplayName(currentUser.displayName || "User");
                }
            } else {
                setUser(null);
                setDisplayName("");
                setExpenses([]);
                setIncomes([]);
                setCards([]);
                setGoals([]);
                setBills([]);
                setEmergencyData(null);
                setCurrentLanguage("English");
                setCurrentTheme("purple");
                applyTheme("purple");
            }
            setLoading(false);
        });

        return unsubscribeAuth;
    }, []);

    // Firestore data listeners
    useEffect(() => {
        if (!user) return;

        const expQuery = query(collection(db, "expenses"), where("userId", "==", user.uid));
        const incQuery = query(collection(db, "income"), where("userId", "==", user.uid));
        const cardQuery = query(collection(db, "creditcards"), where("userId", "==", user.uid));
        const goalsQuery = query(collection(db, "goals"), where("userId", "==", user.uid));
        const billsQuery = query(collection(db, "bills"), where("userId", "==", user.uid));

        const unsubExpenses = onSnapshot(expQuery, snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setExpenses(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        });

        const unsubIncomes = onSnapshot(incQuery, snap => {
            setIncomes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubCards = onSnapshot(cardQuery, snap => {
            setCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubGoals = onSnapshot(goalsQuery, snap => {
            setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubBills = onSnapshot(billsQuery, snap => {
            setBills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const fetchBudgetsAndEmergency = async () => {
            try {
                const bSnap = await getDoc(doc(db, "budgets", user.uid));
                if (bSnap.exists() && bSnap.data().totalBudget) {
                    setBudget(bSnap.data().totalBudget);
                }
                const eSnap = await getDoc(doc(db, "emergency", user.uid));
                if (eSnap.exists()) {
                    setEmergencyData(eSnap.data());
                }
            } catch (err) { console.error(err); }
        };

        fetchBudgetsAndEmergency();

        return () => {
            unsubExpenses(); unsubIncomes(); unsubCards(); unsubGoals(); unsubBills();
        };
    }, [user]);

    // Dark mode apply
    useEffect(() => {
        if (darkMode) document.body.classList.add("dark-mode");
        else document.body.classList.remove("dark-mode");
    }, [darkMode]);

    return (
        <AppContext.Provider value={{
            user, loading,
            darkMode, setDarkMode,
            displayName, setDisplayName,
            expenses, setExpenses,
            incomes, setIncomes,
            cards, setCards,
            goals, setGoals,
            bills, setBills,
            budget, setBudget,
            emergencyData, setEmergencyData,
            currentLanguage, setCurrentLanguage,
            t,
            // ===== NEW THEME EXPORTS =====
            currentTheme, changeTheme,
        }}>
            {!loading && children}
        </AppContext.Provider>
    );
};
const applyTheme = (theme) => {
    document.body.classList.remove(
        "theme-blue", "theme-green", "theme-orange", "theme-rose",
        "theme-particle-cosmos", "theme-particle-ocean",
        "theme-particle-forest", "theme-particle-sunset", "theme-particle-sakura"
    );
    if (theme !== "purple") {
        document.body.classList.add(`theme-${theme}`);
    }
};
export const useApp = () => useContext(AppContext);