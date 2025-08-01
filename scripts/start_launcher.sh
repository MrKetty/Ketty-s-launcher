#!/bin/bash

# Ketty's PVP Minecraft Launcher - Startup Script

echo "🚀 Avvio Ketty's PVP Minecraft Launcher..."

# Controlla se Python è installato
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 non trovato. Installalo per continuare."
    exit 1
fi

# Controlla se Node.js è installato
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato. Installalo per continuare."
    exit 1
fi

# Controlla se Yarn è installato
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn non trovato. Installalo per continuare."
    exit 1
fi

# Vai alla directory del progetto
cd "$(dirname "$0")/.."

echo "📦 Installazione dipendenze backend..."
cd backend
pip install -r requirements.txt

echo "📦 Installazione dipendenze frontend..."
cd ../frontend
yarn install

echo "🔧 Avvio servizi..."
cd ..

# Avvia il backend
echo "🖥️ Avvio backend su porta 8001..."
cd backend
python server.py &
BACKEND_PID=$!

# Aspetta che il backend si avvii
sleep 3

# Avvia il frontend
echo "🌐 Avvio frontend su porta 3000..."
cd ../frontend
yarn start &
FRONTEND_PID=$!

echo "✅ Launcher avviato con successo!"
echo "🌐 Frontend: http://localhost:3000"
echo "🖥️ Backend API: http://localhost:8001"
echo ""
echo "Per fermare il launcher, premi Ctrl+C"

# Funzione per gestire la chiusura
cleanup() {
    echo ""
    echo "🛑 Chiusura launcher..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Launcher chiuso."
    exit 0
}

# Gestisci segnali di interruzione
trap cleanup SIGINT SIGTERM

# Aspetta che i processi finiscano
wait