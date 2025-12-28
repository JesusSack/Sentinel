from abc import ABC, abstractmethod
from typing import List
from app.models.source import Source
from app.models.finding import Finding

class BaseScraper(ABC):
    """Clase abstracta para definir la estructura de cualquier scraper"""
    
    def __init__(self, source: Source):
        self.source = source

    @abstractmethod
    def scrape(self) -> List[Finding]:
        """
        Método obligatorio que debe implementar cada scraper.
        Debe devolver una lista de objetos Finding.
        """
        pass