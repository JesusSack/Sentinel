import logging
import time
import requests
import os
from dotenv import load_dotenv

# Cargamos variables de entorno (.env)
load_dotenv()

class CaptchaSolver:
    """
    Gestor Híbrido de resolución de desafíos CAPTCHA (ReCaptcha v2/v3, hCaptcha).
    Funciona con la API real de 2Captcha o en modo simulación si no hay credenciales.
    """

    def __init__(self, provider="2captcha"):
        self.provider = provider
        self.api_key = os.getenv("CAPTCHA_API_KEY", "TU_API_KEY_REAL_AQUI")
        self.logger = logging.getLogger("sentinel.captcha")
        self.base_url = "http://2captcha.com"

    def solve(self, site_key, page_url):
        """
        Flujo de trabajo: 
        Detecta si existe una API Key válida. Si no, devuelve un token simulado.
        """
        if not self.api_key or "TU_API_KEY" in self.api_key:
            self.logger.warning("🛡️ Modo Simulación: API Key no configurada. Generando bypass de cortesía.")
            return "SENTINEL_DEMO_BYPASS_TOKEN_OK"

        try: 
            payload = {
                'key': self.api_key,
                'method': 'userrecaptcha',
                'googlekey': site_key,
                'pageurl': page_url,
                'json': 1
            }
            
            self.logger.info(f"🚀 Enviando desafío a {self.provider}...")
            response = requests.post(f"{self.base_url}/in.php", data=payload, timeout=10)
            res_json = response.json()

            if res_json.get("status") != 1:
                error_msg = res_json.get("request")
                self.logger.error(f"❌ Fallo al enviar a 2Captcha: {error_msg}")
                return "SENTINEL_FALLBACK_TOKEN"
            
            request_id = res_json.get("request")
            self.logger.info(f"⏳ Tarea {request_id} creada. Esperando resolución de un humano...")
            
            #  ESPERAR LA RESPUESTA 
            for i in range(20): # Máximo 100 segundos (20 intentos * 5 seg)
                time.sleep(5)
                check_url = f"{self.base_url}/res.php?key={self.api_key}&action=get&id={request_id}&json=1"
                
                try:
                    result = requests.get(check_url, timeout=5).json()
                except Exception:
                    continue

                if result.get("status") == 1:
                    token = result.get("request")
                    self.logger.info("✅ CAPTCHA resuelto exitosamente por el proveedor.")
                    return token
                
                if result.get("request") == "CAPCHA_NOT_READY":
                    self.logger.info(f"  [ Intento {i+1} ] El CAPTCHA aún no está listo...")
                    continue
                else:
                    self.logger.error(f"❌ Error en resolución: {result.get('request')}")
                    break
            
            return "SENTINEL_TIMEOUT_TOKEN"

        except Exception as e:
            self.logger.error(f"🔥 Error crítico en el módulo de Captcha: {e}")
            return "SENTINEL_ERROR_TOKEN"