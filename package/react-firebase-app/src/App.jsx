import React, { useState, useEffect, useMemo } from "react";
import {
  Upload, Camera, Mic, AlertTriangle, CheckCircle2, MapPin, Syringe,
  Activity, Wifi, WifiOff, Globe, Stethoscope, Users, ChevronRight,
  ChevronLeft, Menu, X, PlusCircle, PhoneCall, ClipboardList, ShieldCheck,
  Sprout, Heart, Clock, Search, Filter, ArrowUpRight, RefreshCw,
  FileText, TrendingUp, Camera as CameraIcon, ChevronDown
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { db } from "./firebaseClient";
import { collection, getDocs, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";

// Symptoms that push a case toward a higher AI risk tier (demo heuristic —
// replace with a real model call to POST /api/analyze later).
const DANGER_SYMPTOMS = ["Fever", "Skin lesions", "Difficulty breathing", "Nasal discharge"];
function assessRisk(symptoms) {
  const hits = symptoms.filter((s) => DANGER_SYMPTOMS.includes(s)).length;
  if (hits >= 2) return { risk: "High", condition: "Suspected Foot-and-Mouth Disease (FMD)", confidence: 78 + hits * 2 };
  if (hits === 1) return { risk: "Moderate", condition: "Possible early-stage infection", confidence: 60 };
  return { risk: "Low", condition: "No significant indicators detected", confidence: 55 };
}

/* ---------------------------------------------------------------------- */
/* Design tokens                                                          */
/* ---------------------------------------------------------------------- */
const C = {
  forest: "#173C2E",
  forestDeep: "#0E271E",
  field: "#4F7A52",
  fieldLight: "#7FA06E",
  cream: "#F6F1E4",
  creamDark: "#EAE1CB",
  paper: "#FFFDF8",
  soil: "#8A6A46",
  soilDark: "#5E4A32",
  amber: "#C97F17",
  amberSoft: "#F4E3C2",
  red: "#B8412F",
  redSoft: "#F3DCD5",
  green: "#2F6B4F",
  greenSoft: "#DCEBDE",
  blue: "#2E5F7C",
  blueSoft: "#DCE9EF",
  ink: "#1C2621",
  inkSoft: "#5B655D",
  line: "#D9CFB6",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
.font-body { font-family: 'IBM Plex Sans', sans-serif; }
.font-mono { font-family: 'IBM Plex Mono', monospace; }
`;

const LANGS = ["English", "हिन्दी", "मराठी", "తెలుగు", "தமிழ்", "বাংলা"];

/* ---------------------------------------------------------------------- */
/* Demo data                                                              */
/* ---------------------------------------------------------------------- */
const ANIMALS = [
  { id: "COW-1024", species: "Cattle", breed: "Gir", age: "4 yrs", sex: "Female", farm: "Rampur Farm", location: "Rampur, MP", status: "Attention", photo: "🐄", lastCheck: "2 days ago" },
  { id: "BUF-0512", species: "Buffalo", breed: "Murrah", age: "6 yrs", sex: "Female", farm: "Rampur Farm", location: "Rampur, MP", status: "Healthy", photo: "🐃", lastCheck: "1 week ago" },
  { id: "GOT-2231", species: "Goat", breed: "Jamunapari", age: "2 yrs", sex: "Male", farm: "Rampur Farm", location: "Rampur, MP", status: "Healthy", photo: "🐐", lastCheck: "3 days ago" },
  { id: "SHP-0087", species: "Sheep", breed: "Deccani", age: "3 yrs", sex: "Female", farm: "Rampur Farm", location: "Rampur, MP", status: "Monitoring", photo: "🐑", lastCheck: "Today" },
];

const CASES = [
  { id: "CASE-4471", animal: "COW-1024", species: "Cattle", farmer: "Ramesh Yadav", location: "Rampur, MP", risk: "High", condition: "Suspected FMD", date: "Today, 9:12 AM", status: "Pending Review", vet: "Unassigned" },
  { id: "CASE-4468", animal: "GOT-1187", species: "Goat", farmer: "Sunita Devi", location: "Katni, MP", risk: "Moderate", condition: "Possible PPR", date: "Today, 7:40 AM", status: "Pending Review", vet: "Unassigned" },
  { id: "CASE-4460", animal: "BUF-0342", species: "Buffalo", farmer: "Iqbal Khan", location: "Jabalpur, MP", risk: "Low", condition: "Minor skin irritation", date: "Yesterday", status: "Verified", vet: "Dr. Anjali Mehta" },
  { id: "CASE-4452", animal: "SHP-0921", species: "Sheep", farmer: "Geeta Bai", location: "Damoh, MP", risk: "High", condition: "Suspected PPR outbreak", date: "Yesterday", status: "Verified", vet: "Dr. R. Kulkarni" },
  { id: "CASE-4447", animal: "COW-0765", species: "Cattle", farmer: "Manoj Singh", location: "Rampur, MP", risk: "Moderate", condition: "Lumpy skin disease watch", date: "2 days ago", status: "Resolved", vet: "Dr. Anjali Mehta" },
];

const SYMPTOMS = [
  "Fever", "Loss of appetite", "Coughing", "Nasal discharge", "Skin lesions",
  "Swelling", "Lethargy", "Difficulty breathing", "Diarrhea", "Reduced milk production",
];

const VACCINES = [
  { vaccine: "FMD (Foot & Mouth Disease)", given: "12 Feb 2026", next: "12 Aug 2026", status: "Upcoming" },
  { vaccine: "HS (Haemorrhagic Septicaemia)", given: "03 Jan 2026", next: "03 Jan 2027", status: "Scheduled" },
  { vaccine: "Brucellosis", given: "20 Jun 2025", next: "One-time (calfhood)", status: "Complete" },
];

const MEDICAL_HISTORY = [
  { date: "14 Jun 2026", event: "Veterinary visit", detail: "Mild lameness, treated with anti-inflammatory course.", type: "visit" },
  { date: "02 Mar 2026", event: "Recovered", detail: "Recovered fully from mastitis treatment.", type: "recovery" },
  { date: "18 Feb 2026", event: "Treatment", detail: "Mastitis detected in rear left quarter, antibiotic course started.", type: "treatment" },
  { date: "12 Feb 2026", event: "Illness reported", detail: "Farmer reported swelling and reduced milk yield.", type: "illness" },
];

const AI_ASSESSMENTS = [
  { date: "Today, 9:12 AM", risk: "High", condition: "Suspected FMD", verified: "Pending veterinary review" },
  { date: "18 Feb 2026", risk: "Moderate", condition: "Possible mastitis", verified: "Verified by Dr. Anjali Mehta" },
  { date: "03 Nov 2025", risk: "Low", condition: "No significant indicators", verified: "Not required" },
];

const HEALTH_TREND = [
  { month: "Mar", score: 88 }, { month: "Apr", score: 90 }, { month: "May", score: 85 },
  { month: "Jun", score: 76 }, { month: "Jul", score: 82 }, { month: "Aug", score: 71 },
];

const REGIONS = [
  { name: "Rampur", x: 130, y: 90, level: "high", cases: 6 },
  { name: "Katni", x: 230, y: 60, level: "moderate", cases: 3 },
  { name: "Jabalpur", x: 300, y: 140, level: "normal", cases: 1 },
  { name: "Damoh", x: 180, y: 190, level: "high", cases: 5 },
  { name: "Sagar", x: 320, y: 220, level: "moderate", cases: 2 },
  { name: "Chhindwara", x: 400, y: 100, level: "normal", cases: 0 },
  { name: "Narsinghpur", x: 250, y: 260, level: "normal", cases: 1 },
];

// Demo-only account directory for the Admin dashboard. Not connected to any
// real auth system yet — see Firestore note in AdminDashboard below.
const USERS = [
  { id: "U-1001", name: "Ramesh Yadav", role: "Farmer", location: "Rampur, MP", joined: "12 Jan 2026", status: "Active" },
  { id: "U-1002", name: "Sunita Devi", role: "Farmer", location: "Katni, MP", joined: "18 Jan 2026", status: "Active" },
  { id: "U-1003", name: "Iqbal Khan", role: "Farmer", location: "Jabalpur, MP", joined: "22 Jan 2026", status: "Active" },
  { id: "U-1004", name: "Geeta Bai", role: "Farmer", location: "Damoh, MP", joined: "02 Feb 2026", status: "Active" },
  { id: "U-2001", name: "Dr. Anjali Mehta", role: "Veterinarian", location: "Rampur Block", joined: "05 Jan 2026", status: "Active" },
  { id: "U-2002", name: "Dr. R. Kulkarni", role: "Veterinarian", location: "Damoh Block", joined: "09 Jan 2026", status: "Active" },
  { id: "U-3001", name: "Admin User", role: "Admin", location: "HQ", joined: "01 Jan 2026", status: "Active" },
];

// Demo user directory for the login / registration / admin flow. This is
// client-side only (no real authentication) — good enough to demo the full
// UI flow. Swap for Firebase Auth + a real "users" collection for
// production. New registrations are appended to this list in App() state,
// and (when Firebase is configured) also written to the "users" collection.
const MOCK_USERS = [
  { id: "U001", name: "Ramesh Yadav", role: "farmer", identifier: "ramesh@farm.in", password: "demo123", location: "Rampur, MP", farm: "Rampur Farm", status: "Active" },
  { id: "U002", name: "Dr. Anjali Mehta", role: "vet", identifier: "anjali@vet.in", password: "demo123", location: "Rampur Block, MP", license: "VET-MP-3321", status: "Active" },
  { id: "U003", name: "Admin", role: "admin", identifier: "admin@pashusuraksha.in", password: "admin123", location: "—", status: "Active" },
  { id: "U004", name: "Sunita Devi", role: "farmer", identifier: "sunita@farm.in", password: "demo123", location: "Katni, MP", farm: "Devi Farm", status: "Active" },
  { id: "U005", name: "Dr. R. Kulkarni", role: "vet", identifier: "kulkarni@vet.in", password: "demo123", location: "Damoh Block, MP", license: "VET-MP-1187", status: "Pending Verification" },
];

const riskColor = (risk) => {
  const r = risk.toLowerCase();
  if (r === "high") return C.red;
  if (r === "moderate" || r === "increased activity") return C.amber;
  return C.green;
};
const riskSoft = (risk) => {
  const r = risk.toLowerCase();
  if (r === "high") return C.redSoft;
  if (r === "moderate") return C.amberSoft;
  return C.greenSoft;
};

/* ---------------------------------------------------------------------- */
/* Small shared components                                                */
/* ---------------------------------------------------------------------- */
function RiskBadge({ risk, size = "md" }) {
  const color = riskColor(risk);
  const bg = riskSoft(risk);
  const Icon = risk.toLowerCase() === "high" ? AlertTriangle : risk.toLowerCase() === "moderate" ? Clock : CheckCircle2;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-body font-semibold ${size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
      style={{ backgroundColor: bg, color }}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      {risk} risk
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    "Pending Review": { bg: C.amberSoft, fg: C.amber },
    "Verified": { bg: C.blueSoft, fg: C.blue },
    "Resolved": { bg: C.greenSoft, fg: C.green },
    "Healthy": { bg: C.greenSoft, fg: C.green },
    "Attention": { bg: C.redSoft, fg: C.red },
    "Monitoring": { bg: C.amberSoft, fg: C.amber },
  };
  const s = map[status] || { bg: C.creamDark, fg: C.inkSoft };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-body font-semibold" style={{ backgroundColor: s.bg, color: s.fg }}>
      {status}
    </span>
  );
}

function KPICard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl p-5 flex items-start justify-between" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
      <div>
        <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: C.inkSoft }}>{label}</p>
        <p className="font-display text-3xl" style={{ color: C.forest }}>{value}</p>
      </div>
      <div className="rounded-xl p-2.5" style={{ backgroundColor: accent + "22" }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
    </div>
  );
}

function FieldRow({ tall }) {
  // signature "plowed field" divider motif
  return (
    <svg viewBox="0 0 400 20" className={`w-full ${tall ? "h-8" : "h-4"}`} preserveAspectRatio="none">
      {Array.from({ length: 20 }).map((_, i) => (
        <path key={i} d={`M ${i * 20} 20 Q ${i * 20 + 10} 0 ${i * 20 + 20} 20`} fill="none" stroke={C.line} strokeWidth="1.2" />
      ))}
    </svg>
  );
}

function SectionEyebrow({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-px w-8" style={{ backgroundColor: C.soil }} />
      <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: C.soil }}>{children}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Top navigation                                                         */
/* ---------------------------------------------------------------------- */
function TopNav({ view, setView, role, setRole, online, setOnline, lang, setLang, syncCount, dbStatus, authUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const publicLinks = [
    { key: "landing", label: "Home" },
    { key: "how", label: "How It Works" },
    { key: "tech", label: "AI Technology" },
    { key: "regional", label: "Disease Monitoring" },
    { key: "impact", label: "Impact" },
  ];
  const appLinks = role === "admin"
    ? [{ key: "admin", label: "Admin Panel" }, { key: "vet", label: "All Cases" }, { key: "regional", label: "Regional Monitor" }]
    : role === "farmer"
    ? [{ key: "farmer", label: "My Farm" }, { key: "analyze", label: "Analyze Animal" }, { key: "animal", label: "Health Records" }]
    : [{ key: "vet", label: "Case Dashboard" }, { key: "regional", label: "Regional Monitor" }, { key: "animal", label: "Animal Records" }];
  const entryViews = ["landing", "how", "tech", "impact", "login", "register"];

  return (
    <div className="sticky top-0 z-40" style={{ backgroundColor: C.forestDeep }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setView("landing")} className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🐄</span>
            <span className="font-display text-xl text-white tracking-tight">PashuSuraksha</span>
          </button>

          <nav className="hidden lg:flex items-center gap-7">
            {(entryViews.includes(view) ? publicLinks : appLinks).map((l) => (
              <button
                key={l.key}
                onClick={() => setView(l.key)}
                className="font-body text-sm transition-colors"
                style={{ color: view === l.key ? C.fieldLight : "#D8D0BE" }}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {dbStatus && (
              <span className="rounded-full px-3 py-1.5 font-mono text-[10px]" style={{
                backgroundColor: dbStatus === "connected" ? "#1F4A38" : dbStatus === "error" ? "#4A2A22" : "#3A3A22",
                color: dbStatus === "connected" ? "#9FD9B4" : dbStatus === "error" ? "#E8AA9B" : "#D9CC8F",
              }}>
                {dbStatus === "connected" ? "● Firebase live" : dbStatus === "error" ? "● Firebase error — demo data" : dbStatus === "connecting" ? "● connecting…" : "● demo data"}
              </span>
            )}
            <button onClick={() => setOnline((o) => !o)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs" style={{ backgroundColor: online ? "#1F4A38" : "#4A2A22", color: online ? "#9FD9B4" : "#E8AA9B" }}>
              {online ? <Wifi size={13} /> : <WifiOff size={13} />}
              {online ? "Online" : `Offline · ${syncCount} pending`}
            </button>

            <div className="relative">
              <button onClick={() => setLangOpen((o) => !o)} className="flex items-center gap-1 rounded-full px-3 py-1.5 font-body text-xs text-[#D8D0BE]" style={{ border: "1px solid #3A5548" }}>
                <Globe size={13} /> {lang} <ChevronDown size={12} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl overflow-hidden shadow-xl" style={{ backgroundColor: C.paper }}>
                  {LANGS.map((l) => (
                    <button key={l} onClick={() => { setLang(l); setLangOpen(false); }} className="block w-full text-left px-3 py-2 font-body text-sm hover:bg-black/5" style={{ color: C.ink }}>{l}</button>
                  ))}
                </div>
              )}
            </div>

            {authUser ? (
              <>
                <div className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1" style={{ backgroundColor: "#1F4A38" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-body text-[10px] font-bold" style={{ backgroundColor: C.fieldLight, color: C.forestDeep }}>
                    {authUser.name.charAt(0)}
                  </span>
                  <span className="font-body text-xs" style={{ color: "#D8D0BE" }}>{authUser.name.split(" ")[0]} · <span className="capitalize">{authUser.role}</span></span>
                </div>
                <button onClick={onLogout} className="rounded-full px-4 py-2 font-body text-xs font-semibold" style={{ border: "1px solid #3A5548", color: "#D8D0BE" }}>Logout</button>
              </>
            ) : (
              <>
                <div className="flex rounded-full p-0.5" style={{ backgroundColor: "#1F4A38" }}>
                  <button onClick={() => { setRole("farmer"); setView("farmer"); }} className="rounded-full px-3 py-1.5 font-body text-xs font-medium" style={{ backgroundColor: role === "farmer" ? C.field : "transparent", color: role === "farmer" ? "white" : "#B9CFC1" }}>Farmer</button>
                  <button onClick={() => { setRole("vet"); setView("vet"); }} className="rounded-full px-3 py-1.5 font-body text-xs font-medium" style={{ backgroundColor: role === "vet" ? C.field : "transparent", color: role === "vet" ? "white" : "#B9CFC1" }}>Veterinarian</button>
                </div>
                <button onClick={() => setView("login")} className="rounded-full px-4 py-2 font-body text-sm font-semibold" style={{ backgroundColor: C.amber, color: "white" }}>Login</button>
              </>
            )}
          </div>

          <button className="lg:hidden text-white" onClick={() => setOpen((o) => !o)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden px-5 pb-5 space-y-1" style={{ backgroundColor: C.forestDeep }}>
          {[...publicLinks, ...appLinks].map((l) => (
            <button key={l.key} onClick={() => { setView(l.key); setOpen(false); }} className="block w-full text-left py-2 font-body text-sm text-[#D8D0BE]">{l.label}</button>
          ))}
          {authUser ? (
            <div className="flex items-center justify-between pt-3">
              <span className="font-body text-xs" style={{ color: "#D8D0BE" }}>{authUser.name} · <span className="capitalize">{authUser.role}</span></span>
              <button onClick={() => { onLogout(); setOpen(false); }} className="rounded-full px-4 py-2 font-body text-xs font-semibold text-white" style={{ backgroundColor: C.red }}>Logout</button>
            </div>
          ) : (
            <div className="flex gap-2 pt-3">
              <button onClick={() => { setView("login"); setOpen(false); }} className="flex-1 rounded-full py-2 font-body text-xs font-medium text-white" style={{ backgroundColor: C.amber }}>Login</button>
              <button onClick={() => { setView("register"); setOpen(false); }} className="flex-1 rounded-full py-2 font-body text-xs font-medium text-white" style={{ backgroundColor: C.blue }}>Register</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* LANDING PAGE                                                           */
/* ---------------------------------------------------------------------- */
function Hero({ setView }) {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: C.forest }}>
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: `repeating-linear-gradient(115deg, transparent, transparent 38px, ${C.cream} 38px, ${C.cream} 39px)`
      }} />
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 relative">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 font-mono text-xs" style={{ backgroundColor: "#1F4A38", color: "#9FD9B4" }}>
              <Sprout size={13} /> AI-assisted animal health, built for the field
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-white mb-6">
              Early Detection.<br />Healthier Livestock.<br />
              <span style={{ color: C.fieldLight }}>Stronger Rural Communities.</span>
            </h1>
            <p className="font-body text-base md:text-lg mb-8 max-w-lg" style={{ color: "#D8D0BE" }}>
              An AI-powered livestock health platform that combines image recognition, symptom analysis, and contextual health data to detect potential diseases early and connect high-risk cases with veterinary support.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => setView("analyze")} className="rounded-full px-6 py-3 font-body font-semibold text-sm flex items-center gap-2" style={{ backgroundColor: C.amber, color: "white" }}>
                Analyze Livestock <ChevronRight size={16} />
              </button>
              <button onClick={() => setView("how")} className="rounded-full px-6 py-3 font-body font-semibold text-sm border" style={{ borderColor: "#3A5548", color: "white" }}>
                Explore How It Works
              </button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {["AI-Powered", "Multimodal Analysis", "Offline-First", "Multi-Language", "Veterinary Verified"].map((t) => (
                <span key={t} className="font-mono text-xs" style={{ color: "#8FA898" }}>· {t}</span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[28px] p-6 md:p-8" style={{ backgroundColor: C.paper }}>
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-xs" style={{ color: C.inkSoft }}>CASE-4471 · Live scan preview</span>
                <RiskBadge risk="High" size="sm" />
              </div>
              <div className="rounded-2xl h-40 flex items-center justify-center text-6xl mb-5" style={{ backgroundColor: C.creamDark }}>🐄</div>
              <div className="space-y-2.5">
                <div className="flex justify-between font-body text-sm"><span style={{ color: C.inkSoft }}>Symptoms detected</span><span className="font-medium" style={{ color: C.ink }}>Fever, lesions</span></div>
                <div className="flex justify-between font-body text-sm"><span style={{ color: C.inkSoft }}>AI confidence</span><span className="font-medium" style={{ color: C.ink }}>82%</span></div>
                <div className="flex justify-between font-body text-sm"><span style={{ color: C.inkSoft }}>Vet review</span><span className="font-medium" style={{ color: C.amber }}>Requested</span></div>
              </div>
              <div className="mt-5 pt-5 flex items-center gap-2" style={{ borderTop: `1px solid ${C.line}` }}>
                <Stethoscope size={15} style={{ color: C.blue }} />
                <span className="font-body text-xs" style={{ color: C.inkSoft }}>Escalated to Dr. Anjali Mehta, Rampur block</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl px-4 py-3 hidden sm:flex items-center gap-2" style={{ backgroundColor: C.amber }}>
              <Users size={16} className="text-white" />
              <span className="font-body text-xs font-semibold text-white">Farmer → AI → Vet, in minutes</span>
            </div>
          </div>
        </div>
      </div>
      <FieldRow tall />
    </section>
  );
}

function ProblemSection() {
  const cards = [
    { icon: Clock, title: "Late Detection", body: "Disease symptoms may go unnoticed until the condition becomes serious." },
    { icon: Stethoscope, title: "Limited Veterinary Access", body: "Rural farmers may have difficulty accessing veterinary professionals quickly." },
    { icon: WifiOff, title: "Connectivity Challenges", body: "Remote communities may have unreliable internet connectivity." },
    { icon: FileText, title: "Fragmented Health Records", body: "Vaccination and medical records are often difficult to maintain and access." },
  ];
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: C.cream }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionEyebrow>The problem</SectionEyebrow>
        <h2 className="font-display text-3xl md:text-4xl max-w-2xl mb-14" style={{ color: C.forest }}>
          Livestock disease can spread before help arrives.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
              <div className="rounded-xl w-10 h-10 flex items-center justify-center mb-5" style={{ backgroundColor: C.redSoft }}>
                <c.icon size={18} style={{ color: C.red }} />
              </div>
              <h3 className="font-display text-lg mb-2" style={{ color: C.ink }}>{c.title}</h3>
              <p className="font-body text-sm leading-relaxed" style={{ color: C.inkSoft }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionTimeline({ setView }) {
  const steps = [
    { n: "01", title: "Report", body: "Farmer uploads an animal photo and reports symptoms.", icon: Camera },
    { n: "02", title: "Analyze", body: "AI models analyze visual and textual information.", icon: Activity },
    { n: "03", title: "Alert", body: "High-risk cases are escalated to veterinarians.", icon: AlertTriangle },
    { n: "04", title: "Manage", body: "Animal health, vaccination, and medical records are stored digitally.", icon: ClipboardList },
  ];
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: C.forest }} id="how">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionEyebrow>the workflow</SectionEyebrow>
        <h2 className="font-display text-3xl md:text-4xl max-w-2xl mb-14 text-white">
          One intelligent platform for livestock health.
        </h2>
        <div className="grid md:grid-cols-4 gap-6 relative">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < 3 && <div className="hidden md:block absolute top-6 left-[60%] w-full h-px" style={{ backgroundColor: "#3A5548" }} />}
              <div className="relative z-10 rounded-2xl p-6 h-full" style={{ backgroundColor: "#1F4A38" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs" style={{ color: C.fieldLight }}>{s.n}</span>
                  <s.icon size={16} style={{ color: C.fieldLight }} />
                </div>
                <h3 className="font-display text-xl text-white mb-2">{s.title}</h3>
                <p className="font-body text-sm" style={{ color: "#B9CFC1" }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <button onClick={() => setView("analyze")} className="rounded-full px-6 py-3 font-body font-semibold text-sm inline-flex items-center gap-2" style={{ backgroundColor: C.amber, color: "white" }}>
            Try the demo flow <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function TechArchitecture() {
  const rows = [
    { label: "Image data", sub: "Image preprocessing → Computer vision model" },
    { label: "Symptom data", sub: "Symptom parsing → Language / classification model" },
    { label: "Health & regional data", sub: "Contextual analysis" },
  ];
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: C.cream }} id="tech">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionEyebrow>ai technology</SectionEyebrow>
        <h2 className="font-display text-3xl md:text-4xl max-w-2xl mb-4" style={{ color: C.forest }}>
          Multimodal AI for smarter livestock health.
        </h2>
        <p className="font-body text-sm max-w-xl mb-14" style={{ color: C.inkSoft }}>
          The platform combines computer vision, symptom intelligence, contextual health data, and a fused risk-assessment layer.
        </p>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            {[
              { icon: CameraIcon, title: "Computer Vision", body: "Analyzes livestock images for visible signs and abnormalities." },
              { icon: Mic, title: "Symptom Intelligence", body: "Processes farmer-reported symptoms using natural-language/symptom parsing." },
              { icon: MapPin, title: "Contextual Health Data", body: "Uses animal history and regional information." },
              { icon: Activity, title: "Risk Assessment", body: "Combines multiple signals to prioritize cases." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl p-5" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
                <div className="rounded-xl w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.greenSoft }}>
                  <f.icon size={18} style={{ color: C.green }} />
                </div>
                <div>
                  <h4 className="font-display text-base mb-1" style={{ color: C.ink }}>{f.title}</h4>
                  <p className="font-body text-sm" style={{ color: C.inkSoft }}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-7" style={{ backgroundColor: C.forestDeep }}>
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.label} className="rounded-xl p-4" style={{ backgroundColor: "#1F4A38" }}>
                  <p className="font-mono text-xs mb-1" style={{ color: C.fieldLight }}>{r.label}</p>
                  <p className="font-body text-sm text-white">{r.sub}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center my-3"><div className="w-px h-6" style={{ backgroundColor: "#3A5548" }} /></div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: C.amber }}>
              <p className="font-body text-sm font-semibold text-white">Multimodal fusion → Risk assessment</p>
            </div>
            <div className="flex justify-center my-3"><div className="w-px h-6" style={{ backgroundColor: "#3A5548" }} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg py-2 text-center font-body text-xs font-semibold" style={{ backgroundColor: C.greenSoft, color: C.green }}>Low</div>
              <div className="rounded-lg py-2 text-center font-body text-xs font-semibold" style={{ backgroundColor: C.amberSoft, color: C.amber }}>Moderate</div>
              <div className="rounded-lg py-2 text-center font-body text-xs font-semibold" style={{ backgroundColor: C.redSoft, color: C.red }}>High</div>
            </div>
            <p className="font-body text-xs text-center mt-3" style={{ color: "#8FA898" }}>Guidance · Monitoring · Veterinary alert</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  const stack = [
    { name: "Python", tag: "AI / Backend", uses: ["Machine learning", "Image processing", "AI pipeline", "Backend APIs"] },
    { name: "JavaScript", tag: "Web", uses: ["Responsive interfaces", "Dashboards", "Real-time monitoring"] },
    { name: "Dart + Flutter", tag: "Mobile", uses: ["Cross-platform app", "Farmer-facing experience"] },
    { name: "SQL", tag: "Database", uses: ["Health records", "User accounts", "Vaccination schedules", "Case history"] },
  ];
  return (
    <section className="py-20 md:py-24" style={{ backgroundColor: C.paper }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionEyebrow>technical stack</SectionEyebrow>
        <h2 className="font-display text-3xl md:text-4xl mb-12" style={{ color: C.forest }}>Built to reach a real deployment.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stack.map((s) => (
            <div key={s.name} className="rounded-2xl p-6" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}` }}>
              <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: C.soil }}>{s.tag}</p>
              <h3 className="font-display text-xl mb-4" style={{ color: C.ink }}>{s.name}</h3>
              <ul className="space-y-1.5">
                {s.uses.map((u) => (
                  <li key={u} className="font-body text-xs flex items-start gap-1.5" style={{ color: C.inkSoft }}>
                    <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: C.soil }} /> {u}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RiskMitigation() {
  const cards = [
    { title: "Data Reliability", body: "Uses verified veterinary datasets and multimodal inputs to reduce false positives." },
    { title: "Connectivity", body: "Offline-first functionality allows data to synchronize when connectivity returns." },
    { title: "Usability", body: "Simple multilingual and voice-assisted interfaces support different levels of digital literacy." },
    { title: "Expert Supervision", body: "High-risk AI assessments require verification by qualified veterinarians." },
  ];
  return (
    <section className="py-20 md:py-24" style={{ backgroundColor: C.cream }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionEyebrow>real-world conditions</SectionEyebrow>
        <h2 className="font-display text-3xl md:text-4xl mb-12" style={{ color: C.forest }}>Designed for real-world rural conditions.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
              <h3 className="font-display text-lg mb-2" style={{ color: C.forest }}>{c.title}</h3>
              <p className="font-body text-sm" style={{ color: C.inkSoft }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImpactSection() {
  const groups = [
    { title: "Social Impact", items: ["Protect rural livelihoods", "Improve animal welfare", "Expand access to digital health resources", "Empower farming communities"] },
    { title: "Economic Impact", items: ["Reduce livestock mortality", "Reduce emergency treatment costs", "Protect farmer income", "Enable earlier intervention"] },
    { title: "Environmental & Systemic Impact", items: ["Reduce unnecessary antibiotic usage", "Support early outbreak detection", "Improve livestock health surveillance", "Encourage sustainable livestock management"] },
  ];
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: C.forest }} id="impact">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionEyebrow>impact</SectionEyebrow>
        <h2 className="font-display text-3xl md:text-4xl max-w-2xl mb-14 text-white">Impact designed around people, not metrics we haven't earned.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {groups.map((g) => (
            <div key={g.title} className="rounded-2xl p-6" style={{ backgroundColor: "#1F4A38" }}>
              <h3 className="font-display text-xl text-white mb-4">{g.title}</h3>
              <ul className="space-y-2.5">
                {g.items.map((it) => (
                  <li key={it} className="font-body text-sm flex items-start gap-2" style={{ color: "#B9CFC1" }}>
                    <Heart size={13} className="mt-1 shrink-0" style={{ color: C.fieldLight }} /> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResearchAbout() {
  return (
    <section className="py-20 md:py-24" style={{ backgroundColor: C.cream }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-2 gap-14">
        <div>
          <SectionEyebrow>research & standards</SectionEyebrow>
          <h2 className="font-display text-2xl md:text-3xl mb-4" style={{ color: C.forest }}>Grounded in established animal-health practice.</h2>
          <p className="font-body text-sm mb-4" style={{ color: C.inkSoft }}>
            The platform's design is informed by digital livestock surveillance, animal health monitoring, disease reporting, multimodal deep learning, computer vision, and early livestock disease detection research — including frameworks referenced by the FAO (Food and Agriculture Organization) and WOAH-WAHIS (World Organisation for Animal Health).
          </p>
          <p className="font-body text-xs" style={{ color: C.inkSoft }}>
            PashuSuraksha is not officially endorsed or certified by FAO or WOAH. These organizations are referenced as sources of domain practice, not as partners.
          </p>
        </div>
        <div>
          <SectionEyebrow>about the project</SectionEyebrow>
          <h2 className="font-display text-2xl md:text-3xl mb-4" style={{ color: C.forest }}>Our mission</h2>
          <p className="font-body text-sm mb-6" style={{ color: C.inkSoft }}>
            To make early livestock disease detection and veterinary support more accessible to rural communities through responsible AI.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[["Problem", "Late detection, thin vet coverage"], ["Vision", "AI-assisted, vet-verified care"], ["Technology", "Multimodal AI, offline-first"], ["Users", "Farmers & veterinarians"]].map(([k, v]) => (
              <div key={k} className="rounded-xl p-4" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
                <p className="font-mono text-xs uppercase mb-1" style={{ color: C.soil }}>{k}</p>
                <p className="font-body text-sm" style={{ color: C.ink }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ setView }) {
  return (
    <footer style={{ backgroundColor: C.forestDeep }}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          <div>
            <span className="font-display text-xl text-white">PashuSuraksha</span>
            <p className="font-body text-sm mt-3 max-w-xs" style={{ color: "#8FA898" }}>AI decision-support for livestock health — veterinarian-verified, offline-first, built for rural India.</p>
          </div>
          <div className="flex gap-14">
            <div>
              <p className="font-mono text-xs uppercase mb-3" style={{ color: "#8FA898" }}>Platform</p>
              <div className="flex flex-col gap-2">
                {[["farmer", "Farmer Dashboard"], ["vet", "Veterinarian Dashboard"], ["regional", "Regional Monitor"]].map(([k, v]) => (
                  <button key={k} onClick={() => setView(k)} className="font-body text-sm text-left" style={{ color: "#D8D0BE" }}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-xs uppercase mb-3" style={{ color: "#8FA898" }}>Standards</p>
              <div className="flex flex-col gap-2 font-body text-sm" style={{ color: "#D8D0BE" }}>
                <span>FAO reference</span>
                <span>WOAH-WAHIS reference</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-6 flex flex-col sm:flex-row justify-between gap-2" style={{ borderTop: "1px solid #2A4A3C" }}>
          <p className="font-body text-xs" style={{ color: "#6E8578" }}>Prototype built for hackathon demonstration. Demo data is fictional and does not represent real veterinary diagnoses.</p>
          <p className="font-body text-xs" style={{ color: "#6E8578" }}>© 2026 PashuSuraksha</p>
        </div>
      </div>
    </footer>
  );
}

function LandingPage({ setView }) {
  return (
    <>
      <Hero setView={setView} />
      <ProblemSection />
      <SolutionTimeline setView={setView} />
      <TechArchitecture />
      <TechStack />
      <RiskMitigation />
      <ImpactSection />
      <ResearchAbout />
      <Footer setView={setView} />
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* FARMER DASHBOARD                                                       */
/* ---------------------------------------------------------------------- */
function FarmerDashboard({ setView, online, syncCount, animals = ANIMALS, vaccinations = VACCINES }) {
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider mb-1" style={{ color: C.soil }}>Rampur Farm</p>
            <h1 className="font-display text-3xl" style={{ color: C.forest }}>Namaste, Ramesh 👋</h1>
          </div>
          {!online && (
            <div className="rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: C.redSoft }}>
              <WifiOff size={15} style={{ color: C.red }} />
              <span className="font-body text-sm font-medium" style={{ color: C.red }}>{syncCount} cases waiting to sync</span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Analyze Animal", icon: Activity, action: () => setView("analyze"), accent: C.amber },
            { label: "Add Animal", icon: PlusCircle, action: () => {}, accent: C.field },
            { label: "Vaccination Records", icon: Syringe, action: () => setView("animal"), accent: C.blue },
            { label: "Contact Veterinarian", icon: PhoneCall, action: () => {}, accent: C.red },
          ].map((a) => (
            <button key={a.label} onClick={a.action} className="rounded-2xl p-5 text-left" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
              <div className="rounded-xl w-10 h-10 flex items-center justify-center mb-4" style={{ backgroundColor: a.accent + "22" }}>
                <a.icon size={18} style={{ color: a.accent }} />
              </div>
              <p className="font-body text-sm font-semibold" style={{ color: C.ink }}>{a.label}</p>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-display text-xl mb-4" style={{ color: C.forest }}>My Animals</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {animals.map((a) => (
                <button key={a.id} onClick={() => setView("animal")} className="rounded-2xl p-5 text-left" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{a.photo}</span>
                    <StatusPill status={a.status} />
                  </div>
                  <p className="font-display text-lg mb-0.5" style={{ color: C.ink }}>{a.id}</p>
                  <p className="font-body text-xs mb-3" style={{ color: C.inkSoft }}>{a.breed} · {a.age} · {a.sex}</p>
                  <p className="font-body text-xs flex items-center gap-1" style={{ color: C.inkSoft }}><Clock size={11} /> Last check: {a.lastCheck}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl p-5" style={{ backgroundColor: C.redSoft }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} style={{ color: C.red }} />
                <h3 className="font-display text-base" style={{ color: C.red }}>Health Alerts</h3>
              </div>
              <p className="font-body text-sm mb-1" style={{ color: C.ink }}>COW-1024 shows signs that may need urgent attention.</p>
              <p className="font-body text-xs mb-3" style={{ color: C.inkSoft }}>A veterinarian has been notified and will follow up shortly.</p>
              <button onClick={() => setView("animal")} className="font-body text-xs font-semibold flex items-center gap-1" style={{ color: C.red }}>View case <ArrowUpRight size={12} /></button>
            </div>

            <div className="rounded-2xl p-5" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
              <div className="flex items-center gap-2 mb-4">
                <Syringe size={16} style={{ color: C.blue }} />
                <h3 className="font-display text-base" style={{ color: C.ink }}>Upcoming Vaccinations</h3>
              </div>
              <div className="space-y-3">
                {vaccinations.slice(0, 2).map((v) => (
                  <div key={v.vaccine} className="flex justify-between gap-3">
                    <div>
                      <p className="font-body text-sm" style={{ color: C.ink }}>{v.vaccine}</p>
                      <p className="font-body text-xs" style={{ color: C.inkSoft }}>Due {v.next}</p>
                    </div>
                    <StatusPill status={v.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* AI ANALYSIS FLOW                                                       */
/* ---------------------------------------------------------------------- */
function AnalyzePage({ setView, online, setSyncCount, addCase }) {
  const [step, setStep] = useState("form"); // form -> analyzing -> done
  const [symptoms, setSymptoms] = useState(["Fever", "Skin lesions"]);
  const [imgQuality, setImgQuality] = useState("good");
  const [note, setNote] = useState("");
  const [result, setResult] = useState(null);

  const toggleSymptom = (s) => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const runAnalysis = () => {
    setStep("analyzing");
    setTimeout(() => {
      const assessment = assessRisk(symptoms);
      const newCase = {
        id: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
        animal: "COW-1024",
        species: "Cattle",
        farmer: "Ramesh Yadav",
        location: "Rampur, MP",
        risk: assessment.risk,
        condition: assessment.condition,
        confidence: assessment.confidence,
        symptoms,
        date: "Just now",
        status: "Pending Review",
        vet: "Unassigned",
      };
      addCase?.(newCase);
      if (!online) setSyncCount((c) => c + 1);
      setResult(newCase);
      setStep("done");
    }, 1800);
  };

  if (step === "done" && result) return <ResultsPage setView={setView} goBack={() => setStep("form")} online={online} result={result} />;

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-10">
        <button onClick={() => setView("farmer")} className="flex items-center gap-1 font-body text-sm mb-6" style={{ color: C.inkSoft }}>
          <ChevronLeft size={15} /> Back to My Farm
        </button>
        <SectionEyebrow>step 1 of 2 · report</SectionEyebrow>
        <h1 className="font-display text-3xl mb-2" style={{ color: C.forest }}>AI Livestock Health Analysis</h1>
        <p className="font-body text-sm mb-8" style={{ color: C.inkSoft }}>Upload a photo and describe what you're seeing — AI analysis is a decision-support tool, not a confirmed diagnosis.</p>

        {!online && (
          <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-2" style={{ backgroundColor: C.amberSoft }}>
            <WifiOff size={15} style={{ color: C.amber }} />
            <span className="font-body text-sm" style={{ color: C.amber }}>You're offline. This case will be stored locally and synced automatically.</span>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-8">
            {/* Animal info */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
              <h2 className="font-display text-lg mb-4" style={{ color: C.ink }}>Animal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[["Animal ID", "COW-1024"], ["Species", "Cattle"], ["Breed", "Gir"], ["Age", "4 years"], ["Sex", "Female"], ["Location", "Rampur, MP"]].map(([label, val]) => (
                  <div key={label}>
                    <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>{label}</label>
                    <input defaultValue={val} className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
              <h2 className="font-display text-lg mb-4" style={{ color: C.ink }}>Upload a clear photo of the affected animal</h2>
              <div className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-10 mb-4" style={{ borderColor: C.line, backgroundColor: C.cream }}>
                <span className="text-5xl mb-3">🐄</span>
                <div className="flex gap-3 mb-3">
                  <button className="rounded-full px-4 py-2 font-body text-xs font-semibold flex items-center gap-1.5" style={{ backgroundColor: C.forest, color: "white" }}><Camera size={13} /> Take Photo</button>
                  <button className="rounded-full px-4 py-2 font-body text-xs font-semibold flex items-center gap-1.5" style={{ border: `1px solid ${C.soil}`, color: C.soil }}><Upload size={13} /> Upload from Gallery</button>
                </div>
                <p className="font-body text-xs" style={{ color: C.inkSoft }}>Preview shown below · JPG or PNG</p>
              </div>
              <div className="flex items-center gap-2">
                {imgQuality === "good" ? (
                  <span className="inline-flex items-center gap-1.5 font-body text-sm font-medium" style={{ color: C.green }}><CheckCircle2 size={15} /> Image Quality: Good</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-body text-sm font-medium" style={{ color: C.red }}><AlertTriangle size={15} /> Image Quality: Poor — please upload a clearer image</span>
                )}
                <button onClick={() => setImgQuality((q) => (q === "good" ? "poor" : "good"))} className="font-body text-xs underline ml-2" style={{ color: C.inkSoft }}>toggle demo</button>
              </div>
            </div>

            {/* Symptoms */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
              <h2 className="font-display text-lg mb-4" style={{ color: C.ink }}>Symptoms</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {SYMPTOMS.map((s) => (
                  <button key={s} onClick={() => toggleSymptom(s)} className="rounded-full px-3.5 py-1.5 font-body text-xs font-medium transition-colors" style={{
                    backgroundColor: symptoms.includes(s) ? C.forest : C.cream,
                    color: symptoms.includes(s) ? "white" : C.ink,
                    border: `1px solid ${symptoms.includes(s) ? C.forest : C.line}`,
                  }}>{s}</button>
                ))}
              </div>
              <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Describe symptoms in your own words</label>
              <div className="flex gap-2">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. The cow has stopped eating and has sores near the mouth..."
                  className="flex-1 rounded-lg px-3 py-2.5 font-body text-sm outline-none resize-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
                <button className="rounded-lg w-11 h-11 flex items-center justify-center shrink-0 self-start" style={{ backgroundColor: C.blueSoft }}>
                  <Mic size={17} style={{ color: C.blue }} />
                </button>
              </div>
            </div>

            <button onClick={runAnalysis} className="w-full rounded-full py-3.5 font-body font-semibold text-sm flex items-center justify-center gap-2" style={{ backgroundColor: C.amber, color: "white" }}>
              Analyze <Activity size={16} />
            </button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="rounded-2xl p-14 flex flex-col items-center text-center" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 animate-pulse" style={{ backgroundColor: C.greenSoft }}>
              <Activity size={24} style={{ color: C.green }} />
            </div>
            <h2 className="font-display text-xl mb-2" style={{ color: C.ink }}>Running multimodal analysis…</h2>
            <p className="font-body text-sm" style={{ color: C.inkSoft }}>Comparing image, symptoms, and regional health signals.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsPage({ setView, goBack, online, result }) {
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-10">
        <button onClick={goBack} className="flex items-center gap-1 font-body text-sm mb-6" style={{ color: C.inkSoft }}>
          <ChevronLeft size={15} /> Back to form
        </button>
        <SectionEyebrow>step 2 of 2 · result</SectionEyebrow>
        <h1 className="font-display text-3xl mb-8" style={{ color: C.forest }}>AI Assessment</h1>

        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: C.paper, border: `2px solid ${riskColor(result.risk)}` }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <RiskBadge risk={result.risk} />
            <span className="font-mono text-xs" style={{ color: C.inkSoft }}>{result.id} · {result.animal}</span>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider mb-1" style={{ color: C.soil }}>Potential condition</p>
          <h2 className="font-display text-2xl mb-4" style={{ color: C.ink }}>{result.condition}</h2>
          <p className="font-body text-sm mb-5" style={{ color: C.inkSoft }}>This is an AI-generated assessment, not a confirmed veterinary diagnosis. High-risk cases require qualified veterinary verification.</p>

          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.cream }}>
              <p className="font-mono text-xs uppercase mb-1" style={{ color: C.inkSoft }}>AI confidence</p>
              <p className="font-display text-xl" style={{ color: C.ink }}>{result.confidence}%</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.cream }}>
              <p className="font-mono text-xs uppercase mb-1" style={{ color: C.inkSoft }}>Key visual indicators</p>
              <p className="font-body text-sm" style={{ color: C.ink }}>Based on uploaded photo</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.cream }}>
              <p className="font-mono text-xs uppercase mb-1" style={{ color: C.inkSoft }}>Contextual factors</p>
              <p className="font-body text-sm" style={{ color: C.ink }}>2 nearby cases this week</p>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: C.cream }}>
            <p className="font-mono text-xs uppercase mb-1" style={{ color: C.inkSoft }}>Reported symptoms</p>
            <p className="font-body text-sm" style={{ color: C.ink }}>{result.symptoms.join(", ") || "None specified"}</p>
          </div>

          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: C.amberSoft }}>
            <p className="font-mono text-xs uppercase mb-1" style={{ color: C.amber }}>AI recommendation</p>
            <p className="font-body text-sm" style={{ color: C.ink }}>
              {result.risk === "High" ? "Isolate the affected animal where appropriate and contact a veterinarian for further assessment." :
               result.risk === "Moderate" ? "Continue monitoring closely and consult a veterinarian if symptoms persist or worsen." :
               "No urgent action needed — continue routine monitoring."}
            </p>
          </div>

          <button className="w-full rounded-full py-3 font-body font-semibold text-sm mb-4" style={{ backgroundColor: C.forest, color: "white" }}>
            Request Veterinary Review
          </button>

          <div className="flex items-start gap-2 rounded-lg p-3" style={{ backgroundColor: C.redSoft }}>
            <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: C.red }} />
            <p className="font-body text-xs" style={{ color: C.red }}>AI-generated assessment — veterinary verification required for high-risk cases.</p>
          </div>
        </div>

        {!online && (
          <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-2" style={{ backgroundColor: C.amberSoft }}>
            <RefreshCw size={15} style={{ color: C.amber }} />
            <span className="font-body text-sm" style={{ color: C.amber }}>Queued locally — will sync and notify the veterinary team once you're back online.</span>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setView("farmer")} className="flex-1 rounded-full py-3 font-body font-semibold text-sm" style={{ border: `1px solid ${C.soil}`, color: C.soil }}>Back to My Farm</button>
          <button onClick={() => setView("vet")} className="flex-1 rounded-full py-3 font-body font-semibold text-sm" style={{ backgroundColor: C.blue, color: "white" }}>See Vet Dashboard →</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* VETERINARIAN DASHBOARD                                                 */
/* ---------------------------------------------------------------------- */
function VetDashboard({ setView, cases = CASES, onVerify }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [alertOpen, setAlertOpen] = useState(true);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchFilter =
        filter === "All" ||
        (filter === "High Risk" && c.risk === "High") ||
        (filter === "Moderate" && c.risk === "Moderate") ||
        (filter === "Low Risk" && c.risk === "Low") ||
        (filter === "Pending Review" && c.status === "Pending Review") ||
        (filter === "Verified" && c.status === "Verified") ||
        (filter === "Resolved" && c.status === "Resolved");
      const matchQuery = query === "" || JSON.stringify(c).toLowerCase().includes(query.toLowerCase());
      return matchFilter && matchQuery;
    });
  }, [cases, filter, query]);

  const highRisk = cases.find((c) => c.risk === "High" && c.status === "Pending Review");

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-wider mb-1" style={{ color: C.soil }}>Dr. Anjali Mehta · Rampur Block</p>
          <h1 className="font-display text-3xl" style={{ color: C.forest }}>Veterinarian Dashboard</h1>
        </div>

        {alertOpen && highRisk && (
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: C.redSoft, border: `1px solid ${C.red}` }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} style={{ color: C.red }} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-display text-lg mb-1" style={{ color: C.red }}>Urgent Veterinary Alert</p>
                  <p className="font-body text-sm mb-3" style={{ color: C.ink }}>High-risk livestock health case detected in your assigned region.</p>
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 font-body text-sm" style={{ color: C.inkSoft }}>
                    <p><span className="font-medium" style={{ color: C.ink }}>Animal:</span> {highRisk.animal}</p>
                    <p><span className="font-medium" style={{ color: C.ink }}>Location:</span> {highRisk.location}</p>
                    <p><span className="font-medium" style={{ color: C.ink }}>Suspected condition:</span> {highRisk.condition}</p>
                    <p><span className="font-medium" style={{ color: C.ink }}>Time detected:</span> {highRisk.date}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setAlertOpen(false)}><X size={16} style={{ color: C.inkSoft }} /></button>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <button onClick={() => setView("animal")} className="rounded-full px-4 py-2 font-body text-xs font-semibold" style={{ backgroundColor: C.red, color: "white" }}>Review Case</button>
              <button className="rounded-full px-4 py-2 font-body text-xs font-semibold flex items-center gap-1.5" style={{ border: `1px solid ${C.red}`, color: C.red }}><PhoneCall size={12} /> Contact Farmer</button>
              <button onClick={() => { onVerify?.(highRisk.id); setAlertOpen(false); }} className="rounded-full px-4 py-2 font-body text-xs font-semibold" style={{ border: `1px solid ${C.red}`, color: C.red }}>Mark as Verified</button>
              <button className="rounded-full px-4 py-2 font-body text-xs font-semibold" style={{ border: `1px solid ${C.red}`, color: C.red }}>Escalate</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <KPICard label="Active Cases" value="18" icon={ClipboardList} accent={C.blue} />
          <KPICard label="High-Risk Cases" value="3" icon={AlertTriangle} accent={C.red} />
          <KPICard label="Pending Reviews" value="6" icon={Clock} accent={C.amber} />
          <KPICard label="Resolved Cases" value="142" icon={CheckCircle2} accent={C.green} />
          <KPICard label="Animals Monitored" value="410" icon={Sprout} accent={C.field} />
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="font-display text-lg" style={{ color: C.ink }}>Case Management</h2>
            <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: C.cream }}>
              <Search size={14} style={{ color: C.inkSoft }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cases…" className="bg-transparent outline-none font-body text-sm w-40" style={{ color: C.ink }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {["All", "High Risk", "Moderate", "Low Risk", "Pending Review", "Verified", "Resolved"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className="rounded-full px-3.5 py-1.5 font-body text-xs font-medium" style={{
                backgroundColor: filter === f ? C.forest : C.cream, color: filter === f ? "white" : C.ink,
              }}>{f}</button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm min-w-[900px]">
              <thead>
                <tr className="text-left" style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Case ID", "Animal", "Farmer", "Location", "Risk", "Condition", "Date", "Status", "Vet", ""].map((h) => (
                    <th key={h} className="pb-3 font-mono text-xs uppercase tracking-wide" style={{ color: C.soil }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td className="py-3 font-mono text-xs" style={{ color: C.ink }}>{c.id}</td>
                    <td className="py-3" style={{ color: C.ink }}>{c.animal}</td>
                    <td className="py-3" style={{ color: C.ink }}>{c.farmer}</td>
                    <td className="py-3" style={{ color: C.inkSoft }}>{c.location}</td>
                    <td className="py-3"><RiskBadge risk={c.risk} size="sm" /></td>
                    <td className="py-3" style={{ color: C.ink }}>{c.condition}</td>
                    <td className="py-3" style={{ color: C.inkSoft }}>{c.date}</td>
                    <td className="py-3"><StatusPill status={c.status} /></td>
                    <td className="py-3" style={{ color: C.inkSoft }}>{c.vet}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setView("animal")} className="font-body text-xs font-semibold" style={{ color: C.blue }}>Open</button>
                        {c.status === "Pending Review" && (
                          <button onClick={() => onVerify?.(c.id)} className="font-body text-xs font-semibold" style={{ color: C.green }}>Verify</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="py-8 text-center font-body text-sm" style={{ color: C.inkSoft }}>No cases match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ANIMAL HEALTH RECORD                                                   */
/* ---------------------------------------------------------------------- */
function AnimalProfile({ animals = ANIMALS, vaccinations = VACCINES }) {
  const a = animals[0] || ANIMALS[0];
  const animalVaccines = vaccinations.filter((v) => !v.animal_id || v.animal_id === a.id);
  const vaccineList = animalVaccines.length ? animalVaccines : VACCINES;
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-10">
        <div className="rounded-2xl p-6 mb-8 flex flex-wrap items-center gap-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
          <span className="text-6xl">{a.photo}</span>
          <div className="flex-1 min-w-[200px]">
            <p className="font-mono text-xs uppercase" style={{ color: C.soil }}>Animal ID</p>
            <h1 className="font-display text-3xl mb-2" style={{ color: C.forest }}>{a.id}</h1>
            <StatusPill status={a.status} />
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 font-body text-sm" style={{ color: C.inkSoft }}>
            <p><span className="font-medium" style={{ color: C.ink }}>Species:</span> {a.species}</p>
            <p><span className="font-medium" style={{ color: C.ink }}>Breed:</span> {a.breed}</p>
            <p><span className="font-medium" style={{ color: C.ink }}>Age:</span> {a.age}</p>
            <p><span className="font-medium" style={{ color: C.ink }}>Sex:</span> {a.sex}</p>
            <p><span className="font-medium" style={{ color: C.ink }}>Farm:</span> {a.farm}</p>
            <p><span className="font-medium" style={{ color: C.ink }}>Location:</span> {a.location}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Syringe size={16} style={{ color: C.blue }} />
              <h2 className="font-display text-lg" style={{ color: C.ink }}>Vaccination Timeline</h2>
            </div>
            <div className="space-y-3">
              {vaccineList.map((v) => (
                <div key={v.vaccine} className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ backgroundColor: C.cream }}>
                  <div>
                    <p className="font-body text-sm font-medium" style={{ color: C.ink }}>{v.vaccine}</p>
                    <p className="font-body text-xs" style={{ color: C.inkSoft }}>Given {v.given} · Next {v.next}</p>
                  </div>
                  <StatusPill status={v.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: C.green }} />
              <h2 className="font-display text-lg" style={{ color: C.ink }}>Health Trend</h2>
            </div>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={HEALTH_TREND}>
                  <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} domain={[50, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }} />
                  <Line type="monotone" dataKey="score" stroke={C.field} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="font-body text-xs mt-2" style={{ color: C.inkSoft }}>Composite index derived from vet visits, AI assessments, and reported symptoms.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} style={{ color: C.soil }} />
              <h2 className="font-display text-lg" style={{ color: C.ink }}>Medical History</h2>
            </div>
            <div className="space-y-4">
              {MEDICAL_HISTORY.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: C.soil }} />
                    {i < MEDICAL_HISTORY.length - 1 && <span className="w-px flex-1 mt-1" style={{ backgroundColor: C.line }} />}
                  </div>
                  <div className="pb-2">
                    <p className="font-body text-xs" style={{ color: C.inkSoft }}>{m.date}</p>
                    <p className="font-body text-sm font-medium" style={{ color: C.ink }}>{m.event}</p>
                    <p className="font-body text-xs" style={{ color: C.inkSoft }}>{m.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} style={{ color: C.green }} />
              <h2 className="font-display text-lg" style={{ color: C.ink }}>AI Assessments</h2>
            </div>
            <div className="space-y-3">
              {AI_ASSESSMENTS.map((r, i) => (
                <div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.cream }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-body text-xs" style={{ color: C.inkSoft }}>{r.date}</span>
                    <RiskBadge risk={r.risk} size="sm" />
                  </div>
                  <p className="font-body text-sm font-medium mb-0.5" style={{ color: C.ink }}>{r.condition}</p>
                  <p className="font-body text-xs" style={{ color: C.inkSoft }}>{r.verified}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* REGIONAL MONITORING                                                    */
/* ---------------------------------------------------------------------- */
function RegionalMonitor() {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <SectionEyebrow>surveillance</SectionEyebrow>
        <h1 className="font-display text-3xl mb-2" style={{ color: C.forest }}>Regional Livestock Health Monitor</h1>
        <p className="font-body text-sm mb-8" style={{ color: C.inkSoft }}>Clusters represent AI-assisted surveillance signals and require veterinary / public-health confirmation.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <KPICard label="Active Cases" value="23" icon={ClipboardList} accent={C.blue} />
          <KPICard label="High-Risk Cases" value="8" icon={AlertTriangle} accent={C.red} />
          <KPICard label="Vaccination Coverage" value="71%" icon={Syringe} accent={C.green} />
          <KPICard label="Animals Monitored" value="1,240" icon={Sprout} accent={C.field} />
          <KPICard label="Emerging Clusters" value="2" icon={TrendingUp} accent={C.amber} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-display text-lg" style={{ color: C.ink }}>Regional Map</h2>
              <div className="flex gap-2 font-body text-xs" style={{ color: C.inkSoft }}>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.green }} /> Normal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.amber }} /> Increased</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.red }} /> Outbreak cluster</span>
              </div>
            </div>
            <svg viewBox="0 0 460 300" className="w-full h-auto rounded-xl" style={{ backgroundColor: C.cream }}>
              <rect x="0" y="0" width="460" height="300" fill={C.cream} />
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} x1={i * 40} y1="0" x2={i * 40} y2="300" stroke={C.line} strokeWidth="0.5" />
              ))}
              {REGIONS.map((r) => (
                <g key={r.name} onClick={() => setSelected(r)} style={{ cursor: "pointer" }}>
                  {r.level === "high" && <circle cx={r.x} cy={r.y} r="22" fill={C.red} opacity="0.15" />}
                  {r.level === "moderate" && <circle cx={r.x} cy={r.y} r="16" fill={C.amber} opacity="0.15" />}
                  <circle cx={r.x} cy={r.y} r="8" fill={r.level === "high" ? C.red : r.level === "moderate" ? C.amber : C.green} stroke={C.paper} strokeWidth="2" />
                  <text x={r.x} y={r.y - 16} textAnchor="middle" fontSize="10" fontFamily="IBM Plex Sans" fill={C.ink}>{r.name}</text>
                </g>
              ))}
            </svg>
            {selected && (
              <div className="mt-4 rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: riskSoft(selected.level === "high" ? "High" : selected.level === "moderate" ? "Moderate" : "Low") }}>
                <div>
                  <p className="font-display text-base" style={{ color: C.ink }}>{selected.name}</p>
                  <p className="font-body text-xs" style={{ color: C.inkSoft }}>{selected.cases} active case{selected.cases !== 1 ? "s" : ""} reported</p>
                </div>
                <MapPin size={18} style={{ color: riskColor(selected.level === "high" ? "High" : selected.level === "moderate" ? "Moderate" : "Low") }} />
              </div>
            )}
          </div>

          <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Filter size={15} style={{ color: C.soil }} />
              <h2 className="font-display text-base" style={{ color: C.ink }}>Filters</h2>
            </div>
            {[
              { label: "Region", options: ["All regions", "Rampur", "Katni", "Jabalpur", "Damoh"] },
              { label: "Disease / condition", options: ["All conditions", "FMD", "PPR", "Lumpy skin disease"] },
              { label: "Species", options: ["All species", "Cattle", "Buffalo", "Goat", "Sheep"] },
              { label: "Risk level", options: ["All levels", "High", "Moderate", "Low"] },
              { label: "Date range", options: ["Last 7 days", "Last 30 days", "Last 90 days"] },
            ].map((f) => (
              <div key={f.label} className="mb-4">
                <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>{f.label}</label>
                <select className="w-full rounded-lg px-3 py-2 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }}>
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="rounded-xl p-3 mt-4 flex items-start gap-2" style={{ backgroundColor: C.blueSoft }}>
              <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: C.blue }} />
              <p className="font-body text-xs" style={{ color: C.blue }}>Clusters are AI-assisted surveillance signals, pending veterinary / public-health confirmation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* LOGIN                                                                  */
/* ---------------------------------------------------------------------- */
function LoginPage({ setView, onLogin, users = MOCK_USERS }) {
  const [role, setRole] = useState("farmer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const roleTabs = [
    { key: "farmer", label: "Farmer" },
    { key: "vet", label: "Veterinarian" },
    { key: "admin", label: "Admin" },
  ];
  const demoHint = {
    farmer: "ramesh@farm.in / demo123",
    vet: "anjali@vet.in / demo123",
    admin: "admin@pashusuraksha.in / admin123",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const match = users.find(
      (u) => u.role === role && u.identifier.toLowerCase() === identifier.trim().toLowerCase() && u.password === password
    );
    if (!match) {
      setError("Email/phone or password doesn't match our records. Try the demo credentials below.");
      return;
    }
    setError("");
    onLogin(match);
    setView(role === "admin" ? "admin" : role === "vet" ? "vet" : "farmer");
  };

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "calc(100vh - 64px)" }} className="flex items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🐄</span>
          <h1 className="font-display text-3xl mt-3" style={{ color: C.forest }}>Welcome back</h1>
          <p className="font-body text-sm mt-1" style={{ color: C.inkSoft }}>Sign in to PashuSuraksha</p>
        </div>

        <div className="rounded-2xl p-7" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
          <div className="flex rounded-full p-1 mb-6" style={{ backgroundColor: C.cream }}>
            {roleTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setRole(t.key); setError(""); }}
                className="flex-1 rounded-full py-2 font-body text-xs font-semibold transition-colors"
                style={{ backgroundColor: role === t.key ? C.forest : "transparent", color: role === t.key ? "white" : C.inkSoft }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Email or phone number</label>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} type="text" placeholder="you@example.com"
                className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>
            <div>
              <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
            </div>

            {error && (
              <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: C.redSoft }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: C.red }} />
                <p className="font-body text-xs" style={{ color: C.red }}>{error}</p>
              </div>
            )}

            <button type="submit" className="w-full rounded-full py-3 font-body font-semibold text-sm" style={{ backgroundColor: C.amber, color: "white" }}>
              Sign in
            </button>
          </form>

          <div className="rounded-xl p-3 mt-5 flex items-start gap-2" style={{ backgroundColor: C.blueSoft }}>
            <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: C.blue }} />
            <p className="font-body text-xs" style={{ color: C.blue }}>Demo login for {roleTabs.find((t) => t.key === role)?.label}: <span className="font-mono">{demoHint[role]}</span></p>
          </div>
        </div>

        <p className="text-center font-body text-sm mt-6" style={{ color: C.inkSoft }}>
          New farmer or veterinarian?{" "}
          <button onClick={() => setView("register")} className="font-semibold underline" style={{ color: C.forest }}>Create an account</button>
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* REGISTER                                                               */
/* ---------------------------------------------------------------------- */
function RegisterPage({ setView, onRegister }) {
  const [role, setRole] = useState("farmer");
  const [form, setForm] = useState({ name: "", identifier: "", password: "", confirm: "", location: "", farm: "", license: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.identifier || !form.password) {
      setError("Please fill in your name, email/phone, and a password.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError("");

    const newUser = {
      id: `U${Math.floor(100 + Math.random() * 900)}`,
      name: form.name,
      role,
      identifier: form.identifier,
      password: form.password,
      location: form.location || "Not specified",
      farm: role === "farmer" ? (form.farm || "Unnamed farm") : undefined,
      license: role === "vet" ? (form.license || "Pending verification") : undefined,
      status: role === "vet" ? "Pending Verification" : "Active",
    };

    // Best-effort write to Firestore's "users" collection — same
    // fall-back-silently pattern as addCase() in App(). Never blocks the
    // demo if Firebase isn't configured or the write fails.
    if (db) {
      try {
        await setDoc(doc(db, "users", newUser.id), newUser);
      } catch (err) {
        console.error("Register: Firestore write failed:", err);
      }
    }

    setSubmitting(false);
    onRegister(newUser);
    setView(role === "vet" ? "vet" : "farmer");
  };

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "calc(100vh - 64px)" }} className="flex items-center justify-center px-5 py-14">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-4xl">🐄</span>
          <h1 className="font-display text-3xl mt-3" style={{ color: C.forest }}>Create your account</h1>
          <p className="font-body text-sm mt-1" style={{ color: C.inkSoft }}>Join PashuSuraksha as a farmer or veterinarian</p>
        </div>

        <div className="rounded-2xl p-7" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
          <div className="flex rounded-full p-1 mb-6" style={{ backgroundColor: C.cream }}>
            {[{ key: "farmer", label: "Farmer" }, { key: "vet", label: "Veterinarian" }].map((t) => (
              <button key={t.key} type="button" onClick={() => setRole(t.key)}
                className="flex-1 rounded-full py-2 font-body text-xs font-semibold transition-colors"
                style={{ backgroundColor: role === t.key ? C.forest : "transparent", color: role === t.key ? "white" : C.inkSoft }}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Full name</label>
                <input value={form.name} onChange={set("name")} className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
              </div>
              <div>
                <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Email or phone</label>
                <input value={form.identifier} onChange={set("identifier")} className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Password</label>
                <input value={form.password} onChange={set("password")} type="password" className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
              </div>
              <div>
                <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Confirm password</label>
                <input value={form.confirm} onChange={set("confirm")} type="password" className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
              </div>
            </div>

            {role === "farmer" ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Farm name</label>
                  <input value={form.farm} onChange={set("farm")} placeholder="e.g. Rampur Farm" className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
                <div>
                  <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Village / location</label>
                  <input value={form.location} onChange={set("location")} placeholder="e.g. Rampur, MP" className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Veterinary license number</label>
                  <input value={form.license} onChange={set("license")} placeholder="e.g. VET-MP-1234" className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
                <div>
                  <label className="font-body text-xs font-medium block mb-1.5" style={{ color: C.inkSoft }}>Assigned block / region</label>
                  <input value={form.location} onChange={set("location")} placeholder="e.g. Rampur Block, MP" className="w-full rounded-lg px-3 py-2.5 font-body text-sm outline-none" style={{ backgroundColor: C.cream, border: `1px solid ${C.line}`, color: C.ink }} />
                </div>
              </div>
            )}

            {role === "vet" && (
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: C.amberSoft }}>
                <ClipboardList size={14} className="mt-0.5 shrink-0" style={{ color: C.amber }} />
                <p className="font-body text-xs" style={{ color: C.amber }}>Veterinarian accounts are marked "Pending Verification" until an admin confirms your license.</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: C.redSoft }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: C.red }} />
                <p className="font-body text-xs" style={{ color: C.red }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full rounded-full py-3 font-body font-semibold text-sm" style={{ backgroundColor: C.amber, color: "white", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center font-body text-sm mt-6" style={{ color: C.inkSoft }}>
          Already have an account?{" "}
          <button onClick={() => setView("login")} className="font-semibold underline" style={{ color: C.forest }}>Sign in</button>
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ADMIN PANEL                                                            */
/* ---------------------------------------------------------------------- */
function AdminDashboard({ setView, cases = CASES, users = MOCK_USERS, onVerifyUser }) {
  const farmers = users.filter((u) => u.role === "farmer");
  const vets = users.filter((u) => u.role === "vet");
  const pendingVets = vets.filter((u) => u.status === "Pending Verification");

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-wider mb-1" style={{ color: C.soil }}>System overview</p>
          <h1 className="font-display text-3xl" style={{ color: C.forest }}>Admin Panel</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <KPICard label="Farmers" value={String(farmers.length)} icon={Sprout} accent={C.field} />
          <KPICard label="Veterinarians" value={String(vets.length)} icon={Stethoscope} accent={C.blue} />
          <KPICard label="Active Cases" value={String(cases.length)} icon={ClipboardList} accent={C.amber} />
          <KPICard label="High-Risk Cases" value={String(cases.filter((c) => c.risk === "High").length)} icon={AlertTriangle} accent={C.red} />
          <KPICard label="Pending Verifications" value={String(pendingVets.length)} icon={Clock} accent={C.soil} />
        </div>

        {pendingVets.length > 0 && (
          <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: C.amberSoft, border: `1px solid ${C.amber}` }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} style={{ color: C.amber }} />
              <h2 className="font-display text-lg" style={{ color: C.amber }}>Veterinarian accounts awaiting verification</h2>
            </div>
            {pendingVets.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-body text-sm font-medium" style={{ color: C.ink }}>{v.name} · {v.license}</p>
                  <p className="font-body text-xs" style={{ color: C.inkSoft }}>{v.location}</p>
                </div>
                <button onClick={() => onVerifyUser?.(v.id)} className="rounded-full px-4 py-2 font-body text-xs font-semibold" style={{ backgroundColor: C.amber, color: "white" }}>Verify</button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl p-6" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg" style={{ color: C.ink }}>Registered Users</h2>
            <button onClick={() => setView("vet")} className="font-body text-xs font-semibold flex items-center gap-1" style={{ color: C.blue }}>View all cases <ArrowUpRight size={12} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm min-w-[700px]">
              <thead>
                <tr className="text-left" style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Name", "Role", "Location", "Status", ""].map((h) => (
                    <th key={h} className="pb-3 font-mono text-xs uppercase tracking-wide" style={{ color: C.soil }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td className="py-3" style={{ color: C.ink }}>{u.name}</td>
                    <td className="py-3 capitalize" style={{ color: C.inkSoft }}>{u.role}</td>
                    <td className="py-3" style={{ color: C.inkSoft }}>{u.location || "—"}</td>
                    <td className="py-3"><StatusPill status={u.status === "Pending Verification" ? "Monitoring" : "Healthy"} /></td>
                    <td className="py-3">
                      {u.status === "Pending Verification" && (
                        <button onClick={() => onVerifyUser?.(u.id)} className="font-body text-xs font-semibold" style={{ color: C.green }}>Verify</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* APP SHELL                                                              */
/* ---------------------------------------------------------------------- */
export default function App() {
  const [view, setView] = useState("landing");
  const [role, setRole] = useState("farmer");
  const [online, setOnline] = useState(true);
  const [syncCount, setSyncCount] = useState(3);
  const [lang, setLang] = useState("English");

  // Live data from Firebase Firestore. Falls back to the built-in demo
  // arrays (ANIMALS / CASES / VACCINES) whenever Firebase isn't configured
  // yet or a fetch fails — so the demo never goes blank on stage.
  const [animals, setAnimals] = useState(ANIMALS);
  const [cases, setCases] = useState(CASES);
  const [vaccinations, setVaccinations] = useState(VACCINES);
  const [dbStatus, setDbStatus] = useState(db ? "connecting" : "demo-data");

  // Auth (client-side demo only — see MOCK_USERS comment for what a real
  // implementation would need: Firebase Auth + a "users" collection).
  const [authUser, setAuthUser] = useState(null);
  const [users, setUsers] = useState(MOCK_USERS);

  const loginUser = (user) => { setAuthUser(user); setRole(user.role); };
  const registerUser = (user) => { setUsers((cur) => [...cur, user]); setAuthUser(user); setRole(user.role); };
  const logoutUser = () => { setAuthUser(null); setRole("farmer"); setView("landing"); };
  const verifyUser = (userId) => setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, status: "Active" } : u)));

  const loadData = async () => {
    if (!db) { setDbStatus("demo-data"); return; }
    try {
      let animalRows = (await getDocs(collection(db, "animals"))).docs.map((d) => d.data());

      // First run against a fresh Firestore project — seed it with the
      // same demo data the app ships with, so nothing looks different.
      if (animalRows.length === 0) {
        const batch = writeBatch(db);
        ANIMALS.forEach((a) => batch.set(doc(db, "animals", a.id), a));
        CASES.forEach((c) => batch.set(doc(db, "cases", c.id), c));
        VACCINES.forEach((v, i) => batch.set(doc(db, "vaccinations", `COW-1024-${i}`), { ...v, animal_id: "COW-1024" }));
        await batch.commit();
        animalRows = ANIMALS;
      }

      const caseRows = (await getDocs(collection(db, "cases"))).docs.map((d) => d.data());
      const vaccRows = (await getDocs(collection(db, "vaccinations"))).docs.map((d) => d.data());

      setAnimals(animalRows);
      setCases(caseRows.length ? caseRows : CASES);
      setVaccinations(vaccRows.length ? vaccRows : VACCINES);
      setDbStatus("connected");
    } catch (err) {
      console.error("Firebase fetch failed, using demo data:", err);
      setDbStatus("error");
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  // Called by AnalyzePage after it computes an AI result — writes the new
  // case to Firestore (when connected) and always updates local state so
  // the vet dashboard reflects it immediately, online or offline.
  const addCase = async (newCase) => {
    setCases((cur) => [newCase, ...cur]);
    if (db && online) {
      try {
        await setDoc(doc(db, "cases", newCase.id), newCase);
      } catch (err) {
        console.error("Add case failed:", err);
      }
    }
  };

  const verifyCase = async (caseId) => {
    setCases((cur) => cur.map((c) => (c.id === caseId ? { ...c, status: "Verified", vet: "Dr. Anjali Mehta" } : c)));
    if (db && online) {
      try {
        await updateDoc(doc(db, "cases", caseId), { status: "Verified", vet: "Dr. Anjali Mehta" });
      } catch (err) {
        console.error("Verify case failed:", err);
      }
    }
  };

  const renderView = () => {
    switch (view) {
      case "landing": case "how": case "tech": case "impact":
        return <LandingPage setView={setView} />;
      case "farmer":
        return <FarmerDashboard setView={setView} online={online} syncCount={syncCount} animals={animals} vaccinations={vaccinations} />;
      case "analyze":
        return <AnalyzePage setView={setView} online={online} setSyncCount={setSyncCount} addCase={addCase} />;
      case "vet":
        return <VetDashboard setView={setView} cases={cases} onVerify={verifyCase} />;
      case "animal":
        return <AnimalProfile animals={animals} vaccinations={vaccinations} />;
      case "regional":
        return <RegionalMonitor />;
      case "login":
        return <LoginPage setView={setView} onLogin={loginUser} users={users} />;
      case "register":
        return <RegisterPage setView={setView} onRegister={registerUser} />;
      case "admin":
        return <AdminDashboard setView={setView} cases={cases} users={users} onVerifyUser={verifyUser} />;
      default:
        return <LandingPage setView={setView} />;
    }
  };

  return (
    <div className="font-body" style={{ backgroundColor: C.cream }}>
      <style>{FONTS}</style>
      <TopNav view={view} setView={setView} role={role} setRole={setRole} online={online} setOnline={setOnline} lang={lang} setLang={setLang} syncCount={syncCount} dbStatus={dbStatus} authUser={authUser} onLogout={logoutUser} />
      {renderView()}
    </div>
  );
}
