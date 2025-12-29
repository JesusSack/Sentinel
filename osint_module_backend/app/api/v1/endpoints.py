from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from firebase_admin import firestore
from pydantic import BaseModel
from datetime import datetime
from passlib.context import CryptContext
from app.auth import get_current_user, User

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