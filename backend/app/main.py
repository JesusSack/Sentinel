from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
import os

from app.api.v1.endpoints import router as api_router
from app.api.v1.reports import router as reports_router
from app.api.v1.admin import router as admin_router

app = FastAPI(title="OSINT Module API", version="1.0.0")

origins = ["*"] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not firebase_admin._apps:
    path1 = os.path.join(os.getcwd(), "serviceAccountKey.json")
    path2 = os.path.join(os.path.dirname(os.getcwd()), "serviceAccountKey.json")
    path3 = "/serviceAccountKey.json"
    path4 = "/backend/serviceAccountKey.json"

    cert_path = None
    for p in [path1, path2, path3, path4]:
        if os.path.exists(p):
            cert_path = p
            break

    if cert_path:
        print(f"✅ CERTIFICADO ENCONTRADO EN: {cert_path}")
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred)
    else:
        print(f"❌ ERROR: serviceAccountKey.json no encontrado.")
        print(f"Directorio actual: {os.getcwd()}")
        print(f"Contenido: {os.listdir(os.getcwd())}")

app.include_router(api_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "SISTEMA ACTUALIZADO - DELETE HABILITADO V2.0 🚀"}

# Cambio forzado