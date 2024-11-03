from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import asyncio
from typing import Optional

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoomCreate(BaseModel):
    room_name: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.active_users: dict[str, list[str]] = {}
        self.available_rooms: set[str] = set()
        self.room_cleanup_tasks: dict[str, Optional[asyncio.Task]] = {}

    async def connect(self, websocket: WebSocket, room: str, username: str):
        await websocket.accept()
        
        if room not in self.active_connections:
            self.active_connections[room] = []
            self.active_users[room] = []
            self.available_rooms.add(room)
        
        if room in self.room_cleanup_tasks and self.room_cleanup_tasks[room]:
            self.room_cleanup_tasks[room].cancel()
            self.room_cleanup_tasks[room] = None

        self.active_connections[room].append(websocket)
        self.active_users[room].append(username)

    async def cleanup_empty_room(self, room: str):
        try:
            # Wait for 5 seconds before cleaning up the room
            await asyncio.sleep(5)
            
            # Check if the room is still empty
            if room in self.active_connections and len(self.active_connections[room]) == 0:
                del self.active_connections[room]
                del self.active_users[room]
                self.available_rooms.remove(room)
                # Clean up the task reference
                self.room_cleanup_tasks[room] = None
                print(f"Room {room} has been deleted due to inactivity")
        except asyncio.CancelledError:
            # Task was cancelled because a new user joined
            pass
        except Exception as e:
            print(f"Error during room cleanup: {e}")

    def disconnect(self, websocket: WebSocket, room: str, username: str):
        if room in self.active_connections:
            self.active_connections[room].remove(websocket)
            self.active_users[room].remove(username)

            # If room is empty, schedule it for cleanup
            if len(self.active_connections[room]) == 0:
                # Create a cleanup task
                self.room_cleanup_tasks[room] = asyncio.create_task(
                    self.cleanup_empty_room(room)
                )

    def get_room_count(self, room: str) -> int:
        return len(self.active_users.get(room, []))

    def get_random_active_room(self) -> str:
        active_rooms = [room for room in self.available_rooms 
                       if self.get_room_count(room) > 0 
                       and self.get_room_count(room) < 5]  # Limit to rooms with 1-4 users
        return random.choice(active_rooms) if active_rooms else None

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, room: str, exclude: WebSocket = None):
        for connection in self.active_connections.get(room, []):
            if connection != exclude:
                await connection.send_text(message)

    async def broadcast_user_list(self, room: str):
        user_list = self.active_users.get(room, [])
        message = f"Active users: {', '.join(user_list)}"
        for connection in self.active_connections.get(room, []):
            await connection.send_text(message)

manager = ConnectionManager()

@app.post("/rooms")
async def create_room(room_data: RoomCreate):
    room_name = room_data.room_name
    if room_name not in manager.available_rooms:
        manager.available_rooms.add(room_name)
        return {"message": f"Room {room_name} created successfully"}
    return {"message": f"Room {room_name} already exists"}

@app.get("/rooms")
async def get_rooms():
    return {
        "rooms": list(manager.available_rooms),
        "room_stats": {
            room: manager.get_room_count(room) 
            for room in manager.available_rooms
        }
    }

@app.get("/rooms/random")
async def get_random_room():
    random_room = manager.get_random_active_room()
    if random_room:
        return {"room": random_room}
    return {"room": None, "message": "No suitable rooms available"}

@app.websocket("/ws/{room}/{username}")
async def websocket_endpoint(websocket: WebSocket, room: str, username: str):
    await manager.connect(websocket, room, username)
    
    await manager.broadcast(f"{username} joined the chat room.", room, exclude=websocket)
    await manager.send_personal_message("You have joined the chat room.", websocket)
    await manager.broadcast_user_list(room)
    
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"{username}: {data}", room)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room, username)
        await manager.broadcast(f"{username} left the chat room.", room)
        await manager.broadcast_user_list(room)