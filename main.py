from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        # Track active connections and user names for each room
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.active_users: dict[str, list[str]] = {}

    async def connect(self, websocket: WebSocket, room: str, username: str):
        await websocket.accept()
        
        # Add websocket connection to the room
        if room not in self.active_connections:
            self.active_connections[room] = []
            self.active_users[room] = []

        self.active_connections[room].append(websocket)
        self.active_users[room].append(username)

    def disconnect(self, websocket: WebSocket, room: str, username: str):
        if room in self.active_connections:
            self.active_connections[room].remove(websocket)
            self.active_users[room].remove(username)

            # If the room is empty, clear the room data
            if len(self.active_connections[room]) == 0:
                del self.active_connections[room]
                del self.active_users[room]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, room: str, exclude: WebSocket = None):
        for connection in self.active_connections.get(room, []):
            if connection != exclude:
                await connection.send_text(message)

    async def broadcast_user_list(self, room: str):
        # Send the list of active users in the room
        user_list = self.active_users.get(room, [])
        message = f"Active users: {', '.join(user_list)}"
        for connection in self.active_connections.get(room, []):
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{room}/{username}")
async def websocket_endpoint(websocket: WebSocket, room: str, username: str):
    await manager.connect(websocket, room, username)
    
    # Notify others that a user has joined and update user list
    await manager.broadcast(f"{username} joined the chat room.", room, exclude=websocket)
    await manager.send_personal_message("You have joined the chat room.", websocket)
    
    # Broadcast the updated user list
    await manager.broadcast_user_list(room)
    
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"{username}: {data}", room)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room, username)
        
        # Notify others that a user has left and update user list
        await manager.broadcast(f"{username} left the chat room.", room)
        await manager.broadcast_user_list(room)
