from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import get_db
from app.models.source import Source
from app.scrapers.rss_scraper import RSSScraper
from app.services.analyzer import Analyzer
import datetime

scheduler = BackgroundScheduler()

def run_ingestion_cycle():
    """
    Esta función es la que se ejecuta automáticamente.
    Recorre todas las fuentes activas y busca información nueva.
    """
    print(f"\n⏰ [Scheduler] Iniciando ciclo de ingestión: {datetime.datetime.now()}")
    
    db = get_db()
    docs = db.collection('sources').stream()
    
    sources = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        try:
            sources.append(Source(**data))
        except Exception as e:
            print(f"⚠️ Error cargando fuente {doc.id}: {e}")

    if not sources:
        print("📭 No hay fuentes configuradas para procesar.")
        return

    findings_collection = db.collection('findings')
    
    for source in sources:
        print(f"🔍 Procesando: {source.name} ({source.type})...")
        
        # Selección de Scraper según el tipo
        scraper = None
        if source.type == 'rss':
            scraper = RSSScraper(source)
        
        if not scraper:
            continue
            
        try:
            new_findings = scraper.scrape()
            
            count = 0
            for item in new_findings:
                # Análisis de IA
                analysis = Analyzer.analyze_text(item.title + " " + item.content)
                item.sentiment = analysis['sentiment']
                
                doc_data = item.model_dump()
                doc_data['risk_level'] = analysis['risk_level']
                
                safe_id = "".join(x for x in item.title if x.isalnum())[:30]
                
                # .set(merge=True) actualiza si existe, crea si no
                findings_collection.document(safe_id).set(doc_data, merge=True)
                count += 1
                
            print(f"   ✅ {count} items procesados/actualizados.")
            
        except Exception as e:
            print(f"   ❌ Error en fuente {source.name}: {e}")

    print("💤 Ciclo terminado. Esperando siguiente ejecución...\n")

def start_scheduler():
    # Agregamos la tarea para que corra cada 10 minutos
    # se puede cambiar 
    scheduler.add_job(run_ingestion_cycle, 'interval', minutes=10)
    scheduler.start()
    print("🚀 Scheduler iniciado en segundo plano.")