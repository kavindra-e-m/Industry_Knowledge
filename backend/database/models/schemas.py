"""
Shared Pydantic models used across routes.
Owner: Member 1
"""
from pydantic import BaseModel


class EquipmentNode(BaseModel):
    id: str
    name: str
    equipment_type: str
