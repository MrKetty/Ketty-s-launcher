# 🎮 Ketty's PVP Minecraft Launcher

Un launcher Minecraft moderno e completo con integrazione Modrinth, supporto offline e interfaccia user-friendly.

## 🚀 Caratteristiche Principali

### ✨ Funzionalità Client
- **Scansione Automatica**: Rileva automaticamente i file `.jar` installer nella directory
- **Installazione Semplificata**: Installa client con un click
- **Supporto Multi-Client**: Gestisce Vanilla, Forge, Fabric e client custom
- **Avvisi Intelligenti**: Notifiche speciali per mod come Feather (1.20.1+)

### 🔍 Integrazione Modrinth
- **Ricerca Avanzata**: Cerca mod, modpack e shader
- **Download Diretto**: Scarica contenuti direttamente dall'interfaccia
- **Cache Offline**: Supporto offline per contenuti già scaricati
- **Metadati Completi**: Visualizza info dettagliate sui contenuti

### 👤 Sistema Profili
- **Profili Multipli**: Crea e gestisci diversi setup
- **Configurazioni Personalizzate**: Java args, mod list, versioni
- **Sync Automatico**: Sincronizzazione tra dispositivi

## 🛠️ Installazione

### Prerequisiti
- Python 3.8+
- Node.js 16+
- Yarn
- MongoDB (locale o cloud)

### Setup Rapido
```bash
# Clona il repository
git clone <repo-url>
cd minecraft-launcher

# Rendi eseguibile lo script di avvio
chmod +x scripts/start_launcher.sh

# Avvia il launcher
./scripts/start_launcher.sh
```

### Setup Manuale
```bash
# Backend
cd backend
pip install -r requirements.txt
python server.py

# Frontend (in un nuovo terminale)
cd frontend
yarn install
yarn start
```

## 📁 Struttura Directory

```
minecraft-launcher/
├── backend/              # API FastAPI
│   ├── server.py        # Server principale
│   ├── requirements.txt # Dipendenze Python
│   └── .env            # Configurazione ambiente
├── frontend/            # React UI
│   ├── src/            # Codice sorgente
│   ├── public/         # File statici
│   └── package.json    # Dipendenze Node.js
├── scripts/            # Script utilità
└── clients/            # Client installati (auto-creata)
```

## 🎯 Utilizzo

### 1. Aggiungere Client
1. Copia i file `.jar` degli installer nella directory del progetto
2. Vai alla sezione "Client" nell'interfaccia
3. Clicca "Scansiona" per rilevare i nuovi client
4. Clicca "Installa" sui client desiderati

### 2. Gestire Installazioni
- **Client Installati**: Visualizza nella sezione "Installati"
- **Avviare Client**: Clicca "Avvia" sui client installati
- **Configurazione Java**: Personalizza argomenti JVM per client

### 3. Cercare Mod (Modrinth)
1. Vai alla sezione "Modrinth"
2. Inserisci termini di ricerca
3. Esplora risultati con dettagli completi
4. Scarica mod e modpack direttamente

### 4. Creare Profili
1. Sezione "Profili"
2. Crea nuovo profilo con:
   - Nome personalizzato
   - Client associato
   - Lista mod
   - Configurazioni Java

## ⚠️ Avvisi Speciali

### Feather Client
Quando viene rilevato Feather, il launcher mostra:
- **⚠️ Attenzione**: Feather è una mod, non un installer
- **Versione Minima**: Richiede Minecraft 1.20.1+
- **Installazione Speciale**: Deve essere installato come mod

### Altri Client
- **Forge**: Installer automatico per tutte le versioni
- **Fabric**: Supporto installer moderno
- **Vanilla**: Download diretto da Mojang (funzionalità futura)

## 🔧 Configurazione Avanzata

### Variabili Ambiente (.env)
```env
# Backend
MONGO_URL=mongodb://localhost:27017/minecraft_launcher
MODRINTH_API_URL=https://api.modrinth.com/v2

# Frontend
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Personalizzazione Java
Argomenti comuni per migliorare performance:
```
-Xmx4G -Xms2G              # Memoria heap
-XX:+UseG1GC               # Garbage collector G1
-XX:+UnlockExperimentalVMOptions
-XX:+UseJVMCICompiler      # Compilatore ottimizzato
```

### Directory Minecraft
Il launcher utilizza:
- `~/.minecraft/` - Directory Minecraft standard
- `~/.minecraft_launcher/` - Dati launcher
- `~/.minecraft_launcher/clients/` - Client installati
- `~/.minecraft_launcher/profiles/` - Configurazioni profili

## 🐛 Risoluzione Problemi

### Client Non Rilevati
1. Verifica che i file `.jar` siano nella directory root
2. Clicca "Scansiona" per aggiornare la lista
3. Controlla i permessi dei file

### Errori di Avvio
1. Verifica Java installato: `java -version`
2. Controlla argomenti Java nel profilo
3. Verifica memoria disponibile

### Problemi Modrinth
1. Controlla connessione internet
2. Verifica che l'API Modrinth sia raggiungibile
3. Riprova la ricerca

### Database Errori
1. Verifica MongoDB in esecuzione
2. Controlla URL database in `.env`
3. Verifica permessi di scrittura

## 📡 API Endpoints

### Client Management
- `GET /api/clients/scan` - Scansiona client disponibili
- `POST /api/clients/install` - Installa client
- `GET /api/clients/installed` - Lista client installati
- `POST /api/clients/launch` - Avvia client

### Modrinth Integration
- `GET /api/modrinth/search` - Cerca contenuti
- `GET /api/modrinth/project/{id}` - Dettagli progetto

### Profiles
- `GET /api/profiles` - Lista profili
- `POST /api/profiles` - Crea profilo

## 🎨 Personalizzazione UI

L'interfaccia utilizza:
- **Tailwind CSS** per styling responsive
- **Lucide React** per icone moderne
- **Tema Scuro** ottimizzato per gaming
- **Animazioni Fluide** per UX premium

### Colori Tematici
- Primario: Blu elettrico (#3b82f6)
- Secondario: Viola (#8b5cf6)  
- Accento: Ciano (#06b6d4)
- Sfondo: Slate scuro (#0f172a)

## 🔄 Aggiornamenti

Il launcher si aggiorna automaticamente tramite:
- Scansione periodica nuovi client
- Cache intelligente per Modrinth
- Database locale per offline mode

## 📞 Supporto

Per problemi o suggerimenti:
1. Controlla questa guida
2. Verifica logs in console browser
3. Controlla logs backend nel terminale

## 🎉 Forza Napoli!

Creato con ❤️ per la community PVP italiana.