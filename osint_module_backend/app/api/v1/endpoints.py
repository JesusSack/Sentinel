from fastapi import APIRouter, HTTPException
from typing import List
from app.core.database import get_db
from app.models.source import Source, SourceCreate
from app.models.finding import Finding
import uuid

router = APIRouter()

#    RUTAS DE FUENTES 
@router.post("/sources", response_model=Source)
def create_source(source: SourceCreate):
    db = get_db()
    #  ID único
    new_id = str(uuid.uuid4())
    
    # Objeto final
    new_source = Source(id=new_id, **source.model_dump())
    
    # Guardamos en Firestore
    db.collection('sources').document(new_id).set(new_source.model_dump())
    
    return new_source

@router.get("/sources", response_model=List[Source])
def get_sources():
    db = get_db()
    docs = db.collection('sources').stream()
    return [Source(**doc.to_dict()) for doc in docs]

#    (FINDINGS)
@router.get("/findings") 
def get_findings(limit: int = 20):
    db = get_db()
    # Traemos los últimos hallazgos 
    docs = db.collection('findings').limit(limit).stream()
    
    results = []
    for doc in docs:
        data = doc.to_dict()
        # ID del documento al objeto
        data['id'] = doc.id 
        results.append(data)
    
    return results