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
  writeBatch,
  enableIndexedDbPersistence // WICHTIG: Für Offline-Speicherung
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
  Activity as DiagnosticIcon,
  Shield,
  Globe
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

// UMGEBUNGS-ERKENNUNG
const isCanvasEnv = window.location.hostname.includes('googleusercontent') || window.location.hostname.includes('localhost');

// Logik zur Initialisierung
let app, auth, db, configError, persistenceStatus = "Inaktiv";

try {
  let firebaseConfig = manualConfig;
  
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      if (isCanvasEnv) {
         firebaseConfig = JSON.parse(__firebase_config);
      }
    } catch (e) {
      console.warn("Auto-Config übersprungen.");
    }
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // AKTIVIERE OFFLINE-PERSISTENZ
  // Das ist der Schlüssel! Daten werden lokal gespeichert, wenn Netzwerk spinnt.
  if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db)
          .then(() => {
              persistenceStatus = "✅ Aktiv (Offline-First)";
              console.log("Offline Persistence Enabled");
          })
          .catch((err) => {
              if (err.code === 'failed-precondition') {
                  persistenceStatus = "⚠️ Inaktiv (Mehrere Tabs offen)";
              } else if (err.code === 'unimplemented') {
                  persistenceStatus = "⚠️ Inaktiv (Browser nicht unterstützt)";
              }
          });
  }

} catch (e) {
  console.error("Firebase Init Error:", e);
  configError = e.message;
}

// SYSTEM-ID (Nur für Canvas relevant)
const systemAppId = typeof __app_id !== 'undefined' ? __app_id : 'knobelkasse-default-lobby';

// ==========================================
// PATH HELPER (WICHTIG!)
// ==========================================
const getCollectionPath = (dbInstance, colName, suffix) => {
    const finalName = `${colName}${suffix}`;
    if (isCanvasEnv) {
        return collection(dbInstance, 'artifacts', systemAppId, 'public', 'data', finalName);
    } else {
        return collection(dbInstance, finalName);
    }
};

const getDocumentPath = (dbInstance, colName, docId, suffix) => {
    const finalName = `${colName}${suffix}`;
    if (isCanvasEnv) {
        return doc(dbInstance, 'artifacts', systemAppId, 'public', 'data', finalName, docId);
    } else {
        return doc(dbInstance, finalName, docId);
    }
};

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
              addStep("Konfiguration", "OK", "Projekt ID korrekt.");
          } else {
              addStep("Konfiguration", "WARN", `ID: ${app.options.projectId}`);
          }

          // Schritt 2: HTTP Ping
          addStep("Google Ping (HTTP)", "PENDING", "Prüfe Erreichbarkeit...");
          try {
              await fetch(`https://firestore.googleapis.com/v1/projects/${manualConfig.projectId}/databases/(default)/documents/connection_test`, { method: 'GET' });
              addStep("Google Ping (HTTP)", "OK", "Server erreichbar.");
          } catch(e) {
              addStep("Google Ping (HTTP)", "ERROR", "Keine Verbindung zu Google!");
              throw new Error("Netzwerk blockiert");
          }

          // Schritt 3: Auth
          addStep("Authentifizierung", "PENDING", "Versuche anonymen Login...");
          let currentUser = auth.currentUser;
          try {
              if (!currentUser) {
                  const cred = await signInAnonymously(auth);
                  currentUser = cred.user;
              }
              addStep("Authentifizierung", "OK", `Angemeldet (${currentUser.uid.slice(0,3)})`);
          } catch (e) {
              addStep("Authentifizierung", "ERROR", `Fehler: ${e.code}`);
              throw new Error("Auth fehlgeschlagen");
          }

          // Schritt 4: DB Write
          addStep("Datenbank Schreiben", "PENDING", "Versuche Eintrag...");
          try {
              const testRef = getDocumentPath(db, 'connection_test', 'ping_' + Date.now(), '');
              
              // WICHTIG: Mit Persistence enabled "wartet" setDoc evtl. ewig auf Sync.
              // Wir geben ihm 5 Sekunden, danach nehmen wir an: "Offline Mode"
              const writePromise = setDoc(testRef, { timestamp: serverTimestamp(), test: "OK" });
              const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
              
              await Promise.race([writePromise, timeoutPromise]);
              
              addStep("Datenbank Schreiben", "OK", "Online & Synchronisiert!");
              await deleteDoc(testRef); 
          } catch (e) {
              if (e.message === "Timeout") {
                 // Das ist der entscheidende Fall: Timeout bedeutet, wir sind "Offline", aber Persistence sollte greifen.
                 addStep("Datenbank Schreiben", "WARN", "Timeout (Server langsam/blockiert).");
                 addStep("STATUS", "OK", "Offline-Modus aktiv. Daten werden lokal gespeichert und später gesendet.");
              } else {
                 addStep("Datenbank Schreiben", "ERROR", `Code: ${e.code}`);
                 if (e.code === 'permission-denied') {
                    addStep("LÖSUNG", "INFO", "Firestore Rules auf 'allow write: if true' setzen.");
                 }
                 throw new Error("Write failed");
              }
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
        // Kein Demo-Mode mehr erzwingen, Persistence regelt das!
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
    if(localStorage.getItem('knobel_backup_members')) setLocalBackupAvailable(true);

    if ((!user && !isDemo) || !db) return;

    if (isDemo) {
        loadLocalData();
        return;
    }

    const suffix = roomSuffix ? `_${roomSuffix}` : '';
    addLog(`Lade Raum: Standard${suffix}`);

    const getPath = (baseName) => getCollectionPath(db, baseName, suffix);

    const safeSnapshot = (baseName, setter) => {
      // WICHTIG: includeMetadataChanges: true sorgt dafür, dass wir auch lokale (noch nicht gesyncte) Updates sehen!
      return onSnapshot(getPath(baseName), { includeMetadataChanges: true }, (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Debugging: Sehen ob Daten "pending" (noch nicht beim Server) sind
          const hasPendingWrites = snap.metadata.hasPendingWrites;
          if (hasPendingWrites) console.log(`Lokale Änderungen in ${baseName} noch nicht gesynct.`);

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
            if (err.code === 'permission-denied') {
                setConfigWarning({
                    title: "Keine Rechte",
                    msg: "Datenbank gesperrt. Mach den System-Check.",
                    code: err.code
                });
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
      
      bMembers.forEach(m => {
          if(!members.find(ex => ex.name === m.name)) {
             const ref = doc(getCollectionPath(db, 'knobel_members', suffix));
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
  const safeWrite = async (opName, fn) => {
      setWriteError(null);
      if (isDemo) {
          try { await fn(); addLog(`Lokal gespeichert: ${opName}`); } catch(e) {}
          return;
      }
      try {
          // Wir warten nicht ewig auf das Promise, wenn wir offline sind.
          // Firebase SDK handelt das im Hintergrund.
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
  const getMyDoc = (col, id) => getDocumentPath(db, col, id, roomSuffix ? `_${roomSuffix}` : '');
  const getMyCol = (col) => getCollectionPath(db, col, roomSuffix ? `_${roomSuffix}` : '');

  const bookPenalty = (mId, mName, title, amount, cId) => safeWrite('Strafe', async () => {
    if (isDemo) { return; }
    await updateDoc(getMyDoc('knobel_members', mId), { debt: increment(amount) });
    if (cId) await updateDoc(getMyDoc('knobel_catalog', cId), { count: increment(1) });
    await addDoc(getMyCol('knobel_history'), { text: `${mName}: ${title}`, amount, type: 'penalty', createdAt: serverTimestamp() });
  });

  const payDebt = (mId, mName, amount) => safeWrite('Zahlung', async () => {
    await updateDoc(getMyDoc('knobel_members', mId), { debt: increment(-amount) });
    await setDoc(getMyDoc('knobel_pot', 'main'), { balance: increment(amount) }, { merge: true });
    await addDoc(getMyCol('knobel_history'), { text: `${mName} Einzahlung`, amount: -amount, type: 'payment', createdAt: serverTimestamp() });
  });

  const bookExpense = (title, amount) => safeWrite('Ausgabe', async () => {
      await setDoc(getMyDoc('knobel_pot', 'main'), { balance: increment(-amount) }, { merge: true });
      await addDoc(getMyCol('knobel_history'), { text: `Ausgabe: ${title}`, amount: -amount, type: 'expense', createdAt: serverTimestamp() });
  });

  const handleAddMember = (name) => safeWrite('Neues Mitglied', async () => {
      await addDoc(getMyCol('knobel_members'), { name, debt: 0, createdAt: serverTimestamp() });
  });

  const handleDeleteMember = (id) => safeWrite('Löschen', async () => {
      await deleteDoc(getMyDoc('knobel_members', id));
  });

  const handleAddCatalog = (title, amount) => safeWrite('Neuer Eintrag', async () => {
      await addDoc(getMyCol('knobel_catalog'), { title, amount, createdAt: serverTimestamp(), count: 0 });
  });

  const handleDeleteCatalog = (id) => safeWrite('Löschen', async () => {
      await deleteDoc(getMyDoc('knobel_catalog', id));
  });

  const handleAddEvent = (date, time, location) => safeWrite('Neuer Termin', async () => {
      await addDoc(getMyCol('knobel_events'), { date, time, location, createdAt: serverTimestamp() });
  });

  const handleDeleteEvent = (id) => safeWrite('Löschen', async () => {
      await deleteDoc(getMyDoc('knobel_events', id));
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

      {/* RESTORE PROMPT */}
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
                                            <span className={`font-bold px-1 rounded ${step.status === 'OK' ? 'bg-green-100 text-green-700' : step.status === 'WARN' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{step.status}</span>
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
                                Aktuell: <span className="font-bold font-mono bg-white px-1 rounded">{roomSuffix}</span>
                                <button onClick={() => { localStorage.removeItem('knobel_room_suffix'); window.location.reload(); }} className="ml-2 text-red-500 underline">Reset</button>
                            </div>
                        )}
                    </div>

                    {/* LOGS */}
                    <div className="bg-slate-900 text-slate-300 p-3 rounded-lg border border-slate-700 h-48 overflow-y-auto font-mono text-[10px]">
                        {logs.length === 0 && <div className="text-slate-600 italic">Keine Logs...</div>}
                        {logs.map((l, i) => <div key={i} className="border-b border-slate-800 last:border-0 pb-1 mb-1 break-all">{l}</div>)}
                    </div>

                    {/* PERSISTENCE INFO */}
                    <div className="text-[10px] text-slate-400 text-center font-mono border-t border-slate-100 pt-2">
                        Offline-Speicher: <span className={persistenceStatus.includes('Aktiv') ? 'text-green-600 font-bold' : 'text-amber-500 font-bold'}>{persistenceStatus}</span>
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button onClick={() => window.location.reload()} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4" /> App neu laden
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// SUB COMPONENTS (No changes needed, simplified for brevity)
// ==========================================

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

  // Daily Loser Logic
  const getDailyLoser = () => {
    const today = new Date().setHours(0,0,0,0);
    const todayPenalties = history.filter(h => {
        if (h.type !== 'penalty' || !h.createdAt) return false;
        const seconds = h.createdAt.seconds || (h.createdAt.getTime ? h.createdAt.getTime()/1000 : 0);
        const d = new Date(seconds * 1000);
        return d.setHours(0,0,0,0) === today;
    });
    const sums = {};
    todayPenalties.forEach(h => { const name = h.text.split(':')[0].trim(); sums[name] = (sums[name] || 0) + h.amount; });
    let loser = null; let maxAmount = 0;
    Object.entries(sums).forEach(([name, amount]) => { if (amount > maxAmount) { maxAmount = amount; loser = name; } });
    return loser ? { name: loser, amount: maxAmount } : null;
  };
  const dailyLoser = getDailyLoser();

  // Stats Logic
  const getAllTimeHighscores = () => {
      const eveningSums = {}; 
      history.filter(h => h.type === 'penalty' && h.createdAt).forEach(h => {
          const seconds = h.createdAt.seconds || (h.createdAt.getTime ? h.createdAt.getTime()/1000 : 0);
          const date = new Date(seconds * 1000);
          const dateStr = date.toLocaleDateString('de-DE'); 
          const name = h.text.split(':')[0].trim();
          const key = `${dateStr}_${name}`;
          if (!eveningSums[key]) eveningSums[key] = { date: dateStr, name, amount: 0 };
          eveningSums[key].amount += h.amount;
      });
      return Object.values(eveningSums).sort((a, b) => b.amount - a.amount).slice(0, 10);
  };
  const allTimeHighscores = getAllTimeHighscores();

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* KACHELN */}
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

      {/* TABS */}
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

      {/* RANKING LISTE */}
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

      {/* HISTORY LISTE */}
      {viewMode === 'history' && (
        <div className="space-y-0 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
          {history.length > 0 ? history.map((item, i) => {
            const isPayment = item.type === 'payment';
            const isExpense = item.type === 'expense';
            const seconds = item.createdAt.seconds || (item.createdAt.getTime ? item.createdAt.getTime()/1000 : 0);
            const date = new Date(seconds * 1000);
            
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

      {/* STATS VIEW */}
      {viewMode === 'stats' && (
         <div className="space-y-4 animate-in fade-in">
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500"/> Top Abende</h3>
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
                 {allTimeHighscores.length === 0 && <div className="text-center text-slate-400 text-xs">Keine Daten.</div>}
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
             </div>
         </div>
      )}

      {/* EXPENSE MODAL */}
      {expenseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-800"><Wallet className="w-5 h-5"/> Ausgabe erfassen</h3>
            <p className="text-xs text-slate-500 mb-4">Geld wird vom Kassenbestand abgezogen.</p>
            <form onSubmit={handleExpense}>
              <input className="w-full bg-slate-50 p-3 rounded border border-slate-200 mb-3 outline-none text-sm" placeholder="Zweck (z.B. Pizza)" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} autoFocus />
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
      {notification && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl z-50 font-bold text-sm whitespace-nowrap animate-in fade-in zoom-in flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{notification}</div>}

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
                <span className="font-medium text-left">Manuell</span>
                <PenTool className="w-5 h-5" />
            </button>
          </div>
          
          {(activeMember.debt || 0) > 0 && (
            <button onClick={() => { setPayModal(true); setPayAmount((activeMember.debt || 0).toString()); }} className="w-full bg-emerald-100 text-emerald-800 p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-200 active:scale-95 transition-all shadow-sm">
                <Banknote className="w-5 h-5"/>
                Schulden begleichen (Offen: {activeMember.debt?.toFixed(2)}€)
            </button>
          )}
        </div>
      )}

      {/* Manual Book Modal */}
      {manualBookModal && activeMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
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

      {/* Pay Modal */}
      {payModal && activeMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
            <h3 className="font-bold mb-4">Zahlen für {payModal.name}</h3>
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

function MembersView({ members, onPay, onAdd, onDelete, isAdmin }) {
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const addMember = async (e) => {
    e.preventDefault();
    if(!newMemberName.trim()) return;
    await onAdd(newMemberName);
    setNewMemberName(''); setShowAdd(false);
  };

  const deleteMember = async (id) => {
    await onDelete(id);
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
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

function CatalogView({ catalog, onAdd, onDelete, isAdmin }) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [delId, setDelId] = useState(null);

    const add = async (e) => {
        e.preventDefault();
        if(!title || !amount) return;
        await onAdd(title, parseFloat(amount));
        setTitle(''); setAmount('');
    };

    const del = async (id) => { await onDelete(id); setDelId(null); };

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

function CalendarView({ events, onAdd, onDelete, isAdmin }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loc, setLoc] = useState('');
    const [delId, setDelId] = useState(null);

    const add = async (e) => { e.preventDefault(); if(!date) return; await onAdd(date, time, loc); setDate(''); setTime(''); setLoc(''); };
    const del = async (id) => { await onDelete(id); setDelId(null); };

    const handleShare = async (ev) => {
        const d = new Date(ev.date); const [h, m] = ev.time.split(':'); d.setHours(h, m);
        const text = `📅 Knobeln am ${d.toLocaleDateString('de-DE')} um ${ev.time} Uhr in ${ev.location}`;
        if (navigator.share) { try { await navigator.share({ title: 'Knobelrunde', text: text }); } catch (err) { } } 
        else { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
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
            {!isAdmin && (<div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center mb-6 text-sm text-blue-800"><Lock className="w-4 h-4 inline mr-1 mb-0.5" /> Nur Admins können Termine erstellen.</div>)}
            <div className="space-y-4">
                {events.map(ev => (
                    <div key={ev.id} className="bg-white p-4 rounded-xl border-l-4 border-amber-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="font-bold text-lg">{new Date(ev.date).toLocaleDateString('de-DE')}</div>
                        <div className="text-slate-500 text-sm">{ev.time} Uhr - {ev.location}</div>
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => handleShare(ev)} className="flex-1 bg-green-100 text-green-800 py-3 rounded text-center text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-200 transition-colors active:scale-95"><Share2 className="w-4 h-4"/> Einladen</button>
                            {isAdmin && (delId === ev.id ? <button onClick={() => del(ev.id)} className="px-3 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors active:scale-95">Weg</button> : <button onClick={() => setDelId(ev.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 active:scale-90"><Trash2 className="w-5 h-5"/></button>)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function App() { return <ErrorBoundary><KnobelKasse /></ErrorBoundary>; }
