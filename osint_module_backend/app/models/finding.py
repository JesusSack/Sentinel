from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class Finding(BaseModel):
    source_id: str
    title: str
    content: str
    url: str
    published_date: datetime
    risk_score: float = 0.0 
    sentiment: float = 0.0
    tags: List[str] = []