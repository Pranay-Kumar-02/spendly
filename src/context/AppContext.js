import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";
import { translations } from "../utils/translations";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [profilePic, setProfilePic] = useState(null);

    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [cards, setCards] = useState([]);
    const [goals, setGoals] = useState([]);
    const [bills, setBills] = useState([]);
    const [budget, setBudget] = useState(50000);
    const [emergencyData, setEmergencyData] = useState(null);

    const [currentLanguage, setCurrentLanguage] = useState("English");
    const [t, setT] = useState(translations.English);
    const [currentTheme, setCurrentTheme] = useState("purple");

    const ALL_THEME_CLASSES = [
        "theme-blue", "theme-green", "theme-orange", "theme-pink", "theme-indigo",
        "theme-teal", "theme-amber", "theme-crimson", "theme-slate",
        "theme-particle-cosmos", "theme-particle-ocean", "theme-particle-snow",
        "theme-particle-galaxy", "theme-particle-sakura", "theme-particle-matrix",
        "theme-particle-fire", "theme-particle-aurora", "theme-particle-gold", "theme-particle-neon"
    ];

    const applyTheme = (theme) => {
        ALL_THEME_CLASSES.forEach(cls => document.body.classList.remove(cls));
        if (theme !== "purple") document.body.classList.add(`theme-${theme}`);
    };

    const changeTheme = (theme) => {
        setCurrentTheme(theme);
        applyTheme(theme);
    };

    useEffect(() => {
        setT(translations[currentLanguage] || translations.English);
    }, [currentLanguage]);

    // Load settings from Supabase
    const loadSettings = async (userId) => {
        try {
            const { data } = await supabase
                .from("settings")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (data) {
                if (data.display_name || data.displayName) setDisplayName(data.display_name || data.displayName);
                const pic = data.profile_pic || data.profilePic;
                if (pic) setProfilePic(pic);
                if (data.language) setCurrentLanguage(data.language);
                if (data.theme) { setCurrentTheme(data.theme); applyTheme(data.theme); }
                if (data.dark_mode !== undefined) setDarkMode(data.dark_mode);
                if (data.darkMode !== undefined) setDarkMode(data.darkMode);
                if (data.total_budget) setBudget(data.total_budget);
            }
        } catch (err) { console.error("Settings load error:", err); }
    };

    // Load all data
    const loadData = async (userId) => {
        try {
            // Expenses
            const { data: exp } = await supabase
                .from("expenses")
                .select("*")
                .eq("user_id", userId)
                .order("date", { ascending: false });
            if (exp) setExpenses(exp);

            // Income
            const { data: inc } = await supabase
                .from("income")
                .select("*")
                .eq("user_id", userId)
                .order("date", { ascending: false });
            if (inc) setIncomes(inc);

            // Goals
            const { data: gls } = await supabase
                .from("goals")
                .select("*")
                .eq("user_id", userId);
            if (gls) setGoals(gls);

            // Bills
            const { data: bls } = await supabase
                .from("bills")
                .select("*")
                .eq("user_id", userId);
            if (bls) setBills(bls);

            // Credit cards
            const { data: cds } = await supabase
                .from("creditcards")
                .select("*")
                .eq("user_id", userId);
            if (cds) setCards(cds);

            // Budget
            const { data: bgt } = await supabase
                .from("budgets")
                .select("*")
                .eq("id", userId)
                .maybeSingle();
            if (bgt && bgt.total_budget) setBudget(bgt.total_budget);

            // Emergency
            const { data: emg } = await supabase
                .from("emergency")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (emg) setEmergencyData(emg);

        } catch (err) { console.error("Data load error:", err); }
    };

    // Auth listener
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const u = session.user;
                setUser(u);
                const name = u.user_metadata?.display_name
                    || u.email?.split("@")[0]?.replace(/\./g, " ")?.replace(/\b\w/g, c => c.toUpperCase())
                    || "User";
                setDisplayName(name);
                await loadSettings(u.id);
                await loadData(u.id);
            } else {
                setUser(null);
                setDisplayName("");
                setProfilePic(null);
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

        return () => subscription.unsubscribe();
    }, []);

    // Dark mode
    useEffect(() => {
        if (darkMode) document.body.classList.add("dark-mode");
        else document.body.classList.remove("dark-mode");
    }, [darkMode]);

    // Refresh helpers — call these after any write to keep context in sync
    const refreshExpenses = async () => {
        if (!user) return;
        const { data } = await supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false });
        if (data) setExpenses(data);
    };

    const refreshIncomes = async () => {
        if (!user) return;
        const { data } = await supabase.from("income").select("*").eq("user_id", user.id).order("date", { ascending: false });
        if (data) setIncomes(data);
    };

    const refreshGoals = async () => {
        if (!user) return;
        const { data } = await supabase.from("goals").select("*").eq("user_id", user.id);
        if (data) setGoals(data);
    };

    const refreshBills = async () => {
        if (!user) return;
        const { data } = await supabase.from("bills").select("*").eq("user_id", user.id);
        if (data) setBills(data);
    };

    const refreshCards = async () => {
        if (!user) return;
        const { data } = await supabase.from("creditcards").select("*").eq("user_id", user.id);
        if (data) setCards(data);
    };

    const refreshBudget = async () => {
        if (!user) return;
        const { data } = await supabase.from("budgets").select("*").eq("id", user.id).maybeSingle();
        if (data && data.total_budget) setBudget(data.total_budget);
    };

    const refreshEmergency = async () => {
        if (!user) return;
        const { data } = await supabase.from("emergency").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (data) setEmergencyData(data);
    };

    const refreshSettings = async () => {
        if (!user) return;
        await loadSettings(user.id);
    };

    return (
        <AppContext.Provider value={{
            user, loading,
            darkMode, setDarkMode,
            displayName, setDisplayName,
            profilePic, setProfilePic,
            expenses, setExpenses, refreshExpenses,
            incomes, setIncomes, refreshIncomes,
            cards, setCards, refreshCards,
            goals, setGoals, refreshGoals,
            bills, setBills, refreshBills,
            budget, setBudget, refreshBudget,
            emergencyData, setEmergencyData, refreshEmergency,
            refreshSettings,
            currentLanguage, setCurrentLanguage,
            t,
            currentTheme, changeTheme,
        }}>
            {!loading && children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);