from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from datetime import datetime
from pydantic import BaseModel
from typing import List

from app.auth import get_current_user, User

router = APIRouter()

# MODELO DE DATOS 
class LogEntry(BaseModel):
    timestamp: datetime
    user: str
    action: str
    details: str

#  FUNCIÓN LOG
def log_action(username: str, action: str, details: str):
    """Guarda una acción en la base de datos de auditoría."""
    try:
        db = firestore.client()
        db.collection("system_logs").add({
            "timestamp": datetime.utcnow(),
            "user": username,
            "action": action,
            "details": details
        })
    except Exception as e:
        print(f"⚠️ Error guardando log: {e}")

#  ENDPOINT
@router.get("/admin/logs", response_model=List[LogEntry])
async def get_system_logs(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Requiere privilegios de Administrador")

    db = firestore.client()
    logs_ref = db.collection("system_logs").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(50)
    
    results = []
    for doc in logs_ref.stream():
        data = doc.to_dict()
        results.append(data)
        
    return results