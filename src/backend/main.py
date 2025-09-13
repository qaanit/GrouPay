from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory DB
db = {
    "groups": {}  # group_id -> {members, receipt, assignments, payments}
}

# Models
class Item(BaseModel):
    name: str
    price: float

class Receipt(BaseModel):
    items: List[Item]

class Group(BaseModel):
    members: List[str]

class Assignment(BaseModel):
    item_index: int
    member: str

class Payment(BaseModel):
    member: str

@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}


# Phase 2: Upload receipt
@app.post("/receipt/{group_id}")
def upload_receipt(group_id: str, receipt: Receipt):
    db["groups"][group_id] = {
        "members": [],
        "receipt": receipt.dict(),
        "assignments": {},  # {item_index: member}
        "payments": {},
    }
    return {"message": f"Receipt uploaded for group {group_id}"}


# Phase 2: Add members
@app.post("/group/{group_id}")
def create_group(group_id: str, group: Group):
    if group_id not in db["groups"]:
        db["groups"][group_id] = {
            "receipt": {"items": []},
            "assignments": {},
            "payments": {},
        }
    db["groups"][group_id]["members"] = group.members
    db["groups"][group_id]["payments"] = {m: False for m in group.members}
    return {"message": f"Group {group_id} created", "members": group.members}


# Phase 3: Assign items
@app.post("/assign/{group_id}")
def assign_item(group_id: str, assignment: Assignment):
    group = db["groups"].get(group_id)
    if not group:
        return {"error": "Group not found"}

    item_index = assignment.item_index
    member = assignment.member

    # Validate member exists
    if member not in group["members"]:
        return {"error": "Member not in group"}

    # Assign item to member
    # If item was assigned to someone else, it will be moved
    group["assignments"][item_index] = member

    return {
        "message": f"Item {item_index} assigned to {member}",
        "assignments": group["assignments"],
    }


# Phase 3: Get bill (totals)
@app.get("/bill/{group_id}")
def get_bill(group_id: str):
    group = db["groups"].get(group_id)
    if not group:
        return {"error": "Group not found"}

    totals = {m: 0 for m in group["members"]}
    for item_index, member in group["assignments"].items():
        item_price = group["receipt"]["items"][item_index]["price"]
        totals[member] += item_price

    return {"totals": totals, "assignments": group["assignments"]}

# --- Phase 4: Payments ---
@app.post("/pay/{group_id}")
def make_payment(group_id: str, payment: Payment):
    group = db["groups"].get(group_id)
    if not group:
        return {"error": "Group not found"}
    if payment.member not in group["members"]:
        return {"error": "Member not in group"}

    group["payments"][payment.member] = True
    return {"message": f"{payment.member} has paid", "payments": group["payments"]}

@app.get("/dashboard/{group_id}")
def dashboard(group_id: str):
    group = db["groups"].get(group_id)
    if not group:
        return {"error": "Group not found"}

    all_paid = all(group["payments"].values())
    return {
        "assignments": group["assignments"],
        "totals": {m: sum(
            group["receipt"]["items"][i]["price"]
            for i, assigned_member in group["assignments"].items()
            if assigned_member == m
        ) for m in group["members"]},
        "payments": group["payments"],
        "all_paid": all_paid
    }