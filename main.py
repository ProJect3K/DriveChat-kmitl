from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
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
        self.available_rooms: set[str] = set()  # Track available rooms

    async def connect(self, websocket: WebSocket, room: str, username: str):
        await websocket.accept()
        
        if room not in self.active_connections:
            self.active_connections[room] = []
            self.active_users[room] = []
            self.available_rooms.add(room)  # Add room to available rooms

        self.active_connections[room].append(websocket)
        self.active_users[room].append(username)

    def disconnect(self, websocket: WebSocket, room: str, username: str):
        if room in self.active_connections:
            self.active_connections[room].remove(websocket)
            self.active_users[room].remove(username)

            if len(self.active_connections[room]) == 0:
                del self.active_connections[room]
                del self.active_users[room]
                # Don't remove from available_rooms as the room still exists

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

# Endpoint to create a new room
@app.post("/rooms")
async def create_room(room_data: RoomCreate):
    room_name = room_data.room_name
    if room_name not in manager.available_rooms:
        manager.available_rooms.add(room_name)
        return {"message": f"Room {room_name} created successfully"}
    return {"message": f"Room {room_name} already exists"}

# Endpoint to get available rooms
@app.get("/rooms")
async def get_rooms():
    return list(manager.available_rooms)

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