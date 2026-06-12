import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import FloatingAI from "./components/FloatingBtn";
import ParticleBackground from "./components/ParticleBackground";
import Subscriptions from './pages/Subscriptions';

import Login from "./pages/Login";
import Home from "./pages/Home";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Budget from "./pages/Budget";
import Reports from "./pages/Reports";
import More from "./pages/More";
import SIP from "./pages/SIP";
import Loans from "./pages/Loans";
import Goals from "./pages/Goals";
import Bills from "./pages/Bills";
import Tax from "./pages/Tax";
import Emergency from "./pages/Emergency";
import NetWorth from "./pages/NetWorth";
import Settings from "./pages/Settings";
import CreditCard from "./pages/CreditCard";
import BottomNav from "./components/BottomNav";
import AIAdvisor from './pages/AIAdvisor';

import "./App.css";

const PrivateRoute = ({ children }) => {
  const { user } = useApp();
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { user } = useApp();

  return (
    <Router>
      {/* ── Particle background — fixed, behind everything ── */}
      {user && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <ParticleBackground />
        </div>
      )}

      {/* ── Main app shell ── */}
      <div className="app" style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/income" element={<PrivateRoute><Income /></PrivateRoute>} />
          <Route path="/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/more" element={<PrivateRoute><More /></PrivateRoute>} />
          <Route path="/sip" element={<PrivateRoute><SIP /></PrivateRoute>} />
          <Route path="/loans" element={<PrivateRoute><Loans /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/bills" element={<PrivateRoute><Bills /></PrivateRoute>} />
          <Route path="/tax" element={<PrivateRoute><Tax /></PrivateRoute>} />
          <Route path="/emergency" element={<PrivateRoute><Emergency /></PrivateRoute>} />
          <Route path="/networth" element={<PrivateRoute><NetWorth /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/creditcard" element={<PrivateRoute><CreditCard /></PrivateRoute>} />
          <Route path="/subscriptions" element={<PrivateRoute><Subscriptions /></PrivateRoute>} />
          <Route path="/advisor" element={<PrivateRoute><AIAdvisor /></PrivateRoute>} />
        </Routes>

        {/* BottomNav renders inside app shell so it picks up theme/dark-mode classes */}
        {user && <BottomNav />}
      </div>

      {/* ── FloatingAI — fixed on top of everything ── */}
      {user && (
        <div style={{ position: "fixed", bottom: 90, right: 20, zIndex: 9999, pointerEvents: "auto" }}>
          <FloatingAI />
        </div>
      )}
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;