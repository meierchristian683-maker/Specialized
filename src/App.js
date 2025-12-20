import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  doc, 
  serverTimestamp,
  increment,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  Users, 
  Calendar, 
  Settings, 
  Plus, 
  Trash2, 
  Share2, 
  Euro, 
  Menu,
  Home,
  Check, 
  X,
  AlertCircle,
  Bell,
  History as HistoryIcon, 
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet, 
  PieChart,
  MinusCircle,
  Lock,
  Unlock,
  ShieldCheck,
  Banknote,
  PenTool,
  Dices,
  Crown,
  Flame,
  Wifi,
  WifiOff,
  Database,
  Globe
} from 'lucide-react';

// ==========================================
// 1. KONFIGURATION (Robust mit Fallback)
// ==========================================

// Deine manuelle Config als Sicherung
const manualConfig = {
  apiKey: "AIzaSyD7iO59TiZVG8vhHpapmpO-IHID8jX_dzE",
  authDomain: "specialized-4b4c4.firebaseapp.com",
  projectId: "specialized-4b4c4",
  storageBucket: "specialized-4b4c4.firebasestorage.app",
  messagingSenderId: "610305729554",
  appId: "1:610305729554:web:081b81ebb26dbf57e7a4cb"
};

let app, auth, db, configError;

try {
  let firebaseConfig;
  
  // Prüfen, ob die automatische Variable existiert
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    // Fallback auf manuelle Config, wenn Variable fehlt
    console.warn("Nutze manuelle Firebase Konfiguration.");
    firebaseConfig = manualConfig;
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Init Error:", e);
  configError = e.message;
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ==========================================
// 2. HEADER GRAFIK
// ==========================================

function HeaderGraphic() {
  return (
    <svg viewBox="0 0 250 50" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.3)"/>
         </filter>
       </defs>
       
       {/* Würfel 1 (Hintergrund - Amber) */}
       <g transform="rotate(-10 20 25)">
         <rect x="5" y="10" width="30" height="30" rx="6" fill="#F59E0B" filter="url(#shadow)" />
         <circle cx="13" cy="18" r="2.5" fill="white" />
         <circle cx="27" cy="32" r="2.5" fill="white" />
         <circle cx="20" cy="25" r="2.5" fill="white" />
       </g>

       {/* Würfel 2 (Vordergrund - Weiß) */}
       <g transform="rotate(15 45 20)">
         <rect x="30" y="5" width="30" height="30" rx="6" fill="white" stroke="#F59E0B" strokeWidth="1.5" filter="url(#shadow)" />
         <circle cx="38" cy="13" r="2.5" fill="#F59E0B" />
         <circle cx="52" cy="27" r="2.5" fill="#F59E0B" />
       </g>

       {/* Schriftzug */}
       <text x="75" y="36" fontFamily="sans-serif" fontWeight="900" fontSize="28" fill="white" letterSpacing="-0.5" filter="url(#shadow)">
         Specialized
       </text>
    </svg>
  );
}

// ==========================================
// ERROR BOUNDARY
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-900 h-screen flex flex-col items-center justify-center text-center font-sans">
          <AlertCircle className="w-12 h-12 mb-4 text-red-600" />
          <h1 className="text-xl font-bold mb-2">Ein Fehler ist aufgetreten</h1>
          <p className="mb-4 text-sm bg-red-100 p-2 rounded font-mono">{this.state.error?.message || "Unbekannter Fehler"}</p>
          <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold">Neu laden</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function KnobelKasse() {
  if (configError) throw new Error("Initialisierungsfehler: " + configError);

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDemo, setIsDemo] = useState(false);
  const [connectionError, setConnectionError] = useState(null); 
  const [detailedError, setDetailedError] = useState(null);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const ADMIN_PIN = "1234";

  // Data States
  const [members, setMembers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [pot, setPot] = useState({ balance: 0 });

  // 1. AUTHENTIFIZIERUNG
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Versuch: Persistenz aktivieren (hilft manchmal, aber Public Path ist sicherer)
        await setPersistence(auth, browserLocalPersistence);

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth fehlgeschlagen:", err);
        
        let msg = err.message;
        let detail = "";
        
        if (err.code === 'auth/operation-not-allowed') {
            msg = "Anonyme Anmeldung deaktiviert!";
            detail = "Gehe in Firebase Console -> Authentication -> Sign-in method und aktiviere 'Anonymous'.";
        } else if (err.code === 'auth/api-key-not-valid') {
            msg = "API Key ungültig!";
            detail = "Prüfe den API Key in der Konfiguration.";
        }

        setConnectionError(msg);
        setDetailedError(detail);
        setIsDemo(true);
      }
    };
    initAuth();
    
    return onAuthStateChanged(auth, (u) => {
        if (u) {
            setUser(u);
            setConnectionError(null);
            setDetailedError(null);
        }
    });
  }, []);

  // 2. Data Loading (Öffentliche Pfade für Beständigkeit)
  useEffect(() => {
    if (!user && !isDemo) return;

    if (isDemo) {
      setMembers([
        { id: '1', name: 'Max Mustermann', debt: 15.50 },
        { id: '2', name: 'Erika Musterfrau', debt: 0 },
        { id: '3', name: 'Lukas Podolski', debt: 5.00 },
      ]);
      setCatalog([
        { id: 'c1', title: 'Zu spät', amount: 2.00, count: 5 },
      ]);
      setEvents([{ id: 'e1', date: '2024-12-24', time: '18:00', location: 'Vereinsheim' }]);
      setPot({ balance: 45.50 });
      setHistory([
        { id: 'h1', text: 'Max Mustermann: Zu spät', amount: 2.00, type: 'penalty', createdAt: { seconds: Date.now() / 1000 } },
        { id: 'h2', text: 'Max Mustermann hat eingezahlt', amount: -5.00, type: 'payment', createdAt: { seconds: (Date.now() - 10000) / 1000 } }
      ]);
      return;
    }

    if (!db) return;

    // HELPER: Öffentlicher Pfad (Public Data)
    // Damit sehen alle Nutzer dieselben Daten, egal welche ID sie haben.
    const getSafeCol = (colName) => {
        return collection(db, 'artifacts', appId, 'public', 'data', colName);
    }

    const safeSnapshot = (colName, setter) => {
      const colRef = getSafeCol(colName);
      
      return onSnapshot(colRef, (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (colName === 'knobel_members') data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          if (colName === 'knobel_catalog') data.sort((a, b) => (a.amount || 0) - (b.amount || 0));
          if (colName === 'knobel_events') data.sort((a, b) => new Date(a.date) - new Date(b.date));
          if (colName === 'knobel_history') {
             data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
             setter(data);
             return;
          }
          if (colName === 'knobel_pot') {
              if (data.length > 0) setter(data[0]);
              else setter({ balance: 0 });
              return;
          }
          setter(data);
        },
        (err) => {
            console.error(`Ladefehler ${colName}:`, err);
            
            let msg = `Datenbankfehler (${colName})`;
            let detail = err.message;

            if (err.code === 'permission-denied') {
                msg = "Datenbank Zugriff Verweigert!";
                detail = "Prüfe Firebase Console -> Rules. Muss 'allow read, write: if true;' sein.";
            }

            setConnectionError(msg);
            setDetailedError(detail);
        }
      );
    };

    const unsubMembers = safeSnapshot('knobel_members', setMembers);
    const unsubCatalog = safeSnapshot('knobel_catalog', setCatalog);
    const unsubEvents = safeSnapshot('knobel_events', setEvents);
    const unsubHistory = safeSnapshot('knobel_history', setHistory);
    const unsubPot = safeSnapshot('knobel_pot', setPot);

    return () => {
      if (unsubMembers) unsubMembers();
      if (unsubCatalog) unsubCatalog();
      if (unsubEvents) unsubEvents();
      if (unsubHistory) unsubHistory();
      if (unsubPot) unsubPot();
    };
  }, [user, isDemo]);

  // Helpers for Paths (Hier auch Public)
  const getCol = (name) => collection(db, 'artifacts', appId, 'public', 'data', name);
  const getDocRef = (name, id) => doc(db, 'artifacts', appId, 'public', 'data', name, id);

  // ACTIONS
  const bookPenalty = async (memberId, memberName, penaltyTitle, amount, catalogId) => {
    if (isDemo) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, debt: (m.debt || 0) + amount } : m));
      if (catalogId) setCatalog(prev => prev.map(c => c.id === catalogId ? { ...c, count: (c.count || 0) + 1 } : c));
      setHistory(prev => [{ id: Date.now(), text: `${memberName}: ${penaltyTitle}`, amount, type: 'penalty', createdAt: { seconds: Date.now()/1000 } }, ...prev]);
      return;
    }
    if (!user || !db) return;

    try {
      const memRef = getDocRef('knobel_members', memberId);
      const histCol = getCol('knobel_history');

      await updateDoc(memRef, { debt: increment(amount) });
      if (catalogId) {
          const catRef = getDocRef('knobel_catalog', catalogId);
          await updateDoc(catRef, { count: increment(1) });
      }
      await addDoc(histCol, { text: `${memberName}: ${penaltyTitle}`, amount, type: 'penalty', createdAt: serverTimestamp() });
    } catch (e) {
      console.error("Fehler beim Buchen:", e);
    }
  };

  const payDebt = async (memberId, memberName, amount) => {
    if (isDemo) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, debt: Math.max(0, (m.debt || 0) - amount) } : m));
      setPot(prev => ({ balance: (prev.balance || 0) + amount }));
      setHistory(prev => [{ id: Date.now(), text: `${memberName} hat eingezahlt`, amount: -amount, type: 'payment', createdAt: { seconds: Date.now()/1000 } }, ...prev]);
      return;
    }
    if (!user || !db) return;

    try {
      const memRef = getDocRef('knobel_members', memberId);
      const potRef = getDocRef('knobel_pot', 'main');
      const histCol = getCol('knobel_history');
      
      await updateDoc(memRef, { debt: increment(-amount) });
      await setDoc(potRef, { balance: increment(amount) }, { merge: true });
      await addDoc(histCol, { text: `${memberName} hat eingezahlt`, amount: -amount, type: 'payment', createdAt: serverTimestamp() });
    } catch (e) {
      console.error("Fehler beim Zahlen:", e);
    }
  };

  const bookExpense = async (title, amount) => {
      if (isDemo) {
          setPot(prev => ({ balance: (prev.balance || 0) - amount }));
          setHistory(prev => [{ id: Date.now(), text: `Ausgabe: ${title}`, amount: -amount, type: 'expense', createdAt: { seconds: Date.now()/1000 } }, ...prev]);
          return;
      }
      if (!user || !db) return;

      try {
        const potRef = getDocRef('knobel_pot', 'main');
        const histCol = getCol('knobel_history');

        await setDoc(potRef, { balance: increment(-amount) }, { merge: true });
        await addDoc(histCol, { text: `Ausgabe: ${title}`, amount: -amount, type: 'expense', createdAt: serverTimestamp() });
      } catch (e) {
        console.error("Fehler bei Ausgabe:", e);
      }
  }

  // Demo Helpers
  const addDemoItem = (listName, item) => {
    const newItem = { ...item, id: Math.random().toString() };
    if (listName === 'members') setMembers(p => [...p, { ...newItem, debt: 0 }]);
    if (listName === 'catalog') setCatalog(p => [...p, { ...newItem, count: 0 }]);
    if (listName === 'events') setEvents(p => [...p, newItem]);
  };
  const deleteDemoItem = (listName, id) => {
     if (listName === 'members') setMembers(p => p.filter(i => i.id !== id));
     if (listName === 'catalog') setCatalog(p => p.filter(i => i.id !== id));
     if (listName === 'events') setEvents(p => p.filter(i => i.id !== id));
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (e.target.pin.value === ADMIN_PIN) {
      setIsAdmin(true); setShowAdminLogin(false);
    } else {
      alert("Falsche PIN!");
    }
  };

  // Views
  const totalDebt = members.reduce((acc, m) => acc + (m.debt || 0), 0);

  if (!user && !connectionError && !isDemo) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white"><p className="animate-pulse">Lade Specialized-App...</p></div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 w-full relative overflow-hidden">
      <header className="bg-slate-900 text-white p-4 pt-8 shadow-md z-10 w-full">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <HeaderGraphic />
            {isDemo && <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold uppercase self-start mt-1">Demo</span>}
          </div>
          
          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} 
            className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* FEHLERMELDUNG BEI VERBINDUNGSPROBLEMEN */}
      {connectionError && (
          <div className="bg-red-50 border-b border-red-200 text-red-900 px-4 py-4 text-sm font-bold flex flex-col gap-1 shadow-lg animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <span className="uppercase tracking-wider">Fehler: {connectionError}</span>
              </div>
              {detailedError && <p className="ml-7 text-xs font-normal text-red-700">{detailedError}</p>}
              <div className="ml-7 mt-1 text-[10px] uppercase font-bold text-red-400">Daten werden NICHT gespeichert.</div>
          </div>
      )}

      {/* STATUS INDIKATOR UNTEN RECHTS */}
      <div className={`fixed bottom-20 right-4 z-50 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-mono shadow-md ${connectionError ? 'bg-red-100 text-red-700' : (isDemo ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}`}>
         {connectionError ? <WifiOff className="w-3 h-3"/> : <Wifi className="w-3 h-3"/>}
         {connectionError ? 'Offline/Fehler' : (isDemo ? 'Lokal (Demo)' : 'Live Verbunden')}
      </div>

      <main className="flex-1 overflow-y-auto bg-slate-50 pb-24 w-full">
        <div className="max-w-2xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardView members={members} history={history} totalDebt={totalDebt} pot={pot} onExpense={bookExpense} catalog={catalog} isAdmin={isAdmin} />}
          {activeTab === 'kasse' && <CashierView members={members} catalog={catalog} onBook={bookPenalty} onPay={payDebt} />}
          {activeTab === 'members' && <MembersView members={members} onPay={payDebt} db={db} appId={appId} isDemo={isDemo} onDemoAdd={(i)=>addDemoItem('members', i)} onDemoDelete={(id)=>deleteDemoItem('members', id)} isAdmin={isAdmin} />}
          {activeTab === 'settings' && <CatalogView catalog={catalog} db={db} appId={appId} isDemo={isDemo} onDemoAdd={(i)=>addDemoItem('catalog', i)} onDemoDelete={(id)=>deleteDemoItem('catalog', id)} isAdmin={isAdmin} />}
          {activeTab === 'calendar' && <CalendarView events={events} db={db} appId={appId} isDemo={isDemo} onDemoAdd={(i)=>addDemoItem('events', i)} onDemoDelete={(id)=>deleteDemoItem('events', id)} isAdmin={isAdmin} />}
        </div>
      </main>

      <nav className="bg-white border-t border-slate-200 absolute bottom-0 w-full z-20 pb-6 pt-2">
        <div className="max-w-md mx-auto flex justify-between items-center px-4">
          <NavBtn id="dashboard" active={activeTab} set={setActiveTab} icon={Home} label="Start" />
          <NavBtn id="kasse" active={activeTab} set={setActiveTab} icon={Euro} label="Buchen" />
          <NavBtn id="members" active={activeTab} set={setActiveTab} icon={Users} label="Leute" />
          <NavBtn id="settings" active={activeTab} set={setActiveTab} icon={Settings} label="Strafen" />
          <NavBtn id="calendar" active={activeTab} set={setActiveTab} icon={Calendar} label="Termine" />
        </div>
      </nav>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-800"><ShieldCheck className="w-5 h-5 text-amber-500"/> Admin Login</h3>
            <form onSubmit={handleAdminLogin}>
              <input type="password" name="pin" className="w-full bg-slate-50 p-3 rounded border border-slate-200 mb-6 outline-none text-center text-2xl tracking-widest" placeholder="PIN" autoFocus maxLength={4} inputMode="numeric" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 text-slate-500 hover:text-slate-700 font-medium text-sm">Abbruch</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 active:scale-95 transition-transform text-sm">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub Components ---

function NavBtn({ id, active, set, icon: Icon, label }) {
  const isActive = active === id;
  return (
    <button onClick={() => set(id)} className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all flex-1 active:scale-95 ${isActive ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}>
      <Icon className={`w-6 h-6 ${isActive ? 'fill-amber-100' : ''}`} strokeWidth={2} />
      <span className="text-[10px] font-bold uppercase truncate max-w-full">{label}</span>
    </button>
  );
}

function DashboardView({ members, history, totalDebt, pot, onExpense, catalog, isAdmin }) {
  const [viewMode, setViewMode] = useState('ranking'); 
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const handleExpense = (e) => {
      e.preventDefault();
      if(!expenseTitle || !expenseAmount) return;
      onExpense(expenseTitle, parseFloat(expenseAmount));
      setExpenseModal(false); setExpenseTitle(''); setExpenseAmount('');
  };

  const sortedMembers = [...members].sort((a, b) => (b.debt || 0) - (a.debt || 0));
  const topPenalties = [...catalog].sort((a,b) => (b.count || 0) - (a.count || 0)).slice(0, 3);

  // --- LOGIK FÜR LOSER DES ABENDS ---
  const getDailyLoser = () => {
    const today = new Date().setHours(0,0,0,0);
    const todayPenalties = history.filter(h => {
        if (h.type !== 'penalty' || !h.createdAt) return false;
        const d = new Date(h.createdAt.seconds * 1000);
        return d.setHours(0,0,0,0) === today;
    });

    const sums = {};
    todayPenalties.forEach(h => {
        // Name extrahieren ("Max: Zu spät" -> "Max")
        const name = h.text.split(':')[0].trim();
        sums[name] = (sums[name] || 0) + h.amount;
    });

    let loser = null;
    let maxAmount = 0;
    Object.entries(sums).forEach(([name, amount]) => {
        if (amount > maxAmount) {
            maxAmount = amount;
            loser = name;
        }
    });

    return loser ? { name: loser, amount: maxAmount } : null;
  };

  // --- LOGIK FÜR EWIGE BESTENLISTE (TOP 10 ABENDE) ---
  const getAllTimeHighscores = () => {
      const eveningSums = {}; // Key: "YYYY-MM-DD_Name", Value: Summe

      history.filter(h => h.type === 'penalty' && h.createdAt).forEach(h => {
          const date = new Date(h.createdAt.seconds * 1000);
          const dateStr = date.toLocaleDateString('de-DE'); // "20.12.2025"
          const name = h.text.split(':')[0].trim();
          const key = `${dateStr}_${name}`;
          
          if (!eveningSums[key]) eveningSums[key] = { date: dateStr, name, amount: 0 };
          eveningSums[key].amount += h.amount;
      });

      // In Array umwandeln und sortieren
      return Object.values(eveningSums)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10);
  };

  const dailyLoser = getDailyLoser();
  const allTimeHighscores = getAllTimeHighscores();

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Cards Row */}
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 blur-lg"></div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Offen (Schulden)</div>
            <div className="text-2xl font-mono font-bold text-amber-500">{totalDebt.toFixed(2)}€</div>
          </div>
           <div className="bg-emerald-800 text-white p-4 rounded-2xl shadow-lg border border-emerald-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 blur-lg"></div>
            <div className="text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1">Kassenbestand</div>
            <div className="text-2xl font-mono font-bold text-white">{(pot.balance || 0).toFixed(2)}€</div>
            {isAdmin && (
              <button onClick={() => setExpenseModal(true)} className="absolute bottom-2 right-2 bg-emerald-700 p-1.5 rounded-lg hover:bg-emerald-600 active:scale-95 transition-colors">
                  <MinusCircle className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
      </div>

      {/* LOSER DES ABENDS CARD (Nur anzeigen wenn es einen gibt) */}
      {dailyLoser && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-2xl shadow-md flex items-center justify-between animate-in zoom-in duration-300">
              <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-red-100 mb-1 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Loser des Abends
                  </div>
                  <div className="font-bold text-xl">{dailyLoser.name}</div>
                  <div className="text-sm opacity-90">hat heute schon <span className="font-mono font-bold">{dailyLoser.amount.toFixed(2)}€</span> verballert.</div>
              </div>
              <div className="text-4xl">💩</div>
          </div>
      )}

      <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
        <button onClick={() => setViewMode('ranking')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'ranking' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400'}`}>
          <TrendingUp className="w-3 h-3 inline mr-1"/> Ranking
        </button>
        <button onClick={() => setViewMode('history')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'history' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400'}`}>
          <HistoryIcon className="w-3 h-3 inline mr-1"/> Verlauf
        </button>
        <button onClick={() => setViewMode('stats')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'stats' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400'}`}>
          <PieChart className="w-3 h-3 inline mr-1"/> Statistik
        </button>
      </div>

      {viewMode === 'ranking' && (
        <div className="space-y-3 animate-in fade-in">
          {sortedMembers.map((m, index) => {
            const debt = m.debt || 0;
            const percent = Math.max(5, (debt / (sortedMembers[0]?.debt || 1)) * 100);
            return (
              <div key={m.id} className="relative group">
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative z-10 active:scale-[0.99] transition-transform">
                  <div className={`font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0 ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{index + 1}.</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700 truncate">{m.name}</span>
                      <span className={`font-mono font-bold ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{debt.toFixed(2)}€</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${debt > 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${debt > 0 ? percent : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'history' && (
        <div className="space-y-0 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
          {history.length > 0 ? history.map((item, i) => {
            const isPayment = item.type === 'payment';
            const isExpense = item.type === 'expense';
            const date = item.createdAt ? new Date(item.createdAt.seconds * 1000) : new Date();
            let iconColor = 'text-red-600 bg-red-100';
            let Icon = ArrowUpRight;
            if (isPayment) { iconColor = 'text-green-600 bg-green-100'; Icon = ArrowDownLeft; }
            if (isExpense) { iconColor = 'text-orange-600 bg-orange-100'; Icon = Wallet; }

            return (
              <div key={item.id || i} className="p-3 border-b border-slate-50 last:border-0 flex justify-between items-center hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full mt-1 ${iconColor}`}><Icon className="w-4 h-4" /></div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 line-clamp-1">{item.text}</div>
                    <div className="text-xs text-slate-400">
                      {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} • {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                    </div>
                  </div>
                </div>
                <div className={`font-mono font-bold text-sm ${isPayment ? 'text-green-600' : 'text-red-600'}`}>
                  {isPayment ? '+' : '-'}{Math.abs(item.amount).toFixed(2)}€
                </div>
              </div>
            );
          }) : <div className="text-center text-slate-400 py-12 text-sm">Leer.</div>}
        </div>
      )}

      {viewMode === 'stats' && (
         <div className="space-y-4 animate-in fade-in">
             {/* EWIGE BESTENLISTE */}
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500"/> Ewige Bestenliste (Top 10 Abende)</h3>
                 {allTimeHighscores.map((entry, i) => (
                     <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                         <div className="flex items-center gap-3">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i===0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>{i+1}</div>
                             <div>
                                 <span className="text-sm font-bold block">{entry.name}</span>
                                 <span className="text-[10px] text-slate-400">{entry.date}</span>
                             </div>
                         </div>
                         <div className="text-sm font-mono font-bold text-red-600">{entry.amount.toFixed(2)}€</div>
                     </div>
                 ))}
                 {allTimeHighscores.length === 0 && <div className="text-center text-slate-400 text-xs">Noch nicht genug Daten.</div>}
             </div>

             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500"/> Top Sünden</h3>
                 {topPenalties.map((p, i) => (
                     <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                         <div className="flex items-center gap-3">
                             <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{i+1}</div>
                             <span className="text-sm font-medium">{p.title}</span>
                         </div>
                         <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">{p.count || 0}x</div>
                     </div>
                 ))}
                 {topPenalties.length === 0 && <div className="text-center text-slate-400 text-xs">Noch keine Daten.</div>}
             </div>
         </div>
      )}

      {expenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-800"><Wallet className="w-5 h-5"/> Ausgabe erfassen</h3>
            <p className="text-xs text-slate-500 mb-4">Geld wird vom Kassenbestand abgezogen.</p>
            <form onSubmit={handleExpense}>
              <input className="w-full bg-slate-50 p-3 rounded border border-slate-200 mb-3 outline-none text-sm" placeholder="Verwendungszweck (z.B. Pizza)" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} autoFocus />
              <input type="number" step="0.01" className="w-full text-2xl font-mono border-b-2 outline-none py-2 mb-6 text-center" placeholder="0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setExpenseModal(false)} className="flex-1 py-3 text-slate-500 hover:text-slate-700 font-medium text-sm">Abbruch</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 active:scale-95 transition-transform text-sm">Buchen</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function CashierView({ members, catalog, onBook, onPay }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [notification, setNotification] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [manualBookModal, setManualBookModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAmount, setManualAmount] = useState('');

  const activeMember = selectedMember ? members.find(m => m.id === selectedMember.id) : null;

  const handleBooking = async (item) => {
    if (!activeMember) return;
    await onBook(activeMember.id, activeMember.name, item.title, parseFloat(item.amount), item.id);
    setNotification(`Gebucht: ${item.amount}€ für ${activeMember.name}`);
    setSelectedMember(null);
    setTimeout(() => setNotification(null), 2000);
  };

  const handleManualBook = async (e) => {
    e.preventDefault();
    if (!activeMember || !manualTitle || !manualAmount) return;
    await onBook(activeMember.id, activeMember.name, manualTitle, parseFloat(manualAmount), null);
    setNotification(`Gebucht: ${manualAmount}€ für ${activeMember.name}`);
    setManualBookModal(false); setManualTitle(''); setManualAmount(''); setSelectedMember(null);
    setTimeout(() => setNotification(null), 2000);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if(!payAmount || !activeMember) return;
    await onPay(activeMember.id, activeMember.name, parseFloat(payAmount));
    setNotification(`Eingezahlt: ${payAmount}€ von ${activeMember.name}`);
    setPayModal(null); setPayAmount(''); setSelectedMember(null);
    setTimeout(() => setNotification(null), 2000);
  };

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right-4">
      {notification && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl z-50 font-bold text-sm whitespace-nowrap animate-in fade-in zoom-in">{notification}</div>}

      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">1. Wer ist fällig?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {members.map(m => (
            <button key={m.id} onClick={() => setSelectedMember(m.id === selectedMember?.id ? null : m)} className={`p-3 min-h-[60px] rounded-xl border-2 font-bold text-sm truncate transition-all shadow-sm active:scale-95 ${selectedMember?.id === m.id ? 'bg-amber-500 border-amber-600 text-white scale-105 shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'}`}>{m.name}</button>
          ))}
          {members.length === 0 && <div className="text-sm text-slate-400 col-span-3 text-center p-4 border border-dashed rounded-xl">Keine Mitglieder.</div>}
        </div>
      </div>

      {activeMember && (
        <div className="mt-4 animate-in slide-in-from-bottom-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">2. Was ist passiert?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {catalog.map(item => (
              <button key={item.id} onClick={() => handleBooking(item)} className="bg-white p-4 min-h-[70px] rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 flex justify-between items-center active:scale-95 transition-transform group">
                <span className="font-medium text-slate-700 text-left">{item.title}</span>
                <span className="bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded text-sm group-hover:bg-red-200">{item.amount}€</span>
              </button>
            ))}
            
            <button onClick={() => setManualBookModal(true)} className="bg-slate-100 p-4 min-h-[70px] rounded-xl border border-slate-200 shadow-sm hover:bg-slate-200 flex justify-between items-center active:scale-95 transition-transform group text-slate-600">
                <span className="font-medium text-left">Manueller Eintrag</span>
                <PenTool className="w-5 h-5" />
            </button>

            {catalog.length === 0 && <div className="text-sm text-slate-400 col-span-2 text-center p-4 border border-dashed rounded-xl">Katalog leer.</div>}
          </div>
          
          {(activeMember.debt || 0) > 0 && (
            <button onClick={() => { setPayModal(true); setPayAmount((activeMember.debt || 0).toString()); }} className="w-full bg-emerald-100 text-emerald-800 p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-200 active:scale-95 transition-all shadow-sm">
                <Banknote className="w-5 h-5"/>
                Schulden begleichen (Offen: {activeMember.debt?.toFixed(2)}€)
            </button>
          )}
        </div>
      )}

      {manualBookModal && activeMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="font-bold mb-4">Eintrag für {activeMember.name}</h3>
            <form onSubmit={handleManualBook}>
              <input className="w-full bg-slate-50 p-3 rounded border border-slate-200 mb-3 outline-none text-sm" placeholder="Grund (z.B. Wette)" value={manualTitle} onChange={e => setManualTitle(e.target.value)} autoFocus />
              <input type="number" step="0.01" className="w-full text-2xl font-mono border-b-2 outline-none py-2 mb-6 text-center" placeholder="0.00" value={manualAmount} onChange={e => setManualAmount(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setManualBookModal(false)} className="flex-1 py-3 text-slate-500 hover:text-slate-700 font-medium text-sm">Abbruch</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 active:scale-95 transition-transform text-sm">Buchen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payModal && activeMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="font-bold mb-1">Zahlen für {activeMember.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Betrag ist anpassbar (Teilzahlung möglich).</p>
            <form onSubmit={handlePay}>
              <input type="number" step="0.01" className="w-full text-3xl font-mono border-b-2 outline-none py-3 mb-6 text-center text-base" value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus />
              <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => setPayAmount(activeMember.debt)} className="flex-1 py-3 text-sm font-bold bg-slate-100 rounded hover:bg-slate-200 active:scale-95">Alles</button>
                  <button type="button" onClick={() => setPayAmount((activeMember.debt/2).toFixed(2))} className="flex-1 py-3 text-sm font-bold bg-slate-100 rounded hover:bg-slate-200 active:scale-95">Hälfte</button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-3 text-slate-500 hover:text-slate-700 font-medium">Abbruch</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 active:scale-95 transition-transform">OK</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MembersView({ members, onPay, db, appId, isDemo, onDemoAdd, onDemoDelete, isAdmin }) {
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const addMember = async (e) => {
    e.preventDefault();
    if(!newMemberName.trim()) return;
    if (isDemo) onDemoAdd({ name: newMemberName });
    else {
        // Korrigierter Pfad: Public Data (für alle sichtbar)
        const col = collection(db, 'artifacts', appId, 'public', 'data', 'knobel_members');
        await addDoc(col, { name: newMemberName, debt: 0, createdAt: serverTimestamp() });
    }
    setNewMemberName(''); setShowAdd(false);
  };

  const deleteMember = async (id) => {
    if (isDemo) onDemoDelete(id);
    else {
        // Korrigierter Pfad
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'knobel_members', id);
        await deleteDoc(docRef);
    }
    setDeleteId(null);
  };

  const handleRemind = async (member) => {
    const debt = parseFloat(member.debt || 0);
    const text = `Hallo ${member.name} 👋,\n\nkleine Erinnerung: Dein offener Deckel in der KnobelKasse beträgt aktuell ${debt.toFixed(2)}€.\n\nBitte bei Gelegenheit begleichen. Danke! 🍻`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Zahlungserinnerung', text: text }); } 
      catch (e) { if (e.name !== 'AbortError') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
    } else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if(!payAmount) return;
    await onPay(payModal.memberId, payModal.name, parseFloat(payAmount));
    setPayModal(null); setPayAmount('');
  };

  return (
    <div className="p-4 pb-24 animate-in slide-in-from-right-4">
      <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Mitglieder</h2>
          {isAdmin && (
            <button onClick={() => setShowAdd(!showAdd)} className="bg-slate-200 p-3 rounded-full hover:bg-slate-300 active:scale-90 transition-transform">
                {showAdd ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
            </button>
          )}
      </div>

      {showAdd && isAdmin && (
          <form onSubmit={addMember} className="mb-6 bg-white p-4 rounded-xl border border-slate-200 flex gap-2 animate-in slide-in-from-top-2">
              <input className="flex-1 bg-slate-50 border-slate-200 rounded px-3 py-3 text-base outline-none" placeholder="Name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
              <button type="submit" className="bg-slate-900 text-white px-4 rounded font-bold active:scale-95 transition-transform">OK</button>
          </form>
      )}

      <div className="space-y-3">
        {members.map(m => {
            const debt = parseFloat(m.debt || 0);
            return (
                <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-lg">{m.name}</div>
                            <div className={`text-sm font-medium ${debt > 0 ? 'text-red-500' : 'text-green-500'}`}>{debt > 0 ? `${debt.toFixed(2)}€` : 'Bezahlt'}</div>
                        </div>
                        <div className="flex gap-2">
                            {debt > 0 ? (
                                <>
                                    <button onClick={() => handleRemind(m)} className="p-3 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors active:scale-95"><Bell className="w-5 h-5" /></button>
                                    <button onClick={() => { setPayModal({ memberId: m.id, name: m.name, max: debt }); setPayAmount(debt.toString()); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors active:scale-95">Zahlen</button>
                                </>
                            ) : (
                                isAdmin && (
                                  deleteId === m.id ? (
                                      <button onClick={() => deleteMember(m.id)} className="bg-red-500 text-white px-3 py-2 rounded text-xs hover:bg-red-600 transition-colors active:scale-95">Löschen?</button>
                                  ) : (
                                      <button onClick={() => setDeleteId(m.id)} className="text-slate-300 p-2 hover:text-red-500 transition-colors active:scale-90"><Trash2 className="w-5 h-5"/></button>
                                  )
                                )
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="font-bold mb-4">Zahlen für {payModal.name}</h3>
            <form onSubmit={handlePay}>
              <input type="number" step="0.01" className="w-full text-3xl font-mono border-b-2 outline-none py-3 mb-6 text-center text-base" value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus />
              <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => setPayAmount(payModal.max)} className="flex-1 py-3 text-sm font-bold bg-slate-100 rounded hover:bg-slate-200 active:scale-95">Alles</button>
                  <button type="button" onClick={() => setPayAmount((payModal.max/2).toFixed(2))} className="flex-1 py-3 text-sm font-bold bg-slate-100 rounded hover:bg-slate-200 active:scale-95">Hälfte</button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-3 text-slate-500 hover:text-slate-700 font-medium">Abbruch</button>
                <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 active:scale-95 transition-transform">OK</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogView({ catalog, db, appId, isDemo, onDemoAdd, onDemoDelete, isAdmin }) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [delId, setDelId] = useState(null);

    const add = async (e) => {
        e.preventDefault();
        if(!title || !amount) return;
        if (isDemo) onDemoAdd({ title, amount: parseFloat(amount) });
        else {
            const col = collection(db, 'artifacts', appId, 'public', 'data', 'knobel_catalog');
            await addDoc(col, { title, amount: parseFloat(amount), createdAt: serverTimestamp(), count: 0 });
        }
        setTitle(''); setAmount('');
    };

    const del = async (id) => { 
      if (isDemo) onDemoDelete(id);
      else {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'knobel_catalog', id);
          await deleteDoc(docRef); 
      }
      setDelId(null); 
    };

    return (
        <div className="p-4 animate-in slide-in-from-right-4">
            <h2 className="font-bold text-lg mb-4">Strafen bearbeiten</h2>
            
            {!isAdmin && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center mb-6 text-sm text-amber-800">
                <Lock className="w-4 h-4 inline mr-1 mb-0.5" /> Nur Admins können Strafen ändern.
              </div>
            )}

            {isAdmin && (
              <form onSubmit={add} className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                      <input className="col-span-2 bg-slate-50 p-3 rounded border border-slate-200 outline-none focus:border-amber-400 transition-colors text-base" placeholder="Titel" value={title} onChange={e => setTitle(e.target.value)} />
                      <input type="number" step="0.10" className="bg-slate-50 p-3 rounded border border-slate-200 outline-none focus:border-amber-400 transition-colors text-base" placeholder="€" value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors active:scale-95"><Plus className="w-4 h-4 inline" /> Hinzufügen</button>
              </form>
            )}

            <div className="space-y-2">
                {catalog.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                        <span className="font-medium">{item.title}</span>
                        <div className="flex items-center gap-3">
                            <span className="font-bold bg-slate-100 px-2 py-1 rounded text-sm">{item.amount}€</span>
                            {isAdmin && (
                              delId === item.id ? <button onClick={() => del(item.id)} className="text-red-500 font-bold text-xs hover:text-red-700 p-2">Löschen!</button> : <button onClick={() => setDelId(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 active:scale-90"><Trash2 className="w-5 h-5"/></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CalendarView({ events, db, appId, isDemo, onDemoAdd, onDemoDelete, isAdmin }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loc, setLoc] = useState('');
    const [delId, setDelId] = useState(null);

    const add = async (e) => {
        e.preventDefault(); if(!date) return;
        if (isDemo) onDemoAdd({ date, time, location: loc });
        else {
            const col = collection(db, 'artifacts', appId, 'public', 'data', 'knobel_events');
            await addDoc(col, { date, time, location: loc, createdAt: serverTimestamp() });
        }
        setDate(''); setTime(''); setLoc('');
    };

    const del = async (id) => { 
      if (isDemo) onDemoDelete(id);
      else {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'knobel_events', id);
          await deleteDoc(docRef); 
      }
      setDelId(null); 
    };

    const handleShare = async (ev) => {
        const d = new Date(ev.date);
        const [hours, minutes] = ev.time.split(':');
        d.setHours(hours, minutes);
        const end = new Date(d);
        end.setHours(end.getHours() + 3);
        const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KnobelKasse//DE
BEGIN:VEVENT
UID:${ev.id}@knobelkasse
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(d)}
DTEND:${formatDate(end)}
SUMMARY:Knobeln 🎲
DESCRIPTION:Ort: ${ev.location}
LOCATION:${ev.location}
END:VEVENT
END:VCALENDAR`;
        const file = new File([icsData], 'termin.ics', { type: 'text/calendar' });
        const text = `📅 Knobeln am ${d.toLocaleDateString('de-DE')} um ${ev.time} Uhr in ${ev.location}`;
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file], title: 'Knobelrunde', text: text }); } catch (err) { console.error("Teilen abgebrochen", err); }
        } else {
             const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;
             window.open(waLink, '_blank');
        }
    };

    return (
        <div className="p-4 animate-in slide-in-from-right-4">
            <h2 className="font-bold text-lg mb-4">Termine</h2>
            
            {isAdmin && (
              <form onSubmit={add} className="bg-white p-4 rounded-xl border border-slate-200 mb-6 space-y-3 shadow-sm">
                  <input type="date" className="w-full bg-slate-50 p-3 rounded border border-slate-200 focus:border-amber-400 outline-none transition-colors text-base" value={date} onChange={e => setDate(e.target.value)} />
                  <input type="time" className="w-full bg-slate-50 p-3 rounded border border-slate-200 focus:border-amber-400 outline-none transition-colors text-base" value={time} onChange={e => setTime(e.target.value)} />
                  <input placeholder="Ort" className="w-full bg-slate-50 p-3 rounded border border-slate-200 focus:border-amber-400 outline-none transition-colors text-base" value={loc} onChange={e => setLoc(e.target.value)} />
                  <button type="submit" className="w-full bg-amber-500 text-white font-bold py-3 rounded-lg hover:bg-amber-600 transition-colors active:scale-95">Speichern</button>
              </form>
            )}

            {!isAdmin && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center mb-6 text-sm text-blue-800">
                <Lock className="w-4 h-4 inline mr-1 mb-0.5" /> Nur Admins können Termine erstellen.
              </div>
            )}

            <div className="space-y-4">
                {events.map(ev => (
                    <div key={ev.id} className="bg-white p-4 rounded-xl border-l-4 border-amber-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="font-bold text-lg">{new Date(ev.date).toLocaleDateString('de-DE')}</div>
                        <div className="text-slate-500 text-sm">{ev.time} Uhr - {ev.location}</div>
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => handleShare(ev)} className="flex-1 bg-green-100 text-green-800 py-3 rounded text-center text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-200 transition-colors active:scale-95">
                                <Share2 className="w-4 h-4"/> Einladen
                            </button>
                            {isAdmin && (
                              delId === ev.id ? <button onClick={() => del(ev.id)} className="px-3 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors active:scale-95">Weg</button> : <button onClick={() => setDelId(ev.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 active:scale-90"><Trash2 className="w-5 h-5"/></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Finale Export-Zeile (WICHTIG!)
export default function App() { return <ErrorBoundary><KnobelKasse /></ErrorBoundary>; }
