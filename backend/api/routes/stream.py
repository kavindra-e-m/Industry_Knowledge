"""
Real-time WebSocket + SSE stream route.
Broadcasts live anomaly alerts and sensor events.
Owner: Member 1 — Backend & RAG Lead
"""
import json
import asyncio
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from loguru import logger

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections for broadcast."""

    def __init__(self):
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)
        logger.info(f"WebSocket connected — {len(self.active)} active connections")

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)
        logger.info(f"WebSocket disconnected — {len(self.active)} active connections")

    async def broadcast(self, data: dict):
        message = json.dumps(data)
        disconnected = set()
        for ws in self.active:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.active.discard(ws)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time anomaly and alert streaming.
    Connect from frontend to receive live updates.
    """
    await manager.connect(websocket)
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Echo heartbeat
                await websocket.send_text(json.dumps({"type": "pong", "received": data}))
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "heartbeat"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.get("/sse", summary="Server-Sent Events stream")
async def sse_stream():
    """
    Server-Sent Events stream for UI dashboards that prefer SSE over WebSocket.
    Sends periodic status updates.
    """
    async def event_generator():
        yield "data: {\"type\": \"connected\", \"service\": \"IndustrialBrain\"}\n\n"
        try:
            for i in range(1000):
                await asyncio.sleep(30)
                yield f"data: {{\"type\": \"heartbeat\", \"tick\": {i}}}\n\n"
        except asyncio.CancelledError:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/broadcast-alert", summary="Broadcast an alert to all connected clients")
async def broadcast_alert(payload: dict):
    """Broadcast a custom alert to all WebSocket clients."""
    await manager.broadcast({"type": "alert", **payload})
    return {"broadcast_to": len(manager.active), "payload": payload}
