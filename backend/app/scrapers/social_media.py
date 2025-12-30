import logging
import os
from datetime import datetime
import praw 

# NOTA: Telethon se mantiene comentado para no obligar a configurar Telegram API Hash ahora mismo.
# from telethon import TelegramClient

class SocialMediaIngestor:
    """
    Módulo de adquisición de datos en Redes Sociales (Real Time).
    Soporta: Reddit (Nativo via PRAW), Telegram (MTProto).
    Incluye Modo Standby automático si no se detectan API Keys.
    """
    
    def __init__(self, platform: str, config: dict = None):
        self.platform = platform
        self.config = config or {}
        self.logger = logging.getLogger("sentinel.social")
        self.client = None
        
        # Carga de credenciales desde variables de entorno
        self.reddit_id = os.getenv("REDDIT_CLIENT_ID")
        self.reddit_secret = os.getenv("REDDIT_CLIENT_SECRET")

    def connect(self):
        """Establece la conexión con la API correspondiente"""
        try:
            if self.platform == "reddit":
                if self.reddit_id and self.reddit_secret:
                    self.client = praw.Reddit(
                        client_id=self.reddit_id,
                        client_secret=self.reddit_secret,
                        user_agent="Sentinel_OSINT_Bot/1.0"
                    )
                    self.logger.info("✅ Conexión establecida con la API de Reddit.")
                    return True
                else:
                    self.logger.warning("⚠️ API Keys de Reddit no detectadas. Iniciando en modo Standby.")
                    return True
                
            elif self.platform == "telegram":
                self.logger.info("Cliente Telegram inicializado (Esperando sesión).")
                return True
            
            return True
        except Exception as e:
            self.logger.error(f"Error conectando a {self.platform}: {e}")
            return False

    def fetch_feed(self, query: str, limit=10):
        """
        Recupera posts REALES si hay llaves, o genera logs de Standby si no las hay.
        """
        self.logger.info(f"🔍 Ejecutando búsqueda en {self.platform} para: '{query}'")
        results = []
        
        try:
            #  REDDIT 
            if self.platform == "reddit":
                if self.client:
                    # Extracción de datos de Reddit
                    subreddit = self.client.subreddit("all")
                    posts = subreddit.search(query, limit=limit, sort="new")
                    
                    for post in posts:
                        results.append({
                            "source_id": "reddit_api",
                            "title": f"Reddit: {post.title[:80]}...",
                            "content": post.selftext[:500] or post.title,
                            "url": post.url,
                            "published_date": datetime.utcfromtimestamp(post.created_utc),
                            "risk_level": "unknown",
                            "sentiment": 0.0,
                            "author": post.author.name if post.author else "deleted"
                        })
                else:
                    #  El motor está listo pero espera credenciales
                    results.append({
                        "source_id": "sentinel_standby",
                        "title": f"Módulo Reddit: Esperando Activación para '{query}'",
                        "content": f"El motor de búsqueda Sentinel está configurado para {query}. "
                                   f"Para recibir datos en tiempo real, vincule su Client_ID y Secret "
                                   f"en las variables de entorno del servidor.",
                        "url": "https://www.reddit.com/prefs/apps",
                        "published_date": datetime.utcnow(),
                        "risk_level": "low",
                        "sentiment": 0.0,
                        "author": "Sentinel System"
                    })

            elif self.platform == "telegram":
                self.logger.warning("Telegram scan requiere sesión activa.")
                pass

        except Exception as e:
            self.logger.error(f"❌ Fallo durante el scraping de {self.platform}: {e}")

        return results