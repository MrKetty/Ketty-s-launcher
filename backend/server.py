from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pymongo import MongoClient
import os
import json
import requests
import subprocess
import platform
import psutil
from pathlib import Path
import aiofiles
from typing import List, Dict, Optional
import zipfile
import shutil
from datetime import datetime

app = FastAPI(title="Minecraft Launcher API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/minecraft_launcher")
client = MongoClient(MONGO_URL)
db = client.minecraft_launcher

# Modrinth API
MODRINTH_API_URL = os.getenv("MODRINTH_API_URL", "https://api.modrinth.com/v2")

# Minecraft directories
MINECRAFT_DIR = Path.home() / ".minecraft"
LAUNCHER_DIR = Path.home() / ".minecraft_launcher"
CLIENTS_DIR = LAUNCHER_DIR / "clients"
PROFILES_DIR = LAUNCHER_DIR / "profiles"

# Create directories
LAUNCHER_DIR.mkdir(exist_ok=True)
CLIENTS_DIR.mkdir(exist_ok=True)
PROFILES_DIR.mkdir(exist_ok=True)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Minecraft Launcher API is running"}

@app.get("/api/clients/scan")
async def scan_clients():
    """Scansiona la directory per trovare installer .jar disponibili"""
    try:
        jar_files = []
        app_dir = Path("/app")
        
        # Scansiona per file .jar
        for jar_file in app_dir.rglob("*.jar"):
            if jar_file.is_file():
                file_info = {
                    "name": jar_file.stem,
                    "filename": jar_file.name,
                    "path": str(jar_file),
                    "size": jar_file.stat().st_size,
                    "type": "installer",
                    "modified": datetime.fromtimestamp(jar_file.stat().st_mtime).isoformat()
                }
                
                # Controllo speciale per Feather
                if "feather" in jar_file.name.lower():
                    file_info["type"] = "mod"
                    file_info["warning"] = "Feather è una mod per Minecraft 1.20.1+. Assicurati di avere la versione corretta."
                    file_info["min_version"] = "1.20.1"
                
                jar_files.append(file_info)
        
        return {"clients": jar_files, "count": len(jar_files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore durante la scansione: {str(e)}")

@app.post("/api/clients/install")
async def install_client(client_data: dict):
    """Installa un client specifico"""
    try:
        client_name = client_data.get("name")
        client_path = client_data.get("path")
        
        if not client_name or not client_path:
            raise HTTPException(status_code=400, detail="Nome e percorso del client sono richiesti")
        
        # Verifica che il file esista
        jar_path = Path(client_path)
        if not jar_path.exists():
            raise HTTPException(status_code=404, detail="File .jar non trovato")
        
        # Directory di installazione per questo client
        install_dir = CLIENTS_DIR / client_name
        install_dir.mkdir(exist_ok=True)
        
        # Copia il file nella directory di installazione
        dest_path = install_dir / jar_path.name
        shutil.copy2(jar_path, dest_path)
        
        # Salva le informazioni del client nel database
        client_info = {
            "name": client_name,
            "installed_path": str(dest_path),
            "original_path": client_path,
            "installed_at": datetime.now().isoformat(),
            "type": client_data.get("type", "installer"),
            "version": client_data.get("version", "unknown")
        }
        
        # Aggiorna o inserisci nel database
        db.installed_clients.update_one(
            {"name": client_name},
            {"$set": client_info},
            upsert=True
        )
        
        return {"message": f"Client {client_name} installato con successo", "path": str(dest_path)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore durante l'installazione: {str(e)}")

@app.get("/api/clients/installed")
async def get_installed_clients():
    """Ottieni lista dei client installati"""
    try:
        clients = list(db.installed_clients.find({}, {"_id": 0}))
        return {"clients": clients, "count": len(clients)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero dei client: {str(e)}")

@app.post("/api/clients/launch")
async def launch_client(launch_data: dict):
    """Lancia un client installato"""
    try:
        client_name = launch_data.get("name")
        java_args = launch_data.get("java_args", [])
        
        if not client_name:
            raise HTTPException(status_code=400, detail="Nome del client richiesto")
        
        # Trova il client nel database
        client = db.installed_clients.find_one({"name": client_name})
        if not client:
            raise HTTPException(status_code=404, detail="Client non trovato")
        
        client_path = Path(client["installed_path"])
        if not client_path.exists():
            raise HTTPException(status_code=404, detail="File del client non trovato")
        
        # Comando per lanciare il client
        java_cmd = ["java"] + java_args + ["-jar", str(client_path)]
        
        # Lancia il processo in background
        process = subprocess.Popen(
            java_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(client_path.parent)
        )
        
        # Salva informazioni di lancio
        launch_info = {
            "client_name": client_name,
            "pid": process.pid,
            "launched_at": datetime.now().isoformat(),
            "command": " ".join(java_cmd)
        }
        
        db.launch_history.insert_one(launch_info)
        
        return {"message": f"Client {client_name} lanciato", "pid": process.pid}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore durante il lancio: {str(e)}")

@app.get("/api/modrinth/search")
async def search_modrinth(query: str, categories: str = "", version: str = ""):
    """Cerca mod su Modrinth"""
    try:
        params = {
            "query": query,
            "limit": 20,
            "facets": []
        }
        
        if categories:
            params["facets"].append(f'["categories:{categories}"]')
        
        if version:
            params["facets"].append(f'["versions:{version}"]')
        
        # Converti facets in stringa JSON se presente
        if params["facets"]:
            params["facets"] = json.dumps(params["facets"])
        else:
            del params["facets"]
        
        response = requests.get(f"{MODRINTH_API_URL}/search", params=params)
        response.raise_for_status()
        
        return response.json()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nella ricerca Modrinth: {str(e)}")

@app.get("/api/modrinth/project/{project_id}")
async def get_modrinth_project(project_id: str):
    """Ottieni dettagli di un progetto Modrinth"""
    try:
        response = requests.get(f"{MODRINTH_API_URL}/project/{project_id}")
        response.raise_for_status()
        
        return response.json()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero del progetto: {str(e)}")

@app.get("/api/profiles")
async def get_profiles():
    """Ottieni tutti i profili salvati"""
    try:
        profiles = list(db.profiles.find({}, {"_id": 0}))
        return {"profiles": profiles, "count": len(profiles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero dei profili: {str(e)}")

@app.post("/api/profiles")
async def create_profile(profile_data: dict):
    """Crea un nuovo profilo"""
    try:
        profile_name = profile_data.get("name")
        if not profile_name:
            raise HTTPException(status_code=400, detail="Nome del profilo richiesto")
        
        # Verifica che il profilo non esista già
        existing = db.profiles.find_one({"name": profile_name})
        if existing:
            raise HTTPException(status_code=400, detail="Profilo già esistente")
        
        profile = {
            "name": profile_name,
            "client": profile_data.get("client", ""),
            "minecraft_version": profile_data.get("minecraft_version", ""),
            "mods": profile_data.get("mods", []),
            "java_args": profile_data.get("java_args", []),
            "created_at": datetime.now().isoformat(),
            "last_used": None
        }
        
        db.profiles.insert_one(profile)
        
        return {"message": f"Profilo {profile_name} creato con successo"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nella creazione del profilo: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)