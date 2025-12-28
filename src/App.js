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
  getDoc,
  writeBatch
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
  Home,
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
  Crown,
  Flame,
  Wifi,
  WifiOff,
  Info,
  Loader2,
  Copy,
  CheckCircle2,
  RefreshCw,
  Cloud, 
  Activity,
  Save,
  Database,
  AlertTriangle,
  Terminal,
  Activity as DiagnosticIcon
} from 'lucide-react';

// ==========================================
// 1. DEINE FIREBASE KONFIGURATION
// ==========================================
const manualConfig = {
  apiKey: "AIzaSyD7iO59TiZVG8vhHpapmpO-IHID8jX_dzE",
  authDomain: "specialized-4b4c4.firebaseapp.com",
  projectId: "specialized-4b4c4",
  storageBucket: "specialized-4b4c4.firebasestorage.app",
  messagingSenderId: "610305729554",
  appId: "1:610305729554:web:081b81ebb26dbf57e7a4cb"
};

// Logik zur Initialisierung
let app, auth, db, configError;

try {
  let firebaseConfig = manualConfig;
  // Auf Vercel/Github nutzen wir NUR deine manuelle Config.
  // Der folgende Block ist nur für die Vorschau hier im Chat relevant.
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      // Wir ignorieren die interne Config hier, um sicherzustellen, dass deine genutzt wird,
      // es sei denn, wir sind wirklich im Editor-Modus.
      if (window.location.hostname.includes('googleusercontent')) {
         firebaseConfig = JSON.parse(__firebase_config);
      }
    } catch (e) {
      console.warn("Auto-Config übersprungen.");
    }
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Init Error:", e);
  configError = e.message;
}

// SYSTEM-ID (Standard für eigene Projekte: 'default-lobby')
const systemAppId = typeof __app_id !== 'undefined' ? __app_id : 'knobelkasse-default-lobby';

// ==========================================
// HEADER GRAFIK
// ==========================================

function HeaderGraphic() {
  return (
    <svg viewBox="0 0 250 50" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.3)"/>
         </filter>
       </defs>
       <g transform="rotate(-10 20 25)">
         <rect x="5" y="10" width="30" height="30" rx="6" fill="#F59E0B" filter="url(#shadow)" />
         <circle cx="13" cy="18" r="2.5" fill="white" />
         <circle cx="27" cy="32" r="2.5" fill="white" />
         <circle cx="20" cy="25" r="2.5" fill="white" />
       </g>
       <g transform="rotate(15 45 20)">
         <rect x="30" y="5" width="30" height="30" rx="6" fill="white" stroke="#F59E0B" strokeWidth="1.5" filter="url(#shadow)" />
         <circle cx="38" cy="13" r="2.5" fill="#F59E0B" />
         <circle cx="52" cy="27" r="2.5" fill="#F59E0B" />
       </g>
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
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-900 h-screen flex flex-col items-center justify-center text-center font-sans">
          <AlertCircle className="w-12 h-12 mb-4 text-red-600" />
          <h1 className="text-xl font-bold mb-2">Da ist was schiefgelaufen</h1>
          <p className="mb-4 text-sm bg-red-100 p-2 rounded font-mono">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold">Neu laden</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// MAIN APP
// ==========================================

function KnobelKasse() {
  if (configError) throw new Error("Init Fehler: " + configError);

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDemo, setIsDemo] = useState(false);
  const [writeError, setWriteError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [localBackupAvailable, setLocalBackupAvailable] = useState(false);
  const [configWarning, setConfigWarning] = useState(null);
  
  // DIAGNOSE STATE
  const [testResult, setTestResult] = useState(null);

  // RAUM LOGIK (Suffix basierend)
  const [roomSuffix, setRoomSuffix] = useState(() => {
      try { return localStorage.getItem('knobel_room_suffix') || ''; } 
      catch (e) { return ''; }
  });
  const [roomInput, setRoomInput] = useState(roomSuffix);

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const ADMIN_PIN = "1234";

  // Data
  const [members, setMembers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [pot, setPot] = useState({ balance: 0 });
  
  // Logs
  const [logs, setLogs] = useState([]);
  const addLog = (msg) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

  // DIAGNOSE FUNKTION
  const runConnectionTest = async () => {
      setTestResult({ status: 'loading', steps: [] });
      const steps = [];
      const addStep = (name, status, msg) => {
          steps.push({ name, status, msg });
          setTestResult({ status: 'running', steps: [...steps] });
      };

      try {
          // Schritt 1: Config
          if (app.options.projectId === "specialized-4b4c4") {
              addStep("Konfiguration", "OK", "Projekt ID erkannt (specialized-4b4c4).");
          } else {
              addStep("Konfiguration", "WARN", `Andere Projekt ID: ${app.options.projectId}`);
          }

          // Schritt 2: Auth
          addStep("Authentifizierung", "PENDING", "Versuche anonymen Login...");
          let currentUser = auth.currentUser;
          try {
              if (!currentUser) {
                  const cred = await signInAnonymously(auth);
                  currentUser = cred.user;
              }
              addStep("Authentifizierung", "OK", `Angemeldet als ${currentUser.uid.slice(0,4)}...`);
          } catch (e) {
              addStep("Authentifizierung", "ERROR", `Fehler: ${e.code}`);
              if (e.code === 'auth/operation-not-allowed' || e.code === 'auth/admin-restricted-operation') {
                  addStep("LÖSUNG (Wichtig!)", "INFO", "Gehe zu Firebase Console -> Authentication -> Sign-in method -> 'Anonym' aktivieren!");
              }
              throw new Error("Auth fehlgeschlagen");
          }

          // Schritt 3: DB Write
          addStep("Datenbank Schreiben", "PENDING", "Versuche Test-Eintrag (Timeout 5s)...");
          try {
              const testRef = doc(collection(db, 'connection_test'), 'ping_' + Date.now());
              
              // Race condition: Write vs Timeout
              const writePromise = setDoc(testRef, { timestamp: serverTimestamp(), test: "OK" });
              const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
              
              await Promise.race([writePromise, timeoutPromise]);
              
              addStep("Datenbank Schreiben", "OK", "Schreiben erfolgreich.");
              // Cleanup
              await deleteDoc(testRef); 
          } catch (e) {
              if (e.message === "Timeout") {
                 addStep("Datenbank Schreiben", "ERROR", "Zeitüberschreitung (Timeout)");
                 addStep("MÖGLICHE URSACHE", "WARN", "Firewall oder AdBlocker blockiert 'firestore.googleapis.com'.");
              } else {
                 addStep("Datenbank Schreiben", "ERROR", `Fehler: ${e.code}`);
                 if (e.code === 'permission-denied') {
                    addStep("LÖSUNG (Wichtig!)", "INFO", "Gehe zu Firestore -> Regeln -> Ändere auf: 'allow read, write: if true;'");
                 }
              }
              throw new Error("DB Write fehlgeschlagen");
          }

          setTestResult({ status: 'success', steps });

      } catch (e) {
          setTestResult(prev => ({ status: 'error', steps: prev.steps }));
      }
  };

  // 1. AUTH
  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Fail:", err);
        addLog(`Auth Fehler: ${err.code}`);
        setWriteError(`Verbindungsfehler: ${err.code}`);
        setIsDemo(true); 
      }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
        if (u) {
            setUser(u);
            setIsDemo(false);
            addLog(`Online: ${u.uid.slice(0,3)}...`);
        }
    });
  }, []);

  // 2. DATA LOAD & SYNC
  useEffect(() => {
    // Prüfe ob Backup existiert
    if(localStorage.getItem('knobel_backup_members')) setLocalBackupAvailable(true);

    if ((!user && !isDemo) || !db) return;

    if (isDemo) {
        loadLocalData();
        return;
    }

    // KONSTRUIERE NAMEN MIT RAUM-SUFFIX
    const suffix = roomSuffix ? `_${roomSuffix}` : '';
    addLog(`Lade Raum: Standard${suffix}`);

    const getPath = (baseName) => collection(db, 'artifacts', systemAppId, 'public', 'data', `${baseName}${suffix}`);

    const safeSnapshot = (baseName, setter) => {
      return onSnapshot(getPath(baseName), (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Sortierung
          if (baseName.includes('members')) data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          if (baseName.includes('history')) {
             data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
             setter(data); 
             localStorage.setItem(`knobel_backup_${baseName}`, JSON.stringify(data));
             return;
          }
          if (baseName.includes('pot')) {
              setter(data.length > 0 ? data[0] : { balance: 0 }); 
              return;
          }
          
          setter(data);
          localStorage.setItem(`knobel_backup_${baseName}`, JSON.stringify(data));
        },
        (err) => {
            console.error(`Read Error ${baseName}:`, err);
            addLog(`Lese-Fehler: ${err.code}`);
            
            // PRÜFUNG: Sind Regeln falsch?
            if (err.code === 'permission-denied') {
                setConfigWarning({
                    title: "Keine Rechte",
                    msg: "Die Datenbank ist gesperrt. Klicke auf 'Lobby' -> 'System-Check' für Details.",
                    code: err.code
                });
                setIsDemo(true);
                loadLocalData();
            }
        }
      );
    };

    const unsubs = [
        safeSnapshot('knobel_members', setMembers),
        safeSnapshot('knobel_catalog', setCatalog),
        safeSnapshot('knobel_events', setEvents),
        safeSnapshot('knobel_history', setHistory),
        safeSnapshot('knobel_pot', setPot)
    ];

    return () => unsubs.forEach(u => u && u());
  }, [user, isDemo, roomSuffix]);

  // LOCAL LOAD (Fallback)
  const loadLocalData = () => {
      const load = (k, d) => { try { return JSON.parse(localStorage.getItem(`knobel_backup_knobel_${k}`)) || d; } catch(e){ return d; } };
      setMembers(load('members', []));
      setCatalog(load('catalog', [{id:'demo', title:'Offline-Bsp', amount: 5}]));
      setEvents(load('events', []));
      setHistory(load('history', []));
      setPot(load('pot', { balance: 0 }));
      addLog("Lokales Backup geladen.");
  };

  const restoreBackup = async () => {
      if(!confirm("Lokale Daten jetzt in diesen Raum hochladen? Das überschreibt nichts, sondern fügt hinzu.")) return;
      
      const load = (k) => { try { return JSON.parse(localStorage.getItem(`knobel_backup_knobel_${k}`)) || []; } catch(e){ return []; } };
      const bMembers = load('members');
      
      if(bMembers.length === 0) { alert("Backup leer."); return; }

      const suffix = roomSuffix ? `_${roomSuffix}` : '';
      const batch = writeBatch(db);
      
      // Nur Mitglieder hochladen als Beispiel
      bMembers.forEach(m => {
          if(!members.find(ex => ex.name === m.name)) {
             const ref = doc(collection(db, 'artifacts', systemAppId, 'public', 'data', `knobel_members${suffix}`));
             batch.set(ref, { name: m.name, debt: m.debt || 0, createdAt: serverTimestamp() });
          }
      });

      try {
          await batch.commit();
          alert("Backup erfolgreich hochgeladen!");
          setLocalBackupAvailable(false);
      } catch(e) {
          alert("Fehler beim Hochladen: " + e.message);
      }
  };

  // 3. WRITE ACTIONS
  // Wir nutzen hier auch den Suffix!
  const getCol = (name) => collection(db, 'artifacts', systemAppId, 'public', 'data', `${name}${roomSuffix ? `_${roomSuffix}` : ''}`);
  const getDocRef = (name, id) => doc(db, 'artifacts', systemAppId, 'public', 'data', `${name}${roomSuffix ? `_${roomSuffix}` : ''}`, id);

  const safeWrite = async (opName, fn) => {
      setWriteError(null);
      if (isDemo) {
          try { await fn(); addLog(`Lokal gespeichert: ${opName}`); } catch(e) {}
          return;
      }
      try {
          await fn();
          addLog(`Gespeichert: ${opName}`);
      } catch (e) {
          console.error("Write Error:", e);
          setWriteError(`Fehler beim Speichern! (${opName})`);
          addLog(`Error: ${e.message}`);
          
          if (e.code === 'permission-denied') {
             setConfigWarning({
                 title: "Keine Schreibrechte",
                 msg: "Du darfst nicht schreiben. Starte den System-Check im Menü.",
                 code: e.code
             });
             setIsDemo(true);
             loadLocalData();
          } else {
             // Andere Fehler
             setIsDemo(true); 
             loadLocalData(); 
          }
      }
  };

  const changeRoom = (e) => {
      e.preventDefault();
      const clean = roomInput.trim().replace(/[^a-zA-Z0-9-_]/g, '');
      localStorage.setItem('knobel_room_suffix', clean);
      setRoomSuffix(clean);
      addLog(`Raumwechsel: ${clean || 'Standard'}`);
      window.location.reload(); // Sauberer Neustart
  };

  // --- ACTIONS ---
  
  const bookPenalty = (mId, mName, title, amount, cId) => safeWrite('Strafe', async () => {
    if (isDemo) { /* Local Logic omitted for brevity, assumes Online first */ return; }
    await updateDoc(getDocRef('knobel_members', mId), { debt: increment(amount) });
    if (cId) await updateDoc(getDocRef('knobel_catalog', cId), { count: increment(1) });
    await addDoc(getCol('knobel_history'), { text: `${mName}: ${title}`, amount, type: 'penalty', createdAt: serverTimestamp() });
  });

  const payDebt = (mId, mName, amount) => safeWrite('Zahlung', async () => {
    await updateDoc(getDocRef('knobel_members', mId), { debt: increment(-amount) });
    await setDoc(getDocRef('knobel_pot', 'main'), { balance: increment(amount) }, { merge: true });
    await addDoc(getCol('knobel_history'), { text: `${mName} Einzahlung`, amount: -amount, type: 'payment', createdAt: serverTimestamp() });
  });

  const bookExpense = (title, amount) => safeWrite('Ausgabe', async () => {
      await setDoc(getDocRef('knobel_pot', 'main'), { balance: increment(-amount) }, { merge: true });
      await addDoc(getCol('knobel_history'), { text: `Ausgabe: ${title}`, amount: -amount, type: 'expense', createdAt: serverTimestamp() });
  });

  const handleAddMember = (name) => safeWrite('Neues Mitglied', async () => {
      await addDoc(getCol('knobel_members'), { name, debt: 0, createdAt: serverTimestamp() });
  });

  const handleDeleteMember = (id) => safeWrite('Löschen', async () => {
      await deleteDoc(getDocRef('knobel_members', id));
  });

  const handleAddCatalog = (title, amount) => safeWrite('Neuer Eintrag', async () => {
      await addDoc(getCol('knobel_catalog'), { title, amount, createdAt: serverTimestamp(), count: 0 });
  });

  const handleDeleteCatalog = (id) => safeWrite('Löschen', async () => {
      await deleteDoc(getDocRef('knobel_catalog', id));
  });

  const handleAddEvent = (date, time, location) => safeWrite('Neuer Termin', async () => {
      await addDoc(getCol('knobel_events'), { date, time, location, createdAt: serverTimestamp() });
  });

  const handleDeleteEvent = (id) => safeWrite('Löschen', async () => {
      await deleteDoc(getDocRef('knobel_events', id));
  });

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (e.target.pin.value === ADMIN_PIN) { setIsAdmin(true); setShowAdminLogin(false); } 
    else alert("Falsche PIN!");
  };

  if (!user && !isDemo) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-white p-6 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
        <p className="animate-pulse mb-2 text-lg font-bold">Lade {roomSuffix || 'Standard'} Raum...</p>
    </div>
  );

  const totalDebt = members.reduce((acc, m) => acc + (m.debt || 0), 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 w-full relative overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 pt-8 shadow-md z-10 w-full">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <HeaderGraphic />
            <button 
                onClick={() => setShowDebug(true)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${isDemo ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-green-500/20 border-green-500 text-green-200'}`}
            >
                {isDemo ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3 animate-pulse" />}
                {roomSuffix || 'Lobby'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} 
                className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
             >
                {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </header>

      {/* ERROR TOAST */}
      {writeError && (
          <div className="bg-red-600 text-white p-4 text-center font-bold text-sm shadow-xl z-50 animate-in slide-in-from-top fixed top-20 left-4 right-4 rounded-xl flex items-center gap-3 border-2 border-white/20">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div className="flex-1 text-left">{writeError}</div>
              <button onClick={() => setWriteError(null)}><X className="w-5 h-5"/></button>
          </div>
      )}

       {/* CONFIG WARNING BANNER */}
       {configWarning && (
          <div className="bg-amber-500 text-white p-4 font-bold text-sm shadow-xl z-50 fixed top-20 left-4 right-4 rounded-xl border-2 border-amber-300">
              <div className="flex items-center gap-2 mb-2">
                 <AlertTriangle className="w-6 h-6 text-white" />
                 <h3 className="uppercase tracking-wider">{configWarning.title}</h3>
              </div>
              <p className="mb-3 font-normal text-amber-50">
                  {configWarning.msg}
              </p>
              <div className="text-xs bg-black/20 p-2 rounded mb-2 font-mono">
                  Fehler-Code: {configWarning.code}
              </div>
              <button onClick={() => setConfigWarning(null)} className="bg-white text-amber-600 px-4 py-2 rounded text-xs font-bold w-full">Verstanden</button>
          </div>
      )}

      {/* RESTORE PROMPT (Wenn DB leer aber Backup da) */}
      {!isDemo && members.length === 0 && localBackupAvailable && (
          <div className="bg-blue-600 text-white p-4 text-center font-bold text-sm shadow-xl z-40 animate-in slide-in-from-top fixed top-24 left-4 right-4 rounded-xl">
              <p className="mb-2">Leerer Raum, aber lokale Daten gefunden!</p>
              <button onClick={restoreBackup} className="bg-white text-blue-600 px-4 py-2 rounded-lg text-xs font-bold mr-2">
                  <Cloud className="w-3 h-3 inline mr-1" /> Daten hierher hochladen
              </button>
              <button onClick={() => setLocalBackupAvailable(false)} className="text-blue-200 text-xs underline">Ignorieren</button>
          </div>
      )}

      {/* OFFLINE BANNER */}
      {isDemo && !configWarning && (
          <div className="bg-amber-500 text-white px-4 py-2 text-center text-xs font-bold shadow-md flex justify-between items-center z-40 relative">
              <span className="flex items-center gap-1"><Info className="w-4 h-4"/> Offline Modus</span>
          </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-slate-50 pb-24 w-full">
        <div className="max-w-2xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardView members={members} history={history} totalDebt={totalDebt} pot={pot} onExpense={bookExpense} catalog={catalog} isAdmin={isAdmin} />}
          {activeTab === 'kasse' && <CashierView members={members} catalog={catalog} onBook={bookPenalty} onPay={payDebt} />}
          {activeTab === 'members' && <MembersView members={members} onPay={payDebt} onAdd={handleAddMember} onDelete={handleDeleteMember} isAdmin={isAdmin} />}
          {activeTab === 'settings' && <CatalogView catalog={catalog} onAdd={handleAddCatalog} onDelete={handleDeleteCatalog} isAdmin={isAdmin} />}
          {activeTab === 'calendar' && <CalendarView events={events} onAdd={handleAddEvent} onDelete={handleDeleteEvent} isAdmin={isAdmin} />}
        </div>
      </main>

      {/* NAVIGATION */}
      <nav className="bg-white border-t border-slate-200 absolute bottom-0 w-full z-20 pb-6 pt-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-between items-center px-4">
          <NavBtn id="dashboard" active={activeTab} set={setActiveTab} icon={Home} label="Start" />
          <NavBtn id="kasse" active={activeTab} set={setActiveTab} icon={Euro} label="Buchen" />
          <NavBtn id="members" active={activeTab} set={setActiveTab} icon={Users} label="Leute" />
          <NavBtn id="settings" active={activeTab} set={setActiveTab} icon={Settings} label="Strafen" />
          <NavBtn id="calendar" active={activeTab} set={setActiveTab} icon={Calendar} label="Termine" />
        </div>
      </nav>

      {/* ADMIN MODAL */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
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

      {/* DEBUG / CONNECTION MODAL */}
      {showDebug && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden my-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                <button onClick={() => setShowDebug(false)} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                    <Terminal className="w-5 h-5"/> Einstellungen
                </h3>
                
                <div className="space-y-4 text-sm">
                    
                    {/* SYSTEM DIAGNOSTICS */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><DiagnosticIcon className="w-4 h-4"/> System Check</h4>
                        {!testResult ? (
                            <button onClick={runConnectionTest} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors">
                                System-Check starten
                            </button>
                        ) : (
                            <div className="space-y-2">
                                {testResult.steps.map((step, i) => (
                                    <div key={i} className="flex justify-between items-start text-xs border-b border-blue-100 last:border-0 pb-1">
                                        <span className="font-bold">{step.name}</span>
                                        <div className="text-right">
                                            <span className={`font-bold px-1 rounded ${step.status === 'OK' ? 'bg-green-100 text-green-700' : step.status === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{step.status}</span>
                                            <div className="text-[10px] opacity-70 mt-0.5 max-w-[150px] break-words">{step.msg}</div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={runConnectionTest} className="w-full bg-blue-100 text-blue-700 py-1 mt-2 rounded text-xs font-bold hover:bg-blue-200 transition-colors">
                                    Nochmal testen
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ROOM SELECTOR */}
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <label className="text-xs uppercase font-bold text-amber-700 block mb-2">Dein Raum-Name</label>
                        <form onSubmit={changeRoom} className="flex gap-2">
                            <input 
                                className="flex-1 p-2 rounded border border-amber-300 text-sm outline-none focus:border-amber-500 bg-white" 
                                placeholder="z.B. MeinClub" 
                                value={roomInput}
                                onChange={e => setRoomInput(e.target.value)}
                            />
                            <button type="submit" className="bg-amber-500 text-white px-3 py-2 rounded font-bold text-xs hover:bg-amber-600 transition-colors">
                                OK
                            </button>
                        </form>
                        {roomSuffix && (
                            <div className="mt-2 text-xs text-center">
                                Aktuell: <span
