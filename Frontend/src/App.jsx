import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ShieldAlert, Activity, RefreshCw, ExternalLink, AlertTriangle,
  Lock, User, FileText, FileSpreadsheet, XCircle, AlertOctagon,
  Settings, Plus, Trash2, Database, Share2, LayoutDashboard, ScrollText
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
  if (!html) return "No description.";
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
  
  // MODALES
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false); 

  // DATOS ADMIN
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

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
          setMsg({ type: 'error', text: 'Please verify your email before logging in.' });
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
      setMsg({ type: 'error', text: "Error: Invalid credentials." });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setMsg({ type: 'success', text: "Account created! Please check your email." });
      signOut(auth);
      setMode("login");
    } catch (error) {
      setMsg({ type: 'error', text: "Registration error: " + error.message });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setMsg({ type: 'error', text: "Enter your email to reset password." });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg({ type: 'success', text: "Reset link sent to your email." });
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

  //  ACTIONS 

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    try {
      await axios.post(`${API_URL}/api/v1/findings/manual`, manualFinding, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManualFinding({ title: '', content: '', risk_level: 'low', url: '' });
      setShowManualModal(false);
      setMsg({ type: 'success', text: "Human entry registered." });
      fetchData();
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleSocialScan = async (e) => {
    if (e) e.preventDefault(); 
    if (!token) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/v1/simulate/social`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: 'success', text: "Social Media Scan Completed." });
      fetchData();
    } catch (err) {
      alert("Scan error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFinding = async (id) => {
    if (!confirm("⚠️ Are you sure you want to PERMANENTLY DELETE this target?\nThis action cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/api/v1/findings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFindings(findings.filter(f => f.id !== id));
    } catch (err) {
      alert("Error deleting: " + (err.response?.data?.detail || "Server Error"));
    }
  };

  //  DATA FETCHING 

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/findings?t=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = response.data.sort((a, b) => {
        if (a.status === 'new' && b.status !== 'new') return -1;
        if (a.status !== 'new' && b.status === 'new') return 1;
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

  //  ADMIN FETCH 
  const fetchAdminData = async () => {
    if (!token) return;
    try {
        const [logsRes, statsRes] = await Promise.all([
            axios.get(`${API_URL}/api/v1/admin/logs`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/api/v1/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setAdminLogs(logsRes.data);
        setAdminStats(statsRes.data);
    } catch (err) {
        console.error("Admin fetch error", err);
        // Si falla (ej: 403), no hacemos nada o mostramos alerta
    }
  };

  // Se activa al abrir el modal admin
  useEffect(() => {
    if (showAdminModal) fetchAdminData();
  }, [showAdminModal]);


  const handleAddSource = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/v1/sources`, newSource, { headers: { Authorization: `Bearer ${token}` } });
      setNewSource({ name: '', url: '', category: 'news', type: 'rss' });
      fetchSources();
    } catch (err) { alert("Error adding source"); }
  };

  const handleDeleteSource = async (id) => {
    if (!confirm("Delete source?")) return;
    try {
      await axios.delete(`${API_URL}/api/v1/sources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchSources();
    } catch (err) { alert("Error deleting source"); }
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
      link.setAttribute('download', `sentinel_report.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert("Download error"); }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/v1/findings/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setFindings(findings.map(f => f.id === id ? { ...f, status: newStatus } : f));
    } catch (err) { alert("Update error"); }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-osint-dark flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl border border-gray-300 shadow-2xl w-full max-w-md">
          <div className="text-center mb-6">
            <ShieldAlert className="text-blue-600 w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">SENTINEL ACCESS</h1>
            <p className="text-gray-500 text-sm mt-2">
              {mode === 'login' && "Authentication Required"}
              {mode === 'register' && "New Operator Registration"}
              {mode === 'forgot' && "Credential Recovery"}
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
                <input type="email" autoComplete="email" className="w-full bg-white border-2 border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:border-blue-600 focus:outline-none shadow-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" required />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input type="password" autoComplete="new-password" className="w-full bg-white border-2 border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:border-blue-600 focus:outline-none shadow-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-lg">
              {mode === 'login' ? "LOGIN" : mode === 'register' ? "CREATE ACCOUNT" : "SEND LINK"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => { setMode('register'); setMsg({}); }} className="text-gray-600 hover:text-blue-600 underline">Create new account</button>
                <button onClick={() => { setMode('forgot'); setMsg({}); }} className="text-gray-600 hover:text-blue-600 underline">Forgot password?</button>
              </>
            )}
            {(mode === 'register' || mode === 'forgot') && (
              <button onClick={() => { setMode('login'); setMsg({}); }} className="text-gray-600 hover:text-blue-600 underline">Back to Login</button>
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
            Operator:
            <button
              onClick={() => setShowProfileModal(true)}
              className="text-gray-700 font-bold hover:text-blue-600 transition flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-300 hover:border-blue-500 shadow-sm"
            >
              <User size={14} />
              {user?.email}
            </button>
            <button onClick={handleLogout} className="ml-4 text-xs text-red-600 underline hover:text-red-800">Logout</button>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center items-center">
          <button onClick={() => setShowManualModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-md">
            <Plus size={16} /> Manual Entry
          </button>

          <button type="button" onClick={handleSocialScan} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-md">
            <Share2 size={16} /> Social Scan
          </button>

          {/* BOTÓN ADMIN PANEL */}
          <button onClick={() => setShowAdminModal(true)} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-md">
            <LayoutDashboard size={16} /> Admin Panel
          </button>

          <button onClick={() => setShowSourcesModal(true)} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition shadow-sm"><Settings size={16} /> Sources</button>
          <div className="h-8 w-px bg-gray-300 mx-2 hidden md:block"></div>
          <button onClick={() => downloadReport('pdf')} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><FileText size={16} /> PDF</button>
          <button onClick={() => downloadReport('csv')} className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><FileSpreadsheet size={16} /> Excel</button>
          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition shadow-md"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </header>

      {/*  MODAL ADMIN DASHBOARD */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 backdrop-blur-sm animate-in fade-in zoom-in">
          <div className="bg-white w-full max-w-5xl rounded-2xl border border-gray-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Admin */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-900 text-white">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <LayoutDashboard className="text-blue-400" /> SYSTEM ADMINISTRATION
                </h2>
                <p className="text-gray-400 text-sm mt-1">Real-time system monitoring & audit logs</p>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-white transition"><XCircle size={28} /></button>
            </div>

            <div className="p-8 overflow-y-auto bg-gray-50 flex-grow">
              
              {/* 1. SECTION: STATISTICS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card Total */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-bold uppercase">Total Findings</p>
                    <h3 className="text-4xl font-bold text-gray-900 mt-2">{adminStats?.total_findings || 0}</h3>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Database size={24} /></div>
                </div>

                {/* Card Status */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                   <div>
                    <p className="text-gray-500 text-sm font-bold uppercase">System Health</p>
                    <h3 className="text-xl font-bold text-green-600 mt-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span> 
                      {adminStats?.system_health || "ONLINE"}
                    </h3>
                  </div>
                  <div className="bg-green-100 p-4 rounded-full text-green-600"><Activity size={24} /></div>
                </div>

                {/* Card Risk Distro */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                   <p className="text-gray-500 text-xs font-bold uppercase mb-3">Threat Distribution</p>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span>Critical</span> <span className="font-bold">{adminStats?.risk_distribution?.critical || 0}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-red-600 h-1.5 rounded-full" style={{width: `${(adminStats?.risk_distribution?.critical / (adminStats?.total_findings||1))*100}%`}}></div></div>
                      
                      <div className="flex justify-between text-xs"><span>High</span> <span className="font-bold">{adminStats?.risk_distribution?.high || 0}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{width: `${(adminStats?.risk_distribution?.high / (adminStats?.total_findings||1))*100}%`}}></div></div>
                   </div>
                </div>
              </div>

              {/* 2. SECTION: AUDIT LOGS */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                   <h3 className="font-bold text-gray-800 flex items-center gap-2"><ScrollText size={18}/> Audit Logs (Last 50)</h3>
                   <button onClick={fetchAdminData} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"><RefreshCw size={12}/> REFRESH</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                      <tr>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLogs.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-6 text-gray-500">No logs found.</td></tr>
                      ) : (
                        adminLogs.map((log) => (
                          <tr key={log.id || Math.random()} className="border-b hover:bg-gray-50 transition">
                            <td className="px-6 py-3 font-mono text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-6 py-3 font-bold text-gray-700">{log.user}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                log.action.includes("DELETE") ? 'bg-red-50 text-red-700 border-red-200' :
                                log.action.includes("LOGIN") ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-600">{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL FUENTES */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Database size={20} className="text-blue-600"/> Source Management</h2>
              <button onClick={() => setShowSourcesModal(false)} className="text-gray-400 hover:text-gray-700"><XCircle /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddSource} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                
                <input type="text" placeholder="Source Name" 
                  className="md:col-span-1 bg-white border-2 border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 shadow-sm" 
                  value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} required />
                
                <input type="url" placeholder="Feed URL / API Endpoint" 
                  className="md:col-span-2 bg-white border-2 border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600 shadow-sm" 
                  value={newSource.url} onChange={e => setNewSource({ ...newSource, url: e.target.value })} required />
                
                <select className="bg-white border-2 border-gray-300 rounded px-2 py-2 text-sm text-gray-900 focus:border-blue-600 shadow-sm" 
                  value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value })}>
                    <option value="rss">RSS Feed</option>
                    <option value="reddit">Reddit API</option>
                </select>
                
                <button type="submit" className="md:col-span-4 bg-green-600 hover:bg-green-700 text-white rounded py-2 text-sm font-bold flex items-center justify-center gap-2 shadow-sm"><Plus size={16} /> Add Source</button>
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
              <h2 className="text-2xl font-bold text-white tracking-wide">SENTINEL AGENT</h2>
              <span className="bg-blue-700 text-blue-100 text-xs px-3 py-1 rounded-full border border-blue-500 mt-2 inline-block">Level 1: Analyst</span>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">ID</span>
                <span className="text-gray-900 font-mono text-sm">{user?.uid?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Email Verified</span>
                <span className={user?.emailVerified ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {user?.emailVerified ? "CONFIRMED" : "PENDING"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Last Access</span>
                <span className="text-gray-900 text-sm">{new Date().toLocaleDateString()}</span>
              </div>

              <button onClick={() => setShowProfileModal(false)} className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg font-bold transition shadow-md">
                Close File
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
                <FileText size={20} className="text-orange-600" /> Human Intelligence (HUMINT)
              </h2>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-700"><XCircle /></button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-gray-700 text-xs uppercase font-bold">Finding Title</label>
                <input type="text" className="w-full bg-white border-2 border-gray-300 rounded p-2 text-gray-900 focus:border-blue-600 focus:outline-none mt-1 shadow-sm"
                  value={manualFinding.title} onChange={e => setManualFinding({ ...manualFinding, title: e.target.value })} required placeholder="Ex: Vulnerability report in Sector 7..." />
              </div>

              <div>
                <label className="text-gray-700 text-xs uppercase font-bold">Detailed Description</label>
                <textarea className="w-full bg-white border-2 border-gray-300 rounded p-2 text-gray-900 focus:border-blue-600 focus:outline-none mt-1 h-24 shadow-sm"
                  value={manualFinding.content} onChange={e => setManualFinding({ ...manualFinding, content: e.target.value })} required placeholder="Enter intelligence details here..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-700 text-xs uppercase font-bold">Risk Level</label>
                  <select className="w-full bg-white border-2 border-gray-300 rounded p-2 text-gray-900 focus:border-blue-600 mt-1 shadow-sm"
                    value={manualFinding.risk_level} onChange={e => setManualFinding({ ...manualFinding, risk_level: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-700 text-xs uppercase font-bold">Reference URL (Optional)</label>
                  <input type="url" className="w-full bg-white border-2 border-gray-300 rounded p-2 text-gray-900 focus:border-blue-600 mt-1 shadow-sm"
                    value={manualFinding.url} onChange={e => setManualFinding({ ...manualFinding, url: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg mt-4 shadow-lg transition transform active:scale-95">
                REGISTER FINDING
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto">
        {loading && findings.length === 0 ? <div className="text-center py-20"><div className="animate-pulse text-blue-600 text-xl font-bold">Processing Intelligence...</div></div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {findings.map((item) => (
              <article key={item.id} className={`p-6 rounded-xl border transition duration-300 flex flex-col hover:shadow-xl relative ${
                item.status === 'discarded' 
                  ? 'bg-gray-100 border-gray-300 opacity-60' 
                  : 'bg-white border-gray-200 hover:border-blue-500 shadow-sm'
              }`}>
                
                <button 
                  onClick={() => handleDeleteFinding(item.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
                  title="Permanently Delete"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex justify-between items-start mb-4 pr-6">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border tracking-wider ${
                    item.risk_level === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                    item.risk_level === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    item.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {item.risk_level}
                  </span>
                  
                  {item.status === 'new' ? (
                    <span className="flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse shadow-sm border border-blue-400">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      NEW TARGET
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded uppercase">
                      {item.status}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight line-clamp-2 hover:text-blue-700 transition">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                  {stripHtml(item.content)}
                </p>

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
                    <XCircle size={14} /> Discard
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
                    <AlertOctagon size={14} /> Escalate
                  </button>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className={item.sentiment < 0 ? "text-red-600" : "text-green-600"} />
                    <span className="text-gray-700">Score: {item.sentiment?.toFixed(2)}</span>
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                    View Source <ExternalLink size={12} />
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