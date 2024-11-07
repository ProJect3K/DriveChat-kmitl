from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import asyncio
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoomCreate(BaseModel):
    room_name: str
    capacity: int
    creator_type: str  # Add creator type validation

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.active_users: dict[str, list[str]] = {}
        self.available_rooms: dict[str, dict] = {}  # Changed to store room info
        self.room_cleanup_tasks: dict[str, Optional[asyncio.Task]] = {}

    async def connect(self, websocket: WebSocket, room: str, username: str):
        # Check if room exists
        if room not in self.available_rooms:
            raise HTTPException(status_code=400, detail="Room does not exist")
            
        # Check if room is full
        if (room in self.active_users and 
            len(self.active_users[room]) >= self.available_rooms[room]["capacity"]):
            raise HTTPException(status_code=400, detail="Room is full")
            
        await websocket.accept()
        
        if room not in self.active_connections:
            self.active_connections[room] = []
            self.active_users[room] = []
            
        if room in self.room_cleanup_tasks and self.room_cleanup_tasks[room]:
            self.room_cleanup_tasks[room].cancel()
            self.room_cleanup_tasks[room] = None

        self.active_connections[room].append(websocket)
        self.active_users[room].append(username)

    async def cleanup_empty_room(self, room: str):
        try:
            await asyncio.sleep(5)
            if room in self.active_connections and len(self.active_connections[room]) == 0:
                del self.active_connections[room]
                del self.active_users[room]
                del self.available_rooms[room]
                self.room_cleanup_tasks[room] = None
                print(f"Room {room} has been deleted due to inactivity")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error during room cleanup: {e}")

    def disconnect(self, websocket: WebSocket, room: str, username: str):
        if room in self.active_connections:
            self.active_connections[room].remove(websocket)
            self.active_users[room].remove(username)

            if len(self.active_connections[room]) == 0:
                self.room_cleanup_tasks[room] = asyncio.create_task(
                    self.cleanup_empty_room(room)
                )

    def get_room_count(self, room: str) -> int:
        return len(self.active_users.get(room, []))

    def get_room_capacity(self, room: str) -> int:
        return self.available_rooms.get(room, {}).get("capacity", 0)

    def get_random_active_room(self, transport_type: str) -> dict:
        available_rooms = []
        for room_name, room_info in self.available_rooms.items():
            if transport_type in room_name:  # Check if room matches transport type
                current_users = self.get_room_count(room_name)
                if current_users < room_info["capacity"]:
                    available_rooms.append({
                        "room": room_name,
                        "capacity": room_info["capacity"],
                        "current_users": current_users
                    })
        return random.choice(available_rooms) if available_rooms else None

    async def broadcast(self, message: str, room: str, exclude: WebSocket = None):
        for connection in self.active_connections.get(room, []):
            if connection != exclude:
                await connection.send_text(message)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_user_list(self, room: str):
        if room in self.active_users:
            user_list = self.active_users[room]
            capacity = self.available_rooms[room]["capacity"]
            message = f"Active users ({len(user_list)}/{capacity}): {', '.join(user_list)}"
            for connection in self.active_connections.get(room, []):
                await connection.send_text(message)

manager = ConnectionManager()

@app.post("/rooms")
async def create_room(room_data: RoomCreate):
    if room_data.creator_type != "driver":
        raise HTTPException(status_code=400, detail="Only drivers can create rooms")
        
    room_name = room_data.room_name
    capacity = room_data.capacity
    
    if capacity not in [2, 4, 10, 15]:
        raise HTTPException(status_code=400, detail="Invalid room capacity")
        
    if room_name in manager.available_rooms:
        raise HTTPException(status_code=400, detail="Room already exists")
        
    manager.available_rooms[room_name] = {
        "capacity": capacity,
    }
    return {"message": f"Room {room_name} created successfully", "capacity": capacity}

@app.get("/rooms/random")
async def get_random_room(transport_type: str):
    room = manager.get_random_active_room(transport_type)
    if room:
        return room
    return {"room": None, "message": "No suitable rooms available"}

@app.websocket("/ws/{room}/{username}")
async def websocket_endpoint(websocket: WebSocket, room: str, username: str):
    try:
        await manager.connect(websocket, room, username)
    except HTTPException as e:
        await websocket.close(code=1000, reason=str(e.detail))
        return
    
    try:
        await manager.broadcast(f"{username} joined the chat room.", room, exclude=websocket)
        await manager.send_personal_message("You have joined the chat room.", websocket)
        await manager.broadcast_user_list(room)
        
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"{username}: {data}", room)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room, username)
        await manager.broadcast(f"{username} left the chat room.", room)
        await manager.broadcast_user_list(room)

@app.get("/rooms/debug")
async def debug_rooms():
    return {
        "available_rooms": manager.available_rooms,
        "active_users": manager.active_users,
        "active_connections": {room: len(conns) for room, conns in manager.active_connections.items()}
    }