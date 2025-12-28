from pydantic import BaseModel
from typing import Optional, Dict

class SourceCreate(BaseModel):
    url: str
    type: str  # "rss", "web", "reddit"
    name: str
    config: Optional[Dict] = {}

class Source(SourceCreate):
    id: str
    status: str = "active"