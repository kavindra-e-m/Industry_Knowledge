import asyncio
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except RuntimeError:
                self.disconnect(connection)


manager = ConnectionManager()


@router.post("/event")
async def post_event(payload: dict):
    message = {
        "type": "event",
        "payload": payload,
        "source": "backend",
    }
    await manager.broadcast(message)
    return {"status": "broadcasted", "payload": payload}


@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await manager.send_personal_message(
            {"type": "welcome", "message": "Connected to live backend stream"},
            websocket,
        )
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=20.0)
                await manager.broadcast({"type": "client_message", "payload": data})
            except asyncio.TimeoutError:
                await manager.send_personal_message(
                    {"type": "heartbeat", "message": "Live connection active"},
                    websocket,
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
