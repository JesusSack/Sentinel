import firebase_admin
from firebase_admin import credentials, firestore
import os

db = None

def get_db():
    global db
    if db is None:
        # Busca el archivo JSON en la raíz
        cred_path = "serviceAccountKey.json"
        
        if not os.path.exists(cred_path):
            raise FileNotFoundError(f"No se encontró el archivo {cred_path}. Descárgalo de Firebase Console.")

        # Inicializa la app de Firebase si no existe
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        print("🔥 Conexión a Firestore exitosa.")
    
    return db