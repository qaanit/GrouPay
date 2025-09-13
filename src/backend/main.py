from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Getting rid of that CORS problem >:(
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory "database"
db = {
    "groups": {},   # group_id -> {members, receipt, assignments, payments}
}

# Models
class Item(BaseModel):
    name: str
    price: float

class Receipt(BaseModel):
    items: List[Item]

class Group(BaseModel):
    members: List[str]

@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}


