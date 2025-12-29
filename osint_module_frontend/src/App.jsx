import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, Activity, RefreshCw, ExternalLink, AlertTriangle, 
  Lock, User, FileText, FileSpreadsheet, XCircle, AlertOctagon,
  Settings, Plus, Trash2, Database
} from 'lucide-react';

// IMPORTAR FIREBASE
import { auth } from './firebase'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const API_URL = "http://127.0.0.1:8000"; 

const stripHtml = (html) => {
  if (!html) return "Sin descripción.";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  const cleanText = tmp.textContent || tmp.innerText || "";
  return cleanText.replace(/\s+/g, ' ').trim();
};

function App() {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(null); // Iniciamos en null
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState({ type: '', text: '' });

  // ESTADOS DE DATOS
  const [findings, setFindings] = useState([]);
  const [sources, setSources] = useState([]);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'news', type: 'rss' });
  const [loading, setLoading] = useState(false);

  //  SESIÓN DE GOOGLE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.emailVerified) {
          const accessToken = await currentUser.getIdToken();
          setUser(currentUser);
          setToken(accessToken);
        } else {
          setMsg({ type: 'error', text: 'Por favor verifica tu correo electrónico antes de ingresar.' });
          signOut(auth);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  //  HANDLERS AUTH 
  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      setMsg({ type: 'error', text: "Error: Credenciales inválidas." });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setMsg({ type: 'success', text: "¡Cuenta creada! Revisa tu correo." });
      signOut(auth);
      setMode("login");
    } catch (error) {
      setMsg({ type: 'error', text: "Error al registrar: " + error.message });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setMsg({ type: 'error', text: "Ingresa tu email para recuperar la contraseña." });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg({ type: 'success', text: "Enlace enviado a tu correo." });
      setMode("login");
    } catch (error) {
      setMsg({ type: 'error', text: "Error: " + error.message });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setToken(null);
    setFindings([]);
    setEmail("");
    setPassword("");
  };

  //  DATA HANDLERS 
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      //  timestamp para evitar cache del navegador
      const response = await axios.get(`${API_URL}/api/v1/findings?t=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = response.data.sort((a, b) => {
        const riskOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return (riskOrder[b.risk_level] || 0) - (riskOrder[a.risk_level] || 0);
      });
      setFindings(sorted);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchSources = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/sources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSources(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/v1/sources`, newSource, { headers: { Authorization: `Bearer ${token}` } });
      setNewSource({ name: '', url: '', category: 'news', type: 'rss' });
      fetchSources();
    } catch (err) { alert("Error agregando fuente"); }
  };

  const handleDeleteSource = async (id) => {
    if(!confirm("¿Borrar fuente?")) return;
    try {
      await axios.delete(`${API_URL}/api/v1/sources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchSources();
    } catch (err) { alert("Error eliminando"); }
  };

  //  EFFECTS 
  useEffect(() => {
    if (token) {
      fetchData();
      fetchSources();
    }
  }, [token]);

  //  UTILS 
  const downloadReport = async (type) => {
    try {
      const endpoint = type === 'pdf' ? '/api/v1/export/pdf' : '/api/v1/export/csv';
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_sentinel.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert("Error descarga"); }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/v1/findings/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setFindings(findings.map(f => f.id === id ? { ...f, status: newStatus } : f));
    } catch (err) { alert("Error update"); }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };

  //  RENDER 
  if (!token) {
    return (
      <div className="min-h-screen bg-osint-dark flex items-center justify-center p-4 font-sans">
        <div className="bg-osint-card p-8 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md">
          <div className="text-center mb-6">
            <ShieldAlert className="text-osint-accent w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">SENTINEL ACCESS</h1>
            <p className="text-gray-400 text-sm mt-2">
              {mode === 'login' && "Identificación Requerida"}
              {mode === 'register' && "Registro de Nuevo Operador"}
              {mode === 'forgot' && "Recuperación de Credenciales"}
            </p>
          </div>

          {msg.text && (
            <div className={`mb-4 text-center text-sm p-3 rounded border ${msg.type === 'error' ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'bg-green-900/20 text-green-400 border-green-500/30'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleResetPassword} className="space-y-6" autoComplete="off">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                <input type="email" autoComplete="email" className="w-full bg-osint-dark border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:border-osint-accent focus:outline-none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
              </div>
            </div>
            
            {mode !== 'forgot' && (
              <div>
                <label className="block text-gray-400 text-sm mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                  <input type="password" autoComplete="new-password" className="w-full bg-osint-dark border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:border-osint-accent focus:outline-none" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-osint-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition duration-200 shadow-lg shadow-blue-900/20">
              {mode === 'login' ? "INGRESAR" : mode === 'register' ? "CREAR CUENTA" : "ENVIAR ENLACE"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => {setMode('register'); setMsg({});}} className="text-gray-500 hover:text-white underline">Crear cuenta nueva</button>
                <button onClick={() => {setMode('forgot'); setMsg({});}} className="text-gray-500 hover:text-white underline">¿Olvidaste tu contraseña?</button>
              </>
            )}
            {(mode === 'register' || mode === 'forgot') && (
              <button onClick={() => {setMode('login'); setMsg({});}} className="text-gray-500 hover:text-white underline">Volver al Login</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER DASHBOARD 
  return (
    <div className="min-h-screen bg-osint-dark text-gray-200 p-6 md:p-10 font-sans relative">
      <header className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center mb-10 border-b border-gray-700 pb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="text-osint-accent w-10 h-10" />
            OSINT Dashboard
          </h1>
          <p className="text-gray-400 mt-2 ml-1 flex items-center gap-2">
            Operador: 
            {/* 👇 BOTÓN DE PERFIL */}
            <button 
              onClick={() => setShowProfileModal(true)}
              className="text-white font-bold hover:text-osint-accent transition flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700 hover:border-osint-accent"
            >
              <User size={14} />
              {user?.email}
            </button>
            <button onClick={handleLogout} className="ml-4 text-xs text-red-400 underline hover:text-red-300">Salir</button>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <button onClick={() => setShowSourcesModal(true)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><Settings size={16} /> Fuentes</button>
          <div className="h-8 w-px bg-gray-700 mx-2 hidden md:block"></div>
          <button onClick={() => downloadReport('pdf')} className="bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><FileText size={16} /> PDF</button>
          <button onClick={() => downloadReport('csv')} className="bg-green-900/40 hover:bg-green-800 text-green-200 border border-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><FileSpreadsheet size={16} /> Excel</button>
          <button onClick={fetchData} className="bg-osint-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-900/20"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </header>

      {/* MODAL FUENTES */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-osint-card w-full max-w-2xl rounded-2xl border border-gray-600 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Database size={20}/> Gestión de Fuentes</h2>
              <button onClick={() => setShowSourcesModal(false)} className="text-gray-400 hover:text-white"><XCircle /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddSource} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <input type="text" placeholder="Nombre" className="md:col-span-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-osint-accent" value={newSource.name} onChange={e => setNewSource({...newSource, name: e.target.value})} required />
                <input type="url" placeholder="URL" className="md:col-span-2 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-osint-accent" value={newSource.url} onChange={e => setNewSource({...newSource, url: e.target.value})} required />
                <select className="bg-gray-800 border border-gray-600 rounded px-2 py-2 text-sm text-gray-300" value={newSource.type} onChange={e => setNewSource({...newSource, type: e.target.value})}><option value="rss">RSS</option><option value="reddit">Reddit</option></select>
                <button type="submit" className="md:col-span-4 bg-green-600 hover:bg-green-500 text-white rounded py-2 text-sm font-bold flex items-center justify-center gap-2"><Plus size={16}/> Agregar</button>
              </form>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {sources.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700">
                    <div><div className="font-bold text-sm text-white">{s.name}</div><div className="text-xs text-gray-400 truncate max-w-xs">{s.url}</div></div>
                    <button onClick={() => handleDeleteSource(s.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL DE USUARIO*/}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><XCircle /></button>
            
            <div className="bg-gradient-to-r from-blue-900/50 to-slate-900/50 p-8 text-center border-b border-gray-700">
              <div className="w-24 h-24 bg-osint-dark rounded-full mx-auto border-4 border-osint-accent flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <User size={48} className="text-osint-accent" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">AGENTE SENTINEL</h2>
              <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-500/30 mt-2 inline-block">Nivel 1: Analista</span>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Identificador</span>
                <span className="text-white font-mono text-sm">{user?.uid?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Email Verificado</span>
                <span className={user?.emailVerified ? "text-green-400" : "text-red-400"}>
                  {user?.emailVerified ? "CONFIRMADO" : "PENDIENTE"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Último Acceso</span>
                <span className="text-white text-sm">{new Date().toLocaleDateString()}</span>
              </div>

              <button onClick={() => setShowProfileModal(false)} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition">
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}


      <main className="max-w-7xl mx-auto">
        {loading && findings.length === 0 ? <div className="text-center py-20"><div className="animate-pulse text-osint-accent text-xl">Procesando...</div></div> : 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {findings.map((item) => (
              <article key={item.id} className={`bg-osint-card p-6 rounded-xl border transition duration-300 flex flex-col hover:shadow-xl ${item.status === 'discarded' ? 'border-gray-700 opacity-50' : 'border-gray-700/50 hover:border-osint-accent'}`}>
                <div className="flex justify-between items-start mb-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRiskColor(item.risk_level)}`}>{item.risk_level}</span>{item.status !== 'new' && <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 uppercase">{item.status}</span>}</div>
                <h3 className="text-lg font-bold text-white mb-3 leading-snug line-clamp-2 hover:text-osint-accent transition"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
                <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-grow">
                  {stripHtml(item.content)}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => updateStatus(item.id, 'discarded')} disabled={item.status === 'discarded'} className="flex items-center justify-center gap-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition border border-gray-700 disabled:opacity-50"><XCircle size={14} /> Descartar</button>
                  <button onClick={() => updateStatus(item.id, 'escalated')} disabled={item.status === 'escalated'} className="flex items-center justify-center gap-2 py-1.5 rounded bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 text-xs transition border border-gray-700 disabled:opacity-50"><AlertOctagon size={14} /> Escalar</button>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center gap-2"><Activity size={14} className={item.sentiment < 0 ? "text-red-400" : "text-green-400"} /><span>Score: {item.sentiment?.toFixed(2)}</span></div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-osint-accent hover:text-white transition">Ver Fuente <ExternalLink size={12} /></a>
                </div>
              </article>
            ))}
          </div>
        }
      </main>
    </div>
  );
}

export default App;