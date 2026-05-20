"""
================================================================================
DriveChat@KMITL - Backend Server
================================================================================
ไฟล์นี้เป็น Backend Server สำหรับแอปพลิเคชันแชท DriveChat@KMITL
ใช้ FastAPI และ WebSocket ในการจัดการห้องแชทแบบ real-time

โครงสร้างไฟล์:
1. Imports & Configuration (การนำเข้าและตั้งค่า)
2. Data Models (โมเดลข้อมูล)  
3. ConnectionManager Class (คลาสจัดการการเชื่อมต่อ)
4. API Endpoints (จุดเชื่อมต่อ API)
5. WebSocket Handler (ตัวจัดการ WebSocket)
================================================================================
"""

# ==============================================================================
# 1. IMPORTS & CONFIGURATION (การนำเข้าและตั้งค่า)
# ==============================================================================

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import random
import asyncio
from typing import Optional
from datetime import datetime, timedelta

# สร้าง FastAPI application instance
# Create FastAPI application instance
app = FastAPI()

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "")
    origins = [
        origin.strip()
        for origin in raw_origins.split(",")
        if origin.strip()
    ]
    if ENVIRONMENT == "production" and "*" in origins:
        raise RuntimeError("ALLOWED_ORIGINS cannot include '*' in production")
    return origins or DEFAULT_ALLOWED_ORIGINS


ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()

# ตั้งค่า CORS Middleware เพื่ออนุญาตการเชื่อมต่อจาก Frontend
# Configure CORS Middleware to allow connections from Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,        # อนุญาต credentials
    allow_methods=["*"],           # อนุญาตทุก HTTP methods
    allow_headers=["*"],           # อนุญาตทุก headers
)


# ==============================================================================
# 2. DATA MODELS (โมเดลข้อมูล)
# ==============================================================================

class RoomCreate(BaseModel):
    """
    โมเดลสำหรับสร้างห้องแชทใหม่
    Model for creating a new chat room
    
    Attributes:
        room_name: ชื่อห้อง (Room name)
        capacity: จำนวนผู้ใช้สูงสุดในห้อง (Maximum users in room)
        creator_type: ประเภทผู้สร้าง - driver หรือ passenger
        transport_type: ประเภทยานพาหนะ (motorcycle, taxi, location, evmini)
    """
    room_name: str
    capacity: int
    creator_type: str
    transport_type: str


# ==============================================================================
# 3. CONNECTION MANAGER CLASS (คลาสจัดการการเชื่อมต่อ)
# ==============================================================================

class ConnectionManager:
    """
    คลาสหลักสำหรับจัดการการเชื่อมต่อ WebSocket และห้องแชท
    Main class for managing WebSocket connections and chat rooms
    
    หน้าที่หลัก (Main responsibilities):
    - จัดการการเชื่อมต่อ/ตัดการเชื่อมต่อ WebSocket
    - จัดการห้องแชท (สร้าง, ลบ, ย้ายผู้ใช้)
    - ส่งข้อความ broadcast ไปยังผู้ใช้ในห้อง
    - จัดการ timer สำหรับ transition ไปยัง ped_pong
    """

    # --------------------------------------------------------------------------
    # 3.1 INITIALIZATION (การเริ่มต้น)
    # --------------------------------------------------------------------------
    
    def __init__(self):
        """
        เริ่มต้น ConnectionManager พร้อมสร้างห้องพิเศษ duck_pond และ ped_pong
        Initialize ConnectionManager with special rooms duck_pond and ped_pong
        """
        # เก็บ WebSocket connections แยกตามห้อง
        # Store WebSocket connections by room
        self.active_connections: dict[str, list[WebSocket]] = {}
        
        # เก็บ usernames แยกตามห้อง  
        # Store usernames by room
        self.active_users: dict[str, list[str]] = {}
        
        # เก็บข้อมูลห้องทั้งหมด (capacity, transition time, etc.)
        # Store all room information
        self.available_rooms: dict[str, dict] = {}
        
        # เก็บ cleanup tasks ของแต่ละห้อง
        # Store cleanup tasks for each room
        self.room_cleanup_tasks: dict[str, Optional[asyncio.Task]] = {}
        
        # เก็บ transition timer tasks ของแต่ละห้อง
        # Store transition timer tasks for each room
        self.room_transition_tasks: dict[str, asyncio.Task] = {}
        
        # เก็บห้องเดิมของผู้ใช้ (สำหรับกลับไปหลังจาก ped_pong)
        # Store original rooms for users (for returning after ped_pong)
        self.original_rooms: dict[str, str] = {}

        # สร้างห้องพิเศษ duck_pond - ห้องสาธารณะถาวร
        # Create special room duck_pond - permanent public room
        self.available_rooms["duck_pond"] = {
            "capacity": 15,
            "next_transition": None,
            "is_special": True,
            "transport_type": None
        }
        
        # สร้างห้องพิเศษ ped_pong - ห้องพักระหว่างทาง
        # Create special room ped_pong - transit stop room
        self.available_rooms["ped_pong"] = {
            "capacity": 15,
            "next_transition": None,
            "is_special": True,
            "transport_type": None
        }

    # --------------------------------------------------------------------------
    # 3.2 CONNECTION MANAGEMENT (จัดการการเชื่อมต่อ)
    # --------------------------------------------------------------------------

    async def connect(self, websocket: WebSocket, room: str, username: str):
        """
        เชื่อมต่อ WebSocket เข้ากับห้องแชท
        Connect a WebSocket to a chat room
        
        Args:
            websocket: การเชื่อมต่อ WebSocket
            room: ชื่อห้องที่ต้องการเข้า
            username: ชื่อผู้ใช้
            
        Raises:
            HTTPException: ถ้าห้องไม่มีอยู่หรือห้องเต็ม
        """
        # ตรวจสอบว่าห้องมีอยู่หรือไม่
        # Check if room exists
        if room not in self.available_rooms:
            raise HTTPException(status_code=400, detail="Room does not exist")

        # ตรวจสอบว่าห้องเต็มหรือไม่
        # Check if room is full
        if (room in self.active_users and 
            len(self.active_users[room]) >= self.available_rooms[room]["capacity"]):
            raise HTTPException(status_code=400, detail="Room is full")

        # ยอมรับการเชื่อมต่อ WebSocket
        # Accept WebSocket connection
        await websocket.accept()

        # สร้าง list ใหม่ถ้าห้องยังไม่มี connections
        # Create new list if room has no connections yet
        if room not in self.active_connections:
            self.active_connections[room] = []
            self.active_users[room] = []

        # ยกเลิก cleanup task ถ้ามีคนเข้าห้อง
        # Cancel cleanup task if someone joins
        if room in self.room_cleanup_tasks and self.room_cleanup_tasks[room]:
            self.room_cleanup_tasks[room].cancel()
            self.room_cleanup_tasks[room] = None

        # เพิ่มผู้ใช้เข้าห้อง
        # Add user to room
        self.active_connections[room].append(websocket)
        self.active_users[room].append(username)

    async def disconnect(self, websocket: WebSocket, room: str):
        """
        ตัดการเชื่อมต่อ WebSocket จากห้องแชท
        Disconnect a WebSocket from a chat room
        
        Args:
            websocket: การเชื่อมต่อ WebSocket ที่จะตัด
            room: ชื่อห้องที่จะออก
        """
        if room in self.active_connections:
            if websocket in self.active_connections[room]:
                # หา index ของ websocket เพื่อหา username
                # Find websocket index to get username
                index = self.active_connections[room].index(websocket)
                username = self.active_users[room][index]
                
                # ลบ connection และ username ออกจากห้อง
                # Remove connection and username from room
                self.active_connections[room].remove(websocket)
                self.active_users[room].remove(username)

                # ลบ tracking ห้องเดิมของผู้ใช้
                # Clean up user's original room tracking
                if username in self.original_rooms:
                    del self.original_rooms[username]

                # แจ้งคนในห้องว่ามีคนออก
                # Notify room that someone left
                await self.broadcast(f"System: {username} has left the chat", room)
                await self.broadcast_user_list(room)

                # ลบห้องถ้าไม่มีคนเหลือ (ยกเว้นห้องพิเศษ)
                # Delete room if empty (except special rooms)
                if len(self.active_users[room]) == 0 and room not in ["duck_pond", "ped_pong"]:
                    if room in self.room_transition_tasks:
                        self.room_transition_tasks[room].cancel()
                        del self.room_transition_tasks[room]
                    # Clean up all room data
                    del self.available_rooms[room]
                    del self.active_connections[room]
                    del self.active_users[room]

    # --------------------------------------------------------------------------
    # 3.3 ROOM TRANSITION MANAGEMENT (จัดการการย้ายห้อง)
    # --------------------------------------------------------------------------

    async def move_users_to_ped_pong(self, room: str):
        """
        ย้ายผู้ใช้ทั้งหมดจากห้องหนึ่งไปยัง ped_pong (ป้ายพักรถ)
        Move all users from a room to ped_pong (transit stop)
        
        ฟังก์ชันนี้ถูกเรียกเมื่อ timer ของห้องหมดเวลา
        This function is called when room timer expires
        
        Args:
            room: ชื่อห้องที่จะย้ายผู้ใช้ออก
        """
        # ไม่ย้ายถ้าเป็นห้องพิเศษหรือไม่มี connections
        # Don't move if special room or no connections
        if room in ["ped_pong", "duck_pond"] or not self.active_connections.get(room):
            return

        # เก็บข้อมูลผู้ใช้ที่จะย้าย
        # Store users to move
        users_to_move = list(zip(self.active_connections[room], self.active_users[room]))

        # บันทึกห้องเดิมสำหรับทุกคน (เพื่อกลับมาได้)
        # Store original room for all users (for returning)
        for _, username in users_to_move:
            self.original_rooms[username] = room

        # เคลียร์ห้องปัจจุบัน
        # Clear current room
        self.active_connections[room] = []
        self.active_users[room] = []

        # ย้ายผู้ใช้แต่ละคนไป ped_pong
        # Move each user to ped_pong
        for websocket, username in users_to_move:
            try:
                # แจ้งผู้ใช้ว่ากำลังย้าย
                # Notify user about moving
                await websocket.send_text(f"System: Moving all users to ped pong...")
                await asyncio.sleep(0.1)  # รอให้ข้อความถูกส่ง

                # สร้าง list ใหม่ถ้า ped_pong ยังไม่มี
                # Create new list if ped_pong doesn't exist yet
                if "ped_pong" not in self.active_connections:
                    self.active_connections["ped_pong"] = []
                    self.active_users["ped_pong"] = []

                # เพิ่มผู้ใช้เข้า ped_pong
                # Add user to ped_pong
                self.active_connections["ped_pong"].append(websocket)
                self.active_users["ped_pong"].append(username)

                # ส่งคำสั่งให้ client เปลี่ยนห้อง
                # Send command to client to change room
                await websocket.send_text("System: ROOM_CHANGE:ped_pong")

                # แจ้งคนใน ped_pong ว่ามีคนเข้ามา
                # Notify ped_pong that someone joined
                await self.broadcast("System: " + username + " was moved from " + room, "ped_pong")
                await self.broadcast_user_list("ped_pong")

            except Exception as e:
                print(f"Error moving user {username}: {e}")

    async def move_back_to_original_room(self, username: str, websocket: WebSocket):
        """
        ย้ายผู้ใช้กลับไปห้องเดิม (หลังจากอยู่ที่ ped_pong)
        Move user back to their original room (after being at ped_pong)
        
        ผู้ใช้สามารถใช้คำสั่ง /return เพื่อกลับห้องเดิม
        User can use /return command to go back
        
        Args:
            username: ชื่อผู้ใช้ที่จะย้าย
            websocket: WebSocket connection ของผู้ใช้
            
        Returns:
            bool: True ถ้าย้ายสำเร็จ, False ถ้าไม่สำเร็จ
        """
        # ตรวจสอบว่ามีห้องเดิมบันทึกไว้หรือไม่
        # Check if original room is recorded
        if username not in self.original_rooms:
            return False

        original_room = self.original_rooms[username]
        current_room = None

        # หาห้องปัจจุบันของผู้ใช้
        # Find user's current room
        for room, connections in self.active_connections.items():
            if websocket in connections:
                current_room = room
                break

        # ไม่ย้ายถ้าอยู่ห้องเดิมแล้ว
        # Don't move if already in original room
        if not current_room or current_room == original_room:
            return False

        # ดำเนินการย้ายกลับห้องเดิม
        # Execute move back to original room
        try:
            # ลบจากห้องปัจจุบัน
            # Remove from current room
            if current_room in self.active_connections:
                self.active_connections[current_room].remove(websocket)
                self.active_users[current_room].remove(username)

            # เพิ่มเข้าห้องเดิม
            # Add to original room
            if original_room not in self.active_connections:
                self.active_connections[original_room] = []
                self.active_users[original_room] = []

            self.active_connections[original_room].append(websocket)
            self.active_users[original_room].append(username)

            # อัพเดท client
            # Update client
            await websocket.send_text(f"System: Moving back to {original_room}...")
            await websocket.send_text(f"System: ROOM_CHANGE:{original_room}")

            # แจ้งห้องเดิมว่ากลับมาแล้ว
            # Notify original room about return
            await self.broadcast(f"System: {username} has returned to the room", original_room)
            await self.broadcast_user_list(original_room)

            # ลบ tracking
            # Clean up tracking
            del self.original_rooms[username]

            return True
        except Exception as e:
            print(f"Error moving user back: {e}")
            return False

    async def start_room_transition_timer(self, room: str):
        """
        เริ่ม timer สำหรับย้ายผู้ใช้ไป ped_pong หลังจาก 3 นาที
        Start timer to move users to ped_pong after 3 minutes
        
        ห้องปกติจะมีเวลา 3 นาที หลังจากนั้นทุกคนจะถูกย้ายไป ped_pong
        Normal rooms have 3 minutes, after which everyone moves to ped_pong
        
        Args:
            room: ชื่อห้องที่จะตั้ง timer
        """
        # ไม่ตั้ง timer สำหรับห้องพิเศษ
        # Don't set timer for special rooms
        if room in ["duck_pond", "ped_pong"] or self.available_rooms[room].get("is_special"):
            return

        try:
            # บันทึกเวลา transition (3 นาทีจากตอนนี้)
            # Record transition time (3 minutes from now)
            next_transition = datetime.now() + timedelta(minutes=3)
            self.available_rooms[room]["next_transition"] = next_transition

            # รอ 2 นาที 40 วินาที แล้วเตือนผู้ใช้
            # Wait 2m 40s then warn users
            await asyncio.sleep(160)
            await self.broadcast(f"System: Room will transition to ped pong in 20 seconds!", room)

            # รอ 20 วินาทีสุดท้าย แล้วย้าย
            # Wait final 20 seconds then move
            await asyncio.sleep(20)
            await self.move_users_to_ped_pong(room)

        except asyncio.CancelledError:
            print(f"Room transition timer cancelled for {room}")
        except Exception as e:
            print(f"Error in transition timer for {room}: {e}")
            # พยายามย้ายผู้ใช้แม้มี error
            # Attempt to move users even if there's an error
            await self.move_users_to_ped_pong(room)

    # --------------------------------------------------------------------------
    # 3.4 ROOM INFORMATION (ข้อมูลห้อง)
    # --------------------------------------------------------------------------

    def get_time_remaining(self, room: str) -> Optional[int]:
        """
        คำนวณเวลาที่เหลือก่อน transition ไป ped_pong
        Calculate time remaining before transition to ped_pong
        
        Args:
            room: ชื่อห้อง
            
        Returns:
            จำนวนวินาทีที่เหลือ หรือ None ถ้าไม่มี timer
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
        นับจำนวนผู้ใช้ในห้อง
        Count users in a room
        
        Args:
            room: ชื่อห้อง
            
        Returns:
            จำนวนผู้ใช้ในห้อง
        """
        return len(self.active_users.get(room, []))

    def get_room_capacity(self, room: str) -> int:
        """
        ดึงความจุสูงสุดของห้อง
        Get room maximum capacity
        
        Args:
            room: ชื่อห้อง
            
        Returns:
            จำนวนผู้ใช้สูงสุดที่ห้องรองรับได้
        """
        return self.available_rooms.get(room, {}).get("capacity", 0)

    def get_random_active_room(self, transport_type: str, user_type: str) -> dict:
        """
        สุ่มหาห้องที่ว่างสำหรับผู้โดยสาร
        Find a random available room for passengers
        
        ฟังก์ชันนี้ใช้สำหรับ "Join Random Room" 
        เฉพาะ passenger เท่านั้นที่ใช้ได้
        
        Args:
            transport_type: ประเภทยานพาหนะที่ต้องการ
            user_type: ประเภทผู้ใช้ (passenger/driver)
            
        Returns:
            dict ข้อมูลห้องที่เลือก หรือ None ถ้าไม่มีห้องว่าง
        """
        # เฉพาะ passenger เท่านั้นที่ใช้ random join ได้
        # Only passengers can use random join
        if user_type != "passenger":
            return None

        available_rooms = []
        for room_name, room_info in self.available_rooms.items():
            # ตรวจสอบ transport_type และไม่ใช่ห้องพิเศษ
            # Check transport_type and not special room
            if (room_name not in ["duck_pond", "ped_pong"] and 
                room_info.get("transport_type") == transport_type):
                current_users = self.get_room_count(room_name)
                # ตรวจสอบว่ายังมีที่ว่าง
                # Check if there's still space
                if current_users < room_info["capacity"]:
                    available_rooms.append({
                        "room": room_name,
                        "capacity": room_info["capacity"],
                        "current_users": current_users,
                        "time_remaining": self.get_time_remaining(room_name)
                    })
        
        # สุ่มเลือกห้องจากที่มี
        # Randomly select from available rooms
        return random.choice(available_rooms) if available_rooms else None

    # --------------------------------------------------------------------------
    # 3.5 BROADCASTING (ส่งข้อความ)
    # --------------------------------------------------------------------------

    async def broadcast(self, message: str, room: str, exclude: WebSocket = None):
        """
        ส่งข้อความไปยังทุกคนในห้อง
        Send message to everyone in a room
        
        Args:
            message: ข้อความที่จะส่ง
            room: ชื่อห้อง
            exclude: WebSocket ที่ไม่ต้องส่งถึง (optional)
        """
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                if connection != exclude:
                    await connection.send_text(message)

    async def broadcast_user_list(self, room: str):
        """
        ส่งรายชื่อผู้ใช้ในห้องไปยังทุกคน
        Send user list to everyone in the room
        
        ข้อความจะแสดง: จำนวนผู้ใช้, รายชื่อ, และเวลาที่เหลือ
        Message shows: user count, names, and time remaining
        
        Args:
            room: ชื่อห้อง
        """
        if room in self.active_users:
            user_list = self.active_users[room]
            capacity = self.available_rooms[room]["capacity"]
            time_remaining = self.get_time_remaining(room)

            # สร้างข้อความสถานะ
            # Create status message
            status_msg = f"Active users ({len(user_list)}/{capacity}): {', '.join(user_list)}"
            if time_remaining is not None:
                status_msg += f" | Time remaining: {time_remaining//60}m {time_remaining%60}s"

            # ส่งไปยังทุกคน
            # Send to everyone
            for connection in self.active_connections[room]:
                await connection.send_text(status_msg)


# สร้าง instance ของ ConnectionManager
# Create ConnectionManager instance
manager = ConnectionManager()


# ==============================================================================
# 4. API ENDPOINTS (จุดเชื่อมต่อ API)
# ==============================================================================

@app.post("/rooms")
async def create_room(room: RoomCreate):
    """
    สร้างห้องแชทใหม่ (เฉพาะคนขับเท่านั้น)
    Create a new chat room (drivers only)
    
    Args:
        room: ข้อมูลห้องที่จะสร้าง (RoomCreate model)
        
    Returns:
        dict: สถานะและข้อมูลห้องที่สร้าง
        
    Raises:
        HTTPException 400: ถ้าห้องมีอยู่แล้ว หรือไม่ใช่คนขับ
    """
    # ตรวจสอบว่าห้องมีอยู่แล้วหรือไม่
    # Check if room already exists
    if room.room_name in manager.available_rooms:
        raise HTTPException(status_code=400, detail="Room already exists")
    
    # ตรวจสอบว่าเป็นคนขับหรือไม่
    # Check if creator is a driver
    if room.creator_type != "driver":
        raise HTTPException(status_code=400, detail="Only drivers can create rooms")

    # สร้างห้องใหม่
    # Create new room
    manager.available_rooms[room.room_name] = {
        "capacity": room.capacity,
        "next_transition": None,
        "is_special": False,
        "transport_type": room.transport_type
    }

    # เริ่ม transition timer สำหรับห้องใหม่
    # Start transition timer for new room
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
    หาห้องสุ่มที่ว่างสำหรับผู้โดยสาร
    Find a random available room for passengers
    
    Args:
        transport_type: ประเภทยานพาหนะ (query parameter)
        user_type: ประเภทผู้ใช้ (query parameter)
        
    Returns:
        dict: ข้อมูลห้อง หรือข้อความว่าไม่มีห้องว่าง
    """
    room = manager.get_random_active_room(transport_type, user_type)
    if room:
        return room
    return {"room": None, "message": "No suitable rooms available"}


@app.get("/rooms/debug")
async def debug_rooms():
    """
    แสดงข้อมูลทุกห้องสำหรับ debugging
    Show all room information for debugging
    
    Returns:
        dict: ข้อมูลทุกห้องในระบบ
    """
    if ENVIRONMENT != "development":
        raise HTTPException(status_code=404, detail="Not found")

    return {
        "rooms": {
            room_name: {
                "capacity": room_info["capacity"],
                "current_users": manager.get_room_count(room_name),
                "time_remaining": manager.get_time_remaining(room_name),
                "is_special": room_info.get("is_special", False),
                "transport_type": room_info.get("transport_type")
            }
            for room_name, room_info in manager.available_rooms.items()
        }
    }


# ==============================================================================
# 5. WEBSOCKET HANDLER (ตัวจัดการ WebSocket)
# ==============================================================================

@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):
    """
    WebSocket endpoint สำหรับเข้าร่วมห้องแชท
    WebSocket endpoint for joining a chat room
    
    Flow การทำงาน:
    1. เชื่อมต่อผู้ใช้เข้าห้อง
    2. แจ้งทุกคนในห้องว่ามีคนเข้ามา
    3. รอรับข้อความจากผู้ใช้และ broadcast
    4. จัดการ disconnect เมื่อผู้ใช้ออก
    
    Args:
        websocket: WebSocket connection
        room_id: ชื่อห้องที่จะเข้า
        username: ชื่อผู้ใช้
    """
    try:
        # เชื่อมต่อเข้าห้อง
        # Connect to room
        await manager.connect(websocket, room_id, username)
        
        # แจ้งทุกคนว่ามีคนเข้ามา
        # Notify everyone that someone joined
        await manager.broadcast(f"System: {username} has joined the chat", room_id)
        await manager.broadcast_user_list(room_id)
        
        # Loop รับข้อความ
        # Message receiving loop
        while True:
            data = await websocket.receive_text()

            # ตรวจสอบคำสั่ง /return สำหรับกลับห้องเดิม
            # Check for /return command to go back to original room
            if data.strip().lower() == "/return" and username in manager.original_rooms:
                success = await manager.move_back_to_original_room(username, websocket)
                if success:
                    continue
            
            # ส่งข้อความไปยังทุกคนในห้อง
            # Broadcast message to everyone in room
            await manager.broadcast(f"{username}: {data}", room_id)

    except WebSocketDisconnect:
        # ผู้ใช้ disconnect
        # User disconnected
        await manager.disconnect(websocket, room_id)
    except Exception as e:
        # จัดการ error อื่นๆ
        # Handle other errors
        print(f"Error in websocket connection: {e}")
        await manager.disconnect(websocket, room_id)
