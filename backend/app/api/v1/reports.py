from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
import pandas as pd
from fpdf import FPDF
import io
from firebase_admin import firestore
import traceback
import re 
import html 
from app.auth import get_current_user, User
from app.api.v1.admin import log_action

router = APIRouter()

def clean_text(text):
    """
    Limpia el texto para que sea 100% compatible con FPDF (Latin-1)
    y elimina etiquetas HTML (divs, br, p).
    """
    if text is None:
        return ""
    
    text = str(text)

    # 1. ELIMINAR ETIQUETAS HTML
    text = re.sub('<[^<]+?>', '', text)

    # 2. LIMPIAR ENTIDADES HTML
    text = html.unescape(text)

    # 3. REEMPLAZAR CARACTERES RAROS
    replacements = {
        '\u2018': "'",  
        '\u2019': "'",  
        '\u201c': '"',  
        '\u201d': '"',  
        '\u2013': '-',  
        '\u2014': '-', 
        '…': '...'      
    }
    
    for k, v in replacements.items():
        text = text.replace(k, v)

    # 4. LIMPIAR ESPACIOS EXTRA Y SALTOS DE LINEA
    text = " ".join(text.split())

    # 5. ENCODING FINAL PARA FPDF
    return text.encode('latin-1', 'replace').decode('latin-1')

#    EXPORTAR CSV
@router.get("/export/csv")
async def export_findings_csv(current_user: User = Depends(get_current_user)):
    try:
        db = firestore.client()
        findings_ref = db.collection("findings")
        docs = findings_ref.stream()

        data = []
        for doc in docs:
            d = doc.to_dict()
            clean_row = {
                "Fecha": d.get("published_date", ""),
                "Titulo": clean_text(d.get("title", "Sin Título")),
                "Riesgo": d.get("risk_level", "low"),
                "Fuente": d.get("source_id", ""),
                "URL": d.get("url", "")
            }
            data.append(clean_row)

        if not data:
            data = [{"Info": "No hay datos disponibles"}]

        df = pd.DataFrame(data)
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=intelligence_report.csv"
        return response

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

#    EXPORTAR PDF
@router.get("/export/pdf")
async def export_findings_pdf(current_user: User = Depends(get_current_user)):
    try:
        db = firestore.client()
        # Traer todo para evitar errores de índices
        docs = db.collection("findings").stream()
        
        data = []
        for doc in docs:
            d = doc.to_dict()
            # Filtro manual de riesgo en Python
            if d.get("risk_level") in ["high", "critical"]:
                data.append(d)

        # Configurar PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Título
        pdf.set_font("Arial", "B", 16)
        pdf.cell(200, 10, txt="Reporte - SENTINEL", ln=1, align="C")
        
        # Subtítulo 
        user_clean = clean_text(current_user.username)
        pdf.set_font("Arial", size=10)
        pdf.cell(200, 10, txt=f"Generado por: {user_clean}", ln=1, align="C")
        pdf.ln(10)

        if not data:
            pdf.cell(200, 10, txt="Sin amenazas criticas.", ln=1, align="L")
        else:
            for item in data:
                # LIMPIEZA A LO QUE VA AL PDF
                title = clean_text(item.get('title', 'Sin Titulo'))
                risk = clean_text(item.get('risk_level', 'UNKNOWN')).upper()
                
                # Content estará limpio de HTML
                content = clean_text(item.get('content', ''))[:300] + "..."

                # Título de la noticia
                pdf.set_font("Arial", "B", 12)
                pdf.set_text_color(190, 0, 0)
                pdf.multi_cell(0, 10, txt=f"[{risk}] {title}")
                
                # Contenido
                pdf.set_font("Arial", size=10)
                pdf.set_text_color(0, 0, 0)
                pdf.multi_cell(0, 6, txt=content)
                pdf.ln(5)
                
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.ln(5)
        
        log_action(
            username=current_user.username,
            action="EXPORT_PDF",
            details="Exportó reporte de hallazgos críticos."
        ) 
        # binaria segura
        return StreamingResponse(
            io.BytesIO(pdf.output(dest='S').encode('latin-1', 'replace')),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=report_critical.pdf"}
        )

    except Exception as e:
        print(f"❌ Error PDF: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")