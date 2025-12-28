import feedparser
from datetime import datetime
from typing import List
from app.scrapers.base import BaseScraper
from app.models.finding import Finding

class RSSScraper(BaseScraper):
    def scrape(self) -> List[Finding]:
        print(f"📡 Conectando a Feed RSS: {self.source.url}...")
        feed = feedparser.parse(self.source.url)
        
        findings = []
        
        if feed.bozo:
            print(f"⚠️ Error leyendo el feed: {feed.bozo_exception}")
            return []

        for entry in feed.entries[:10]: 
            pub_date = datetime.now()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                pub_date = datetime(*entry.published_parsed[:6])

            finding = Finding(
                source_id=self.source.id,
                title=entry.get('title', 'Sin título'),
                content=entry.get('summary', '') or entry.get('description', ''),
                url=entry.get('link', ''),
                published_date=pub_date
            )
            findings.append(finding)
            
        print(f"✅ Se encontraron {len(findings)} noticias nuevas.")
        return findings