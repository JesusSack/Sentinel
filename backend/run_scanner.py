import firebase_admin
from firebase_admin import credentials, firestore
from app.scrapers.rss_scraper import RSSScraper 
from datetime import datetime

class SourceObject:
    def __init__(self, id, url):
        self.id = id
        self.url = url

def run_global_scanner():
    # 1. Inicializar Firebase 
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    
    # 2. Leer fuentes desde Firestore 
    print("🔍 Obteniendo fuentes desde Firestore...")
    sources_ref = db.collection("sources").stream()
    
    for doc in sources_ref:
        data = doc.to_dict()
        source_obj = SourceObject(doc.id, data['url'])
        
        # 3. Usar tu Scraper para cada fuente
        scraper = RSSScraper(source=source_obj)
        findings = scraper.scrape()
        
        # 4. Guardar hallazgos en Firestore
        for f in findings:
            doc_id = f.url.replace("/", "_").replace(":", "")
            finding_data = {
                "title": f.title,
                "content": f.content,
                "url": f.url,
                "source_id": f.source_id,
                "risk_level": "medium", # Por defecto
                "status": "new",
                "created_at": datetime.utcnow()
            }
            db.collection("findings").document(doc_id).set(finding_data, merge=True)
            print(f"📌 Guardado: {f.title[:50]}...")

if __name__ == "__main__":
    run_global_scanner()