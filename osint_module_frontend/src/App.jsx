import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldAlert, Activity, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';

function App() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para conectar con tu API Python
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Petición al backend FastAPI
      const response = await axios.get('http://127.0.0.1:8000/api/v1/findings');
      setFindings(response.data);
    } catch (err) {
      console.error("Error conectando al backend:", err);
      setError("No se pudo conectar al servidor de inteligencia. Asegúrate de que el backend Python esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al iniciar la página
  useEffect(() => {
    fetchData();
  }, []);

  // Función auxiliar para el color del riesgo
  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-osint-dark text-gray-200 p-6 md:p-10 font-sans">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="text-osint-accent w-10 h-10" />
            OSINT Intelligence Module
          </h1>
          <p className="text-gray-400 mt-2 ml-1">Monitor de Amenazas en Tiempo Real</p>
        </div>
        
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="text-right hidden md:block mr-4">
            <div className="text-2xl font-bold text-white">{findings.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Hallazgos Activos</div>
          </div>
          <button 
            onClick={fetchData}
            className="bg-osint-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-900/20"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> 
            {loading ? "Analizando..." : "Actualizar"}
          </button>
        </div>
      </header>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="max-w-7xl mx-auto mb-8 bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle />
          {error}
        </div>
      )}

      {/* GRID DE RESULTADOS */}
      <main className="max-w-7xl mx-auto">
        {loading && findings.length === 0 ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-osint-accent text-xl">Escaneando fuentes de datos...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {findings.map((item) => (
              <article 
                key={item.id} 
                className="bg-osint-card p-6 rounded-xl border border-gray-700/50 hover:border-osint-accent transition duration-300 hover:shadow-xl hover:shadow-blue-900/10 flex flex-col"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRiskColor(item.risk_level)}`}>
                    {item.risk_level} Risk
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {item.published_date ? new Date(item.published_date).toLocaleDateString() : 'Hoy'}
                  </span>
                </div>
                
                {/* Título y Contenido */}
                <h3 className="text-lg font-bold text-white mb-3 leading-snug line-clamp-2 hover:text-osint-accent transition">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2">
                    {item.title}
                  </a>
                </h3>
                
                <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-grow">
                  {item.content || "Sin descripción disponible..."}
                </p>
                
                {/* Footer de la tarjeta */}
                <div className="mt-auto pt-4 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center gap-2" title="Análisis de Sentimiento (IA)">
                    <Activity size={14} className={item.sentiment < 0 ? "text-red-400" : "text-green-400"} />
                    <span>IA Score: {item.sentiment ? item.sentiment.toFixed(2) : '0.00'}</span>
                  </div>
                  
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-osint-accent hover:text-white transition"
                  >
                    Ver Fuente <ExternalLink size={12} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
