from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_shipments():
    return {"message": "Shipments API"}
