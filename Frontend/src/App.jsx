import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ShieldAlert, Activity, RefreshCw, ExternalLink, AlertTriangle,
  Lock, User, FileText, FileSpreadsheet, XCircle, AlertOctagon,
  Settings, Plus, Trash2, Database, Share2
} from 'lucide-react';

import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const stripHtml = (html) => {
  if (!html) return "Sin descripción.";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  const cleanText = tmp.textContent || tmp.innerText || "";
  return cleanText.replace(/\s+/g, ' ').trim();
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [findings, setFindings] = useState([]);
  const [sources, setSources] = useState([]);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualFinding, setManualFinding] = useState({ title: '', content: '', risk_level: 'low', url: '' });

  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'news', type: 'rss' });
  const [loading, setLoading] = useState(false);

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

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    try {
      await axios.post(`${API_URL}/api/v1/findings/manual`, manualFinding, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManualFinding({ title: '', content: '', risk_level: 'low', url: '' });
      setShowManualModal(false);
      setMsg({ type: 'success', text: "Entrada humana registrada." });
      fetchData();

    } catch (err) {
      console.error(err);
      alert("Error al registrar entrada: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setToken(null);
    setFindings([]);
    setEmail("");
    setPassword("");
  };

  const handleSocialScan = async (e) => {
    if (e) e.preventDefault(); 
    console.log("Intento de Scan Social iniciado...");
    
    if (!token) {
        console.error("Error: No hay token de sesión");
        alert("Error de sesión: No hay token válido. Intenta recargar la página.");
        return;
    }

    setLoading(true);
    try {
      console.log(`Enviando POST a ${API_URL}/api/v1/simulate/social`);
      
      const response = await axios.post(`${API_URL}/api/v1/simulate/social`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Respuesta del servidor:", response);
      setMsg({ type: 'success', text: "Escaneo de Redes Sociales completado." });

      fetchData();

    } catch (err) {
      console.error("Error en Scan Social:", err);
      alert("Error en escaneo social: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
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
    if (!confirm("¿Borrar fuente?")) return;
    try {
      await axios.delete(`${API_URL}/api/v1/sources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchSources();
    } catch (err) { alert("Error eliminando"); }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchSources();
    }
  }, [token]);

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

  if (!token) {
    return (
      <div className="min-h-screen bg-osint-dark flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl border border-gray-300 shadow-2xl w-full max-w-md">
          <div className="text-center mb-6">
            <ShieldAlert className="text-blue-600 w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">SENTINEL ACCESS</h1>
            <p className="text-gray-500 text-sm mt-2">
              {mode === 'login' && "Identificación Requerida"}
              {mode === 'register' && "Registro de Nuevo Operador"}
              {mode === 'forgot' && "Recuperación de Credenciales"}
            </p>
          </div>

          {msg.text && (
            <div className={`mb-4 text-center text-sm p-3 rounded border ${msg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleResetPassword} className="space-y-6" autoComplete="off">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input type="email" autoComplete="email" className="w-full bg-white border-2 border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:border-blue-600 focus:outline-none shadow-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input type="password" autoComplete="new-password" className="w-full bg-white border-2 border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:border-blue-600 focus:outline-none shadow-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-lg">
              {mode === 'login' ? "INGRESAR" : mode === 'register' ? "CREAR CUENTA" : "ENVIAR ENLACE"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => { setMode('register'); setMsg({}); }} className="text-gray-600 hover:text-blue-600 underline">Crear cuenta nueva</button>
                <button onClick={() => { setMode('forgot'); setMsg({}); }} className="text-gray-600 hover:text-blue-600 underline">¿Olvidaste tu contraseña?</button>
              </>
            )}
            {(mode === 'register' || mode === 'forgot') && (
              <button onClick={() => { setMode('login'); setMsg({}); }} className="text-gray-600 hover:text-blue-600 underline">Volver al Login</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900 p-6 md:p-10 font-sans relative">
      <header className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center mb-10 border-b border-gray-300 pb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight text-gray-900">
             <ShieldAlert className="text-blue-600" />
             SENTINEL <span className="text-gray-500 font-normal text-sm ml-1">| Intelligence Module</span>
           </h1>
          <p className="text-gray-500 mt-2 ml-1 flex items-center gap-2">
            Operador:
            <button
              onClick={() => setShowProfileModal(true)}
              className="text-gray-700 font-bold hover:text-blue-600 transition flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-300 hover:border-blue-500 shadow-sm"
            >
              <User size={14} />
              {user?.email}
            </button>
            <button onClick={handleLogout} className="ml-4 text-xs text-red-600 underline hover:text-red-800">Salir</button>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center items-center">
          <button onClick={() => setShowManualModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-md">
            <Plus size={16} /> Entrada Manual
          </button>

          <button type="button" onClick={handleSocialScan} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-md">
            <Share2 size={16} /> Scan Social
          </button>

          <button onClick={() => setShowSourcesModal(true)} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-sm"><Settings size={16} /> Fuentes</button>
          <div className="h-8 w-px bg-gray-300 mx-2 hidden md:block"></div>
          <button onClick={() => downloadReport('pdf')} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><FileText size={16} /> PDF</button>
          <button onClick={() => downloadReport('csv')} className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><FileSpreadsheet size={16} /> Excel</button>
          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition shadow-md"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </header>

      {/* MODAL FUENTES */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Database size={20} className="text-blue-600"/> Gestión de Fuentes</h2>
              <button onClick={() => setShowSourcesModal(false)} className="text-gray-400 hover:text-gray-700"><XCircle /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddSource} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                
                {/* INPUTS DE FUENTES*/}
                <input type="text" placeholder="Nombre de fuente" 
                  className="md:col-span-1 bg-white border-2 border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 shadow-sm" 
                  value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} required />
                
                <input type="url" placeholder="URL del Feed / API" 
                  className="md:col-span-2 bg-white border-2 border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 shadow-sm" 
                  value={newSource.url} onChange={e => setNewSource({ ...newSource, url: e.target.value })} required />
                
                <select className="bg-white border-2 border-gray-300 rounded px-2 py-2 text-sm text-gray-900 focus:border-blue-600 shadow-sm" 
                  value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value })}>
                    <option value="rss">RSS Feed</option>
                    <option value="reddit">Reddit API</option>
                </select>
                
                <button type="submit" className="md:col-span-4 bg-green-600 hover:bg-green-700 text-white rounded py-2 text-sm font-bold flex items-center justify-center gap-2 shadow-sm"><Plus size={16} /> Agregar Fuente</button>
              </form>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {sources.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div><div className="font-bold text-sm text-gray-900">{s.name}</div><div className="text-xs text-gray-500 truncate max-w-xs">{s.url}</div></div>
                    <button onClick={() => handleDeleteSource(s.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white"><XCircle /></button>

            <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-8 text-center border-b border-blue-900">
              <div className="w-24 h-24 bg-white rounded-full mx-auto border-4 border-blue-300 flex items-center justify-center mb-4 shadow-lg">
                <User size={48} className="text-blue-800" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">AGENTE SENTINEL</h2>
              <span className="bg-blue-700 text-blue-100 text-xs px-3 py-1 rounded-full border border-blue-500 mt-2 inline-block">Nivel 1: Analista</span>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Identificador</span>
                <span className="text-gray-900 font-mono text-sm">{user?.uid?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Email Verificado</span>
                <span className={user?.emailVerified ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {user?.emailVerified ? "CONFIRMADO" : "PENDIENTE"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Último Acceso</span>
                <span className="text-gray-900 text-sm">{new Date().toLocaleDateString()}</span>
              </div>

              <button onClick={() => setShowProfileModal(false)} className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg font-bold transition shadow-md">
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL ENTRY */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl p-6 relative">

            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-orange-600" /> Registro Humano (HUMINT)
              </h2>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-700"><XCircle /></button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-gray-700 text-xs uppercase font-bold">Título del Hallazgo</label>
                {/* INPUT BLANCO SÓLIDO */}
                <input type="text" className="w-full bg-white border-2 border-gray-300 rounded p-2 text-gray-900 focus:border-blue-600 focus:outline-none mt-1 shadow-sm"
                  value={manualFinding.title} onChange={e => setManualFinding({ ...manualFinding, title: e.target.value })} required placeholder="Ej: Reporte de vulnerabilidad en sector 7..." />
              </div>

              <div>
                <label className="text-gray-700 text-xs uppercase font-bold">Descripción Detallada</label>
                <textarea className="w-full bg-white border-2 border-gray-300 rounded p-2 text-gray-900 focus:border-blue-600 focus:outline-none mt-1 h-24 shadow-sm"
                  value={manualFinding.content} onChange={e => setManualFinding({ ...manualFinding, content: e.target.value })} required placeholder="Ingrese los detalles de inteligencia aquí..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-700 text-xs uppercase font-bold">Nivel de Riesgo</label>
                  <select className="w-full bg-white border-2 border-gray-300 rounded p-2 text-gray-900 focus:border-blue-600 mt-1 shadow-sm"
                    value={manualFinding.risk_level} onChange={e => setManualFinding({ ...manualFinding, risk_level: e.target.value })}>
                    <option value="low">Bajo</option>
                    <option value="medium">Medio</option>
                    <option value="high">Alto</option>
                    <option value="critical">Crítico</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-700 text-xs uppercase font-bold">URL Referencia (Opcional)</label>
                  <input type="url" className="w-full bg-white border-2 border-gray-300 rounded p-2 text-gray-900 focus:border-blue-600 mt-1 shadow-sm"
                    value={manualFinding.url} onChange={e => setManualFinding({ ...manualFinding, url: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg mt-4 shadow-lg transition transform active:scale-95">
                REGISTRAR HALLAZGO
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto">
        {loading && findings.length === 0 ? <div className="text-center py-20"><div className="animate-pulse text-blue-600 text-xl font-bold">Procesando Inteligencia...</div></div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {findings.map((item) => (
              <article key={item.id} className={`p-6 rounded-xl border transition duration-300 flex flex-col hover:shadow-xl ${
                item.status === 'discarded' 
                  ? 'bg-gray-100 border-gray-300 opacity-60' 
                  : 'bg-white border-gray-200 hover:border-blue-500 shadow-sm'
              }`}>
                {/* HEADERS TARJETA */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border tracking-wider ${
                    item.risk_level === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                    item.risk_level === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    item.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {item.risk_level}
                  </span>
                  {item.status !== 'new' && (
                    <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded uppercase">
                      {item.status}
                    </span>
                  )}
                </div>

                {/* TITULO Y CONTENIDO */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight line-clamp-2 hover:text-blue-700 transition">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                  {stripHtml(item.content)}
                </p>

                {/* BOTONES */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button 
                    onClick={() => updateStatus(item.id, 'discarded')} 
                    disabled={item.status === 'discarded'} 
                    className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition border
                      ${item.status === 'discarded'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300 line-through'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    <XCircle size={14} /> Descartar
                  </button>
                  
                  <button 
                    onClick={() => updateStatus(item.id, 'escalated')} 
                    disabled={item.status === 'escalated'} 
                    className={`flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition border
                      ${item.status === 'escalated'
                        ? 'bg-red-100 text-red-800 cursor-not-allowed border-red-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                      }`}
                  >
                    <AlertOctagon size={14} /> Escalar
                  </button>
                </div>

                {/* FOOTER TARJETA */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className={item.sentiment < 0 ? "text-red-600" : "text-green-600"} />
                    <span className="text-gray-700">Score: {item.sentiment?.toFixed(2)}</span>
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                    Ver Fuente <ExternalLink size={12} />
                  </a>
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