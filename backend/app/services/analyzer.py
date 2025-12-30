from textblob import TextBlob

class Analyzer:
    @staticmethod
    def analyze_text(text: str):
        """
        Devuelve un diccionario con el sentimiento y el nivel de riesgo calculado.
        """
        blob = TextBlob(text)
        
        sentiment_score = blob.sentiment.polarity
        
        risk_level = "low"
        if sentiment_score < -0.1:
            risk_level = "medium"
        if sentiment_score < -0.5:
            risk_level = "critical"
            
        keywords_urgency = ["breach", "attack", "critical", "exploit", "zero-day"]
        if any(word in text.lower() for word in keywords_urgency):
            risk_level = "critical"

        return {
            "sentiment": sentiment_score,
            "risk_level": risk_level
        }