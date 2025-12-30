from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
import os

# endpoints
from app.api.v1.endpoints import router as api_router
from app.api.v1.reports import router as reports_router
from app.api.v1.admin import router as admin_router

app = FastAPI(title="OSINT Module API", version="1.0.0")

# CORS  
origins = ["*"] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# INICIALIZAR FIREBASE 
if not firebase_admin._apps:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    cert_path = os.path.join(current_dir, "serviceAccountKey.json")
    
    if os.path.exists(cert_path):
        print(f"✅ Cargando certificado Firebase desde: {cert_path}")
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred)
    else:
        fallback_path = "/backend/serviceAccountKey.json"
        if os.path.exists(fallback_path):
            print(f"✅ Cargando certificado Firebase desde fallback: {fallback_path}")
            cred = credentials.Certificate(fallback_path)
            firebase_admin.initialize_app(cred)
        else:
            print(f"❌ ERROR: No se encontró serviceAccountKey.json en {cert_path} ni en {fallback_path}")
            print(f"Archivos en el directorio actual: {os.listdir(current_dir)}")

app.include_router(api_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Sentinel OSINT Backend Running (Firebase Mode) 🚀"}