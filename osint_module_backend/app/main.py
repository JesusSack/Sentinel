from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import router as api_router
from app.services.scheduler import start_scheduler, run_ingestion_cycle 

app = FastAPI(
    title="OSINT Intelligence Module",
    description="API para ingestión, análisis y reporte de inteligencia operativa.",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    print("🚀 Iniciando servicios...")
    start_scheduler()
    run_ingestion_cycle() 

@app.on_event("shutdown")
def shutdown_event():
    print("🛑 Apagando servicios...")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Sistema OSINT Operativo. Scheduler Activo (Modo Clásico)."}