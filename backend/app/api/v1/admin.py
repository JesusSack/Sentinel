from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

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
        print(f"📝 LOG INTERNO: {action} - {details}")
    except Exception as e:
        print(f"⚠️ Error guardando log: {e}")

#  ENDPOINT LOGS
@router.get("/admin/logs", response_model=List[LogEntry])
async def get_system_logs(current_user: User = Depends(get_current_user)):
    
    # Permitimos entrar a 'admin' Y a 'analyst' para que puedas probar
    if current_user.role not in ["admin", "analyst"]:
        raise HTTPException(status_code=403, detail="Requiere privilegios de Staff")

    db = firestore.client()
    logs_ref = db.collection("system_logs").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(50)
    
    results = []
    for doc in logs_ref.stream():
        data = doc.to_dict()
        results.append(data)
        
    return results

# ESTADÍSTICAS 
@router.get("/admin/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Devuelve contadores rápidos para mostrar en el Dashboard"""
    db = firestore.client()
    
    # Obtenemos todos los hallazgos para contar riesgos
    findings_ref = db.collection("findings").stream()
    
    total_findings = 0
    risk_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    
    for f in findings_ref:
        total_findings += 1
        data = f.to_dict()
        risk = data.get("risk_level", "low")
        if risk in risk_counts:
            risk_counts[risk] += 1
            
    return {
        "total_findings": total_findings,
        "risk_distribution": risk_counts,
        "system_health": "ONLINE"
    }