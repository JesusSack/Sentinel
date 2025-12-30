from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from firebase_admin import firestore
from pydantic import BaseModel
from datetime import datetime
from passlib.context import CryptContext
from app.auth import get_current_user, User
import random 

from app.scrapers.social_media import SocialMediaIngestor

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#  MODELOS 
class SourceModel(BaseModel):
    name: str
    url: str
    category: str
    type: str 

class UserCreate(BaseModel):
    username: str
    password: str

class FindingUpdate(BaseModel):
    status: Optional[str] = None
    comments: Optional[str] = None

class ManualFinding(BaseModel):
    title: str
    content: str
    risk_level: str
    url: Optional[str] = None    

#  USUARIOS 
@router.post("/register")
async def register_user(user: UserCreate):
    db = firestore.client()
    existing = db.collection("users").where("username", "==", user.username).stream()
    if any(existing):
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    hashed_password = pwd_context.hash(user.password)
    db.collection("users").add({
        "username": user.username,
        "hashed_password": hashed_password,
        "role": "analyst",
        "created_at": datetime.utcnow()
    })
    
    # Log de la acción 
    try:
        from app.api.v1.admin import log_action
        log_action("system", "NEW_USER", f"Usuario registrado: {user.username}")
    except ImportError:
        pass
    
    return {"message": "Usuario creado exitosamente"}

#  FUENTES 
@router.get("/sources", response_model=List[dict])
async def get_sources(current_user: User = Depends(get_current_user)):
    db = firestore.client()
    docs = db.collection("sources").stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]

@router.post("/sources")
async def add_source(source: SourceModel, current_user: User = Depends(get_current_user)):
    db = firestore.client()
    existing = db.collection("sources").where("url", "==", source.url).stream()
    if any(existing):
        raise HTTPException(status_code=400, detail="Esa URL ya está registrada")
        
    doc_ref = db.collection("sources").add(source.dict())
    
    return {"message": "Fuente agregada", "id": doc_ref[1].id}

@router.delete("/sources/{source_id}")
async def delete_source(source_id: str, current_user: User = Depends(get_current_user)):
    db = firestore.client()
    db.collection("sources").document(source_id).delete()
    return {"message": "Fuente eliminada"}

#   HALLAZGOS 
@router.get("/findings")
async def get_findings(current_user: User = Depends(get_current_user)):
    db = firestore.client()
    docs = db.collection("findings").stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(data)
    return results

@router.patch("/findings/{finding_id}")
async def update_finding_status(finding_id: str, update_data: FindingUpdate, current_user: User = Depends(get_current_user)):
    db = firestore.client()
    doc_ref = db.collection("findings").document(finding_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    doc_ref.update(update_dict)

    return {"message": "Finding updated successfully"}


@router.post("/findings/manual")
async def create_manual_finding(finding: ManualFinding, current_user: User = Depends(get_current_user)):
    db = firestore.client()
    
    new_doc = {
        "title": finding.title,
        "content": finding.content,
        "risk_level": finding.risk_level,
        "url": finding.url or "N/A",
        "source_id": "human_intelligence", 
        "published_date": datetime.utcnow().isoformat(),
        "status": "new",
        "sentiment": 0.0, 
        "created_by": current_user.username
    }
    
    doc_ref = db.collection("findings").add(new_doc)
    
    return {"message": "Hallazgo registrado correctamente", "id": doc_ref[1].id}


# ENDPOINT
@router.post("/simulate/social")
async def simulate_social_scan(current_user: User = Depends(get_current_user)):
    db = firestore.client()
    created_count = 0

    threat_pool = [
        {
            "title": "ALERTA: Credenciales corporativas en Pastebin",
            "content": "Bot detectó un dump de emails @empresa.com con contraseñas en texto plano. Fuente: Pastebin #OpLeak.",
            "risk_level": "critical",
            "url": "https://pastebin.com/raw/fake123",
            "source_id": "pastebin_monitor",
            "sentiment": -0.95
        },
        {
            "title": "Mención sospechosa en Foro Ruso (XSS)",
            "content": "Usuario 'DarkHacker' pregunta por vulnerabilidades XSS en el login de proveedores. Posible reconocimiento.",
            "risk_level": "high",
            "url": "https://xss-forum.ru/threads/123",
            "source_id": "darkweb_scrapper",
            "sentiment": -0.8
        },
        {
            "title": "Queja viral en Twitter sobre servicio caído",
            "content": "Usuarios reportan imposibilidad de acceso masivo. El tweet tiene 400 RTs en 10 minutos. Posible impacto reputacional.",
            "risk_level": "medium",
            "url": "https://twitter.com/user/status/99999",
            "source_id": "twitter_api",
            "sentiment": -0.6
        },
        {
            "title": "GitHub: Código fuente expuesto accidentalmente",
            "content": "Se detectó una API Key de AWS hardcodeada en un repositorio público de un ex-empleado.",
            "risk_level": "critical",
            "url": "https://github.com/search?q=company",
            "source_id": "github_recon",
            "sentiment": -0.9
        },
        {
            "title": "Reddit: Discusión sobre despidos",
            "content": "Hilo en r/sysadmin discutiendo rumores de reestructuración interna. Información sensible filtrada.",
            "risk_level": "low",
            "url": "https://reddit.com/r/sysadmin",
            "source_id": "reddit_api",
            "sentiment": -0.4
        },
        {
            "title": "Telegram: Venta de accesos VPN",
            "content": "Canal 'Access Broker' ofrece credenciales VPN Fortinet supuestamente pertenecientes a la organización.",
            "risk_level": "critical",
            "url": "https://t.me/access_broker_v2",
            "source_id": "telegram_monitor",
            "sentiment": -1.0
        }
    ]
    selected_threats = random.sample(threat_pool, k=random.randint(1, 3))

    # 3. Guardamos los resultados en Firestore
    for item in selected_threats:
        # identificador aleatorio al título para que no parezcan duplicados si salen dos veces
        random_id = random.randint(1000, 9999)
        
        doc_data = item.copy()
        doc_data["title"] = f"{item['title']} (#{random_id})"
        doc_data["status"] = "new"
        doc_data["created_by"] = "simulated_ai_engine"
        doc_data["published_date"] = datetime.utcnow().isoformat()

        db.collection("findings").add(doc_data)
        created_count += 1

    return {"message": f"Escaneo finalizado. {created_count} nuevas amenazas detectadas."}