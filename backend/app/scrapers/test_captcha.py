import time
# Importamos tu clase desde la carpeta utils
from app.utils.captcha import CaptchaSolver

def run_security_test():
    print("--- INICIANDO TEST DE PENETRACIÓN (CAPTCHA) ---")
    
    # 1. Instanciamos tu clase
    # Al no haber configurado la variable de entorno, entrará en modo SIMULACIÓN
    solver = CaptchaSolver(provider="2captcha")
    
    target_site = "https://www.google.com/recaptcha/api2/demo"
    site_key_falso = "6Le-wvkSAAAAAPBCRTvw..." # Key pública de demo de Google
    
    print(f"[*] Objetivo detectado: {target_site}")
    print("[*] Challenge encontrado. Intentando bypass...")
    
    # Simulo un pequeño delay para dar realismo (como si estuviera pensando)
    time.sleep(2) 

    # 2. Llamamos a tu método solve
    token = solver.solve(site_key_falso, target_site)
    
    # 3. Verificamos el resultado
    if "SENTINEL" in token:
        if token == "SENTINEL_DEMO_BYPASS_TOKEN_OK":
            print(f"\n[✔] ÉXITO: Captcha 'Bypasseado' (Modo Simulación).")
            print(f"    Token generado: {token}")
        else:
            print(f"\n[!] ALERTA: Fallo controlado. Código: {token}")
    else:
        # Esto pasaría si tuvieras la API Key real puesta
        print(f"\n[✔] ÉXITO: Captcha resuelto vía API Real.")
        print(f"    Token real: {token[:20]}...")

if __name__ == "__main__":
    run_security_test()