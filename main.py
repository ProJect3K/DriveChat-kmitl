from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import asyncio
from typing import Optional
from datetime import datetime, timedelta

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
    creator_type: str
    transport_type: str  # Added transport type field

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.active_users: dict[str, list[str]] = {}
        self.available_rooms: dict[str, dict] = {}
        self.room_cleanup_tasks: dict[str, Optional[asyncio.Task]] = {}
        self.room_transition_tasks: dict[str, asyncio.Task] = {}
        self.original_rooms: dict[str, str] = {}  # Track original rooms for users

        # Initialize duck pond and ped pong rooms
        self.available_rooms["duck_pond"] = {
            "capacity": 15,
            "next_transition": None,
            "is_special": True,
            "transport_type": None
        }
        self.available_rooms["ped_pong"] = {
            "capacity": 15,
            "next_transition": None,
            "is_special": True,
            "transport_type": None
        }

    async def connect(self, websocket: WebSocket, room: str, username: str):
        """
        Connect a WebSocket to a specific room.

        Args:
            websocket (WebSocket): The WebSocket connection to be connected.
            room (str): The name of the room to connect to.
            username (str): The username of the connecting user.

        Raises:
            HTTPException: If the room does not exist or the room is full.
        """
        if room not in self.available_rooms:
            raise HTTPException(status_code=400, detail="Room does not exist")

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

    async def disconnect(self, websocket: WebSocket, room: str):
        """
        Disconnect a WebSocket from a specific room.

        Args:
            websocket (WebSocket): The WebSocket connection to be disconnected.
            room (str): The name of the room to disconnect from.
        """
        if room in self.active_connections:
            if websocket in self.active_connections[room]:
                index = self.active_connections[room].index(websocket)
                username = self.active_users[room][index]
                self.active_connections[room].remove(websocket)
                self.active_users[room].remove(username)

                # Clean up user's original room tracking
                if username in self.original_rooms:
                    del self.original_rooms[username]

                await self.broadcast(f"System: {username} has left the chat", room)
                await self.broadcast_user_list(room)

                if len(self.active_users[room]) == 0 and room not in ["duck_pond", "ped_pong"]:
                    if room in self.room_transition_tasks:
                        self.room_transition_tasks[room].cancel()
                    del self.available_rooms[room]

    async def move_users_to_ped_pong(self, room: str):
        """
        Move all users from a given room to the ped pong room.

        Args:
            room (str): The name of the room to move users from.
        """
        if room in ["ped_pong", "duck_pond"] or not self.active_connections.get(room):
            return

        users_to_move = list(zip(self.active_connections[room], self.active_users[room]))

        # Store original room for all users
        for _, username in users_to_move:
            self.original_rooms[username] = room

        # Clear current room
        self.active_connections[room] = []
        self.active_users[room] = []

        # Move users to ped pong
        for websocket, username in users_to_move:
            try:
                await websocket.send_text(f"System: Moving all users to ped pong...")
                await asyncio.sleep(0.1)  # Small delay to ensure message is sent

                if "ped_pong" not in self.active_connections:
                    self.active_connections["ped_pong"] = []
                    self.active_users["ped_pong"] = []

                self.active_connections["ped_pong"].append(websocket)
                self.active_users["ped_pong"].append(username)

                # Force update the client's room state
                await websocket.send_text("System: ROOM_CHANGE:ped_pong")

                await self.broadcast("System: " + username + " was moved from " + room, "ped_pong")
                await self.broadcast_user_list("ped_pong")

            except Exception as e:
                print(f"Error moving user {username}: {e}")

    async def move_back_to_original_room(self, username: str, websocket: WebSocket):
        """
        Move a user back to their original room.

        Args:
            username (str): The username of the user to move.
            websocket (WebSocket): The WebSocket connection of the user to move.

        Returns:
            bool: True if the user was successfully moved, False otherwise.
        """
        if username not in self.original_rooms:
            return False

        original_room = self.original_rooms[username]
        current_room = None

        # Find current room
        for room, connections in self.active_connections.items():
            if websocket in connections:
                current_room = room
                break

        if not current_room or current_room == original_room:
            return False

        # Move user back to original room
        try:
            # Remove from current room
            if current_room in self.active_connections:
                self.active_connections[current_room].remove(websocket)
                self.active_users[current_room].remove(username)

            # Add to original room
            if original_room not in self.active_connections:
                self.active_connections[original_room] = []
                self.active_users[original_room] = []

            self.active_connections[original_room].append(websocket)
            self.active_users[original_room].append(username)

            # Update room states
            await websocket.send_text(f"System: Moving back to {original_room}...")
            await websocket.send_text(f"System: ROOM_CHANGE:{original_room}")

            await self.broadcast(f"System: {username} has returned to the room", original_room)
            await self.broadcast_user_list(original_room)

            # Clean up tracking
            del self.original_rooms[username]

            return True
        except Exception as e:
            print(f"Error moving user back: {e}")
            return False

    async def start_room_transition_timer(self, room: str):
        """
        Start a timer to transition a room to the ped pong room.

        Args:
            room (str): The name of the room to transition.
        """
        if room in ["duck_pond", "ped_pong"] or self.available_rooms[room].get("is_special"):
            return

        try:
            next_transition = datetime.now() + timedelta(minutes=3)
            self.available_rooms[room]["next_transition"] = next_transition

            await asyncio.sleep(160)  # 2m 40s - warn users
            await self.broadcast(f"System: Room will transition to ped pong in 20 seconds!", room)

            await asyncio.sleep(20)  # Wait final 20 seconds
            await self.move_users_to_ped_pong(room)

        except asyncio.CancelledError:
            print(f"Room transition timer cancelled for {room}")
        except Exception as e:
            print(f"Error in transition timer for {room}: {e}")
            await self.move_users_to_ped_pong(room)  # Attempt to move users even if there's an error

    def get_time_remaining(self, room: str) -> Optional[int]:
        """
        Get the time remaining before a room transitions.

        Args:
            room (str): The name of the room to check.

        Returns:
            Optional[int]: The number of seconds remaining before the room transitions, or None if the room does not have a transition timer.
        """
        if room not in self.available_rooms or room in ["duck_pond", "ped_pong"]:
            return None

        next_transition = self.available_rooms[room].get("next_transition")
        if not next_transition:
            return None

        remaining = (next_transition - datetime.now()).seconds
        return max(0, remaining)

    def get_room_count(self, room: str) -> int:
        """
        Get the number of users in a room.

        Args:
            room (str): The name of the room to check.

        Returns:
            int: The number of users in the room.
        """
        return len(self.active_users.get(room, []))

    def get_room_capacity(self, room: str) -> int:
        """
        Get the capacity of a room.

        Args:
            room (str): The name of the room to check.

        Returns:
            int: The capacity of the room.
        """
        return self.available_rooms.get(room, {}).get("capacity", 0)

    def get_random_active_room(self, transport_type: str, user_type: str) -> dict:
        """
        Get a random available room that matches the specified transport type and user type.

        Args:
            transport_type (str): The transport type to filter rooms by.
            user_type (str): The user type to filter rooms by.

        Returns:
            dict: A dictionary containing information about the selected room, or None if no suitable room is available.
        """
        if user_type != "passenger":  # Only passengers can use random join
            return None

        available_rooms = []
        for room_name, room_info in self.available_rooms.items():
            # Check transport_type in room_info instead of room name
            if (room_name not in ["duck_pond", "ped_pong"] and 
                room_info.get("transport_type") == transport_type):
                current_users = self.get_room_count(room_name)
                if current_users < room_info["capacity"]:
                    available_rooms.append({
                        "room": room_name,
                        "capacity": room_info["capacity"],
                        "current_users": current_users,
                        "time_remaining": self.get_time_remaining(room_name)
                    })
        return random.choice(available_rooms) if available_rooms else None

    async def broadcast(self, message: str, room: str, exclude: WebSocket = None):
        """
        Broadcast a message to all connected WebSockets in a room, except for the excluded WebSocket.

        Args:
            message (str): The message to broadcast.
            room (str): The name of the room to broadcast the message in.
            exclude (WebSocket, optional): The WebSocket connection to exclude from the broadcast.
        """
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                if connection != exclude:
                    await connection.send_text(message)

    async def broadcast_user_list(self, room: str):
        """
        Broadcast the list of active users in a room to all connected WebSockets.

        Args:
            room (str): The name of the room to broadcast the user list in.
        """
        if room in self.active_users:
            user_list = self.active_users[room]
            capacity = self.available_rooms[room]["capacity"]
            time_remaining = self.get_time_remaining(room)

            status_msg = f"Active users ({len(user_list)}/{capacity}): {', '.join(user_list)}"
            if time_remaining is not None:
                status_msg += f" | Time remaining: {time_remaining//60}m {time_remaining%60}s"

            for connection in self.active_connections[room]:
                await connection.send_text(status_msg)

manager = ConnectionManager()

@app.post("/rooms")
async def create_room(room: RoomCreate):
    """
    Create a new room with the specified parameters.

    Args:
        room (RoomCreate): A pydantic model containing the room information.

    Raises:
        HTTPException: If the room already exists or the creator is not a driver.

    Returns:
        dict: A dictionary containing the status and details of the created room.
    """
    if room.room_name in manager.available_rooms:
        raise HTTPException(status_code=400, detail="Room already exists")
    
    if room.creator_type != "driver":
        raise HTTPException(status_code=400, detail="Only drivers can create rooms")

    manager.available_rooms[room.room_name] = {
        "capacity": room.capacity,
        "next_transition": None,
        "is_special": False,
        "transport_type": room.transport_type  # Store the transport type
    }

    # Start the transition timer for the new room
    manager.room_transition_tasks[room.room_name] = asyncio.create_task(
        manager.start_room_transition_timer(room.room_name)
    )

    return {
        "status": "success",
        "room": room.room_name,
        "capacity": room.capacity
    }

@app.get("/rooms/random")
async def get_random_room(transport_type: str, user_type: str):
    """
    Get a random available room that matches the specified transport type and user type.

    Args:
        transport_type (str): The transport type to filter rooms by.
        user_type (str): The user type to filter rooms by.

    Returns:
        dict: A dictionary containing information about the selected room, or a message indicating that no suitable room is available.
    """
    room = manager.get_random_active_room(transport_type, user_type)
    if room:
        return room
    return {"room": None, "message": "No suitable rooms available"}

@app.get("/rooms/debug")
async def debug_rooms():
    """
    Get a dictionary of information about all available rooms.

    Returns:
        dict: A dictionary containing information about each available room.
    """
    return {
        "rooms": {
            room_name: {
                "capacity": room_info["capacity"],
                "current_users": manager.get_room_count(room_name),
                "time_remaining": manager.get_time_remaining(room_name),
                "is_special": room_info.get("is_special", False),
                "transport_type": room_info.get("transport_type")  # Include transport
            }
            for room_name, room_info in manager.available_rooms.items()
        }
    }

@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):
    """
    Handle the WebSocket connection for a user joining a room.

    Args:
        websocket (WebSocket): The WebSocket connection for the user.
        room_id (str): The ID of the room the user is joining.
        username (str): The username of the user joining the room.
    """
    try:
        await manager.connect(websocket, room_id, username)
        await manager.broadcast(f"System: {username} has joined the chat", room_id)
        await manager.broadcast_user_list(room_id)
        
        while True:
            data = await websocket.receive_text()

            # Check for special command to return to original room
            if data.strip().lower() == "/return" and username in manager.original_rooms:
                success = await manager.move_back_to_original_room(username, websocket)
                if success:
                    continue
            
            await manager.broadcast(f"{username}: {data}", room_id)

    except WebSocketDisconnect:
        await manager.disconnect(websocket, room_id)
    except Exception as e:
        print(f"Error in websocket connection: {e}")
        await manager.disconnect(websocket, room_id)
