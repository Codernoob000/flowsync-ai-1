from pydantic import BaseModel

class RouteRequest(BaseModel):
    origin: str
    destination: str
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
