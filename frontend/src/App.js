import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Monitor, 
  Download, 
  Play, 
  Settings, 
  Search, 
  AlertTriangle,
  Package,
  User,
  Folder,
  RefreshCw
} from 'lucide-react';
import './App.css';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('clients');
  const [availableClients, setAvailableClients] = useState([]);
  const [installedClients, setInstalledClients] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [modrinthResults, setModrinthResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [installStatus, setInstallStatus] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        scanClients(),
        loadInstalledClients(),
        loadProfiles()
      ]);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
    }
  };

  const scanClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/clients/scan`);
      setAvailableClients(response.data.clients);
    } catch (error) {
      console.error('Errore nella scansione dei client:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledClients = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/clients/installed`);
      setInstalledClients(response.data.clients);
    } catch (error) {
      console.error('Errore nel caricamento dei client installati:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/profiles`);
      setProfiles(response.data.profiles);
    } catch (error) {
      console.error('Errore nel caricamento dei profili:', error);
    }
  };

  const installClient = async (client) => {
    try {
      setInstallStatus(prev => ({ ...prev, [client.name]: 'installing' }));
      
      const response = await axios.post(`${API_BASE}/api/clients/install`, {
        name: client.name,
        path: client.path,
        type: client.type,
        version: client.version || 'unknown'
      });
      
      setInstallStatus(prev => ({ ...prev, [client.name]: 'success' }));
      await loadInstalledClients();
      
      setTimeout(() => {
        setInstallStatus(prev => ({ ...prev, [client.name]: null }));
      }, 3000);
      
    } catch (error) {
      console.error('Errore nell\'installazione:', error);
      setInstallStatus(prev => ({ ...prev, [client.name]: 'error' }));
    }
  };

  const launchClient = async (client) => {
    try {
      const response = await axios.post(`${API_BASE}/api/clients/launch`, {
        name: client.name,
        java_args: ['-Xmx4G', '-Xms1G']
      });
      
      alert(`Client ${client.name} lanciato con successo! PID: ${response.data.pid}`);
    } catch (error) {
      console.error('Errore nel lancio:', error);
      alert('Errore nel lancio del client');
    }
  };

  const searchModrinth = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/modrinth/search`, {
        params: { query: searchQuery }
      });
      setModrinthResults(response.data.hits || []);
    } catch (error) {
      console.error('Errore nella ricerca Modrinth:', error);
    } finally {
      setLoading(false);
    }
  };

  const ClientCard = ({ client, isInstalled = false }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Package className="text-blue-400 w-8 h-8" />
          <div>
            <h3 className="text-xl font-semibold text-white">{client.name}</h3>
            <p className="text-gray-400 text-sm">{client.filename}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {client.type === 'mod' && (
            <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs">
              MOD
            </span>
          )}
          {client.type === 'installer' && (
            <span className="bg-green-600 text-green-100 px-2 py-1 rounded text-xs">
              INSTALLER
            </span>
          )}
        </div>
      </div>
      
      {client.warning && (
        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3 mb-4 flex items-start space-x-2">
          <AlertTriangle className="text-yellow-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-yellow-100 text-sm font-medium">Attenzione!</p>
            <p className="text-yellow-200 text-sm">{client.warning}</p>
            {client.min_version && (
              <p className="text-yellow-300 text-xs mt-1">
                Versione minima richiesta: {client.min_version}
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          <p>Dimensione: {(client.size / 1024 / 1024).toFixed(1)} MB</p>
          {client.installed_at && (
            <p>Installato: {new Date(client.installed_at).toLocaleDateString()}</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          {!isInstalled ? (
            <button
              onClick={() => installClient(client)}
              disabled={installStatus[client.name] === 'installing'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {installStatus[client.name] === 'installing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Installa</span>
            </button>
          ) : (
            <button
              onClick={() => launchClient(client)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Avvia</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const ModCard = ({ mod }) => (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
      <div className="flex items-start space-x-3">
        <img 
          src={mod.icon_url || '/placeholder-mod.png'} 
          alt={mod.title}
          className="w-16 h-16 rounded-lg object-cover"
          onError={(e) => { e.target.src = '/placeholder-mod.png'; }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{mod.title}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">{mod.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>Download: {mod.downloads?.toLocaleString()}</span>
            <span>Aggiornato: {new Date(mod.date_modified).toLocaleDateString()}</span>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
          Dettagli
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="text-blue-400 w-8 h-8" />
            <h1 className="text-2xl font-bold">Ketty's PVP Launcher</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white">
              <Settings className="w-6 h-6" />
            </button>
            <button className="text-gray-400 hover:text-white">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'clients', label: 'Client', icon: Package },
              { id: 'installed', label: 'Installati', icon: Folder },
              { id: 'modrinth', label: 'Modrinth', icon: Search },
              { id: 'profiles', label: 'Profili', icon: User }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'clients' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Client Disponibili</h2>
              <button
                onClick={scanClients}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Scansiona</span>
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-gray-400">Scansione in corso...</p>
              </div>
            ) : availableClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableClients.map((client, index) => (
                  <ClientCard key={index} client={client} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl text-gray-400 mb-2">Nessun client trovato</p>
                <p className="text-gray-500">Aggiungi i file .jar alla directory e riprova la scansione</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'installed' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Client Installati</h2>
            {installedClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {installedClients.map((client, index) => (
                  <ClientCard key={index} client={client} isInstalled={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl text-gray-400 mb-2">Nessun client installato</p>
                <p className="text-gray-500">Installa i client dalla sezione "Client"</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'modrinth' && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-4">Ricerca Modrinth</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchModrinth()}
                  placeholder="Cerca mod, modpack, shader..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={searchModrinth}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Cerca</span>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-gray-400">Ricerca in corso...</p>
              </div>
            ) : modrinthResults.length > 0 ? (
              <div className="space-y-4">
                {modrinthResults.map((mod, index) => (
                  <ModCard key={index} mod={mod} />
                ))}
              </div>
            ) : searchQuery && !loading ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl text-gray-400 mb-2">Nessun risultato trovato</p>
                <p className="text-gray-500">Prova con termini di ricerca diversi</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl text-gray-400 mb-2">Inizia a cercare</p>
                <p className="text-gray-500">Cerca mod, modpack e shader su Modrinth</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Profili</h2>
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-xl text-gray-400 mb-2">Gestione Profili</p>
              <p className="text-gray-500">Funzionalità in arrivo</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;