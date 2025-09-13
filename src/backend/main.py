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

class Assignment(BaseModel): #Added so that each item gets assigned to a person
    item_index: int
    members: List[str]

@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}


# Uploading receipt for a payment plan
@app.post("/receipt/{group_id}")
def upload_receipt(group_id: str, receipt: Receipt):
    db["groups"][group_id] = {
        "members": [],
        "receipt": receipt.dict(),
        "assignments": [],
        "payments": {},
    }
    return {"message": f"Receipt uploaded for group {group_id}", "receipt": receipt}

# Uploading a new group
@app.post("/group/{group_id}")
def create_group(group_id: str, group: Group):
    if group_id not in db["groups"]:
        db["groups"][group_id] = {
            "receipt": {"items": []},
            "assignments": [],
            "payments": {},
        }
    db["groups"][group_id]["members"] = group.members
    db["groups"][group_id]["payments"] = {m: False for m in group.members}
    return {"message": f"Group {group_id} created", "members": group.members}