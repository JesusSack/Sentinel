from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from firebase_admin import firestore
from pydantic import BaseModel
from datetime import datetime
from passlib.context import CryptContext
from app.auth import get_current_user, User
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
    from app.api.v1.admin import log_action
    log_action("system", "NEW_USER", f"Usuario registrado: {user.username}")
    
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
    
    # Log de la acción
    from app.api.v1.admin import log_action
    log_action(current_user.username, "ADD_SOURCE", f"Agregada fuente: {source.name}")
    
    return {"message": "Fuente agregada", "id": doc_ref[1].id}

@router.delete("/sources/{source_id}")
async def delete_source(source_id: str, current_user: User = Depends(get_current_user)):
    db = firestore.client()
    
    # Log antes de borrar
    from app.api.v1.admin import log_action
    log_action(current_user.username, "DELETE_SOURCE", f"Eliminada fuente ID: {source_id}")
    
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
    
    # Log de la acción
    from app.api.v1.admin import log_action
    log_action(current_user.username, "UPDATE_STATUS", f"Hallazgo {finding_id} actualizado a {update_data.status}")

    return {"message": "Finding updated successfully"}


@router.post("/findings/manual")
async def create_manual_finding(finding: ManualFinding, current_user: User = Depends(get_current_user)):
    db = firestore.client()
    
    # Preparamos el objeto para guardar
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
    
    # Guardar en Firestore
    doc_ref = db.collection("findings").add(new_doc)
    
    # Intentamos registrar el log
    try:
        from app.api.v1.admin import log_action
        log_action(current_user.username, "MANUAL_ENTRY", f"Creado hallazgo manual: {finding.title}")
    except ImportError:
        pass 
    
    return {"message": "Hallazgo registrado correctamente", "id": doc_ref[1].id}


# 👇 ENDPOINT PARA GATILLAR ESCANEO 
@router.post("/simulate/social")
async def simulate_social_scan(current_user: User = Depends(get_current_user)):
    db = firestore.client()
    created_count = 0

    # 1 Esto simula lo que devolvería el Scraper
    mock_results = [
        {
            "title": "ALERTA CRÍTICA: Filtración de credenciales en DarkWeb",
            "content": "Se han detectado 500 usuarios corporativos en una base de datos filtrada en foros rusos. Se recomienda rotación inmediata de contraseñas.",
            "risk_level": "critical",
            "url": "https://twitter.com/DarkWebAlerts/status/123456",
            "source_id": "twitter_bot",
            "sentiment": -0.9
        },
        {
            "title": "Mención de la empresa en grupo de Telegram 'Hacktivistas'",
            "content": "Un usuario está preguntando por vulnerabilidades en el portal de proveedores. Posible reconocimiento previo a ataque.",
            "risk_level": "high",
            "url": "https://t.me/hacktivistas_channel",
            "source_id": "telegram_monitor",
            "sentiment": -0.6
        },
        {
            "title": "Rumores de phishing masivo",
            "content": "Campaña de correos suplantando identidad bancaria detectada en la región.",
            "risk_level": "medium",
            "url": "https://twitter.com/SecNews",
            "source_id": "twitter_bot",
            "sentiment": -0.3
        }
    ]

    # 2. Guardamos los resultados falsos en Firestore
    for item in mock_results:
        item["status"] = "new"
        item["created_by"] = "system_simulated_scan"
        item["published_date"] = datetime.utcnow().isoformat()

        # Guardamos en la base de datos
        db.collection("findings").add(item)
        created_count += 1

    return {"message": f"Escaneo social finalizado. {created_count} alertas simuladas generadas."}