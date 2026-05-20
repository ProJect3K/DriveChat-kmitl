/**
 * ================================================================================
 * DriveChat@KMITL - Main Page Component
 * ================================================================================
 * หน้าหลักของแอปพลิเคชัน DriveChat@KMITL
 * ทำหน้าที่จัดการ state หลักและ WebSocket connection
 *
 * โครงสร้างไฟล์:
 * 1. Imports & State Management (การนำเข้าและจัดการ state)
 * 2. WebSocket Logic (การเชื่อมต่อ WebSocket)
 * 3. Message Handling (การจัดการข้อความ)
 * 4. Render Component (แสดงผลหน้าจอ)
 * ================================================================================
 */

'use client';

// ==============================================================================
// 1. IMPORTS (การนำเข้า)
// ==============================================================================

import { useState, useRef } from 'react';
import ChatRoom from 'app/components/ChatRoom';
import JoinChat from 'app/components/JoinChat';
import { buildWsUrl } from 'app/lib/config';
import Image from 'next/image';

// ==============================================================================
// 2. MAIN COMPONENT (คอมโพเนนต์หลัก)
// ==============================================================================

export default function Home() {
  // --------------------------------------------------------------------------
  // 2.1 STATE MANAGEMENT (จัดการ state)
  // --------------------------------------------------------------------------

  // ข้อความในห้องแชท (Chat messages)
  const [messages, setMessages] = useState([]);

  // ข้อความที่กำลังพิมพ์ (Current input message)
  const [inputMessage, setInputMessage] = useState("");

  // ชื่อผู้ใช้ (Username)
  const [username, setUsername] = useState("");

  // ชื่อห้องปัจจุบัน (Current room name)
  const [room, setRoom] = useState("");

  // ห้องที่กำหนดเอง (Custom room name)
  const [customRoom, setCustomRoom] = useState("");

  // สถานะการเข้าร่วมห้อง (Is user joined a room?)
  const [isJoined, setIsJoined] = useState(false);

  // รายชื่อผู้ใช้ในห้อง (Active users in room)
  const [activeUsers, setActiveUsers] = useState([]);

  // กำลังสร้างห้องใหม่หรือไม่ (Is creating new room?)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // กำลังโหลดหรือไม่ (Is loading?)
  const [isLoading, setIsLoading] = useState(false);

  // ประเภทยานพาหนะที่เลือก (Selected transport type)
  const [selectedType, setSelectedType] = useState(null);

  // ความจุของห้อง (Room capacity)
  const [roomCapacity, setRoomCapacity] = useState(0);

  // ชื่อห้องที่แสดง (Room display name)
  const [roomName, setRoomName] = useState("");

  // WebSocket reference
  const socket = useRef(null);

  // --------------------------------------------------------------------------
  // 2.2 WEBSOCKET LOGIC (การจัดการ WebSocket)
  // --------------------------------------------------------------------------

  /**
   * เชื่อมต่อเข้าห้องแชทผ่าน WebSocket
   * Connect to chat room via WebSocket
   * 
   * @param {string} roomToJoin - ชื่อห้องที่จะเข้าร่วม
   */
  const joinChat = (roomToJoin) => {
    // ตรวจสอบว่ามี username และ room
    // Validate username and room
    if (username && roomToJoin) {
      // สร้าง WebSocket connection
      // Create WebSocket connection
      const encodedRoom = encodeURIComponent(roomToJoin);
      const encodedUsername = encodeURIComponent(username);
      socket.current = new WebSocket(buildWsUrl(`/ws/${encodedRoom}/${encodedUsername}`));

      // ---------- Handle incoming messages ----------
      // จัดการข้อความที่เข้ามา
      socket.current.onmessage = function (event) {
        const message = event.data;

        // อัพเดทรายชื่อผู้ใช้
        // Update active users list
        if (message.startsWith("Active users")) {
          const usersPart = message.split(": ")[1];
          const users = usersPart.split(", ");
          setActiveUsers(users);
        }
        // จัดการการเปลี่ยนห้อง (เช่น ย้ายไป ped_pong)
        // Handle room change (e.g., move to ped_pong)
        else if (message.startsWith("System: ROOM_CHANGE:")) {
          const newRoom = message.split(":")[2];
          setRoom(newRoom);
          // ปิด connection เดิมและเชื่อมต่อห้องใหม่
          // Close old connection and connect to new room
          socket.current.close();
          joinChat(newRoom);
        }
        // ข้อความปกติ
        // Normal message
        else {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      };

      // ---------- Handle connection close ----------
      // จัดการเมื่อ connection ปิด
      socket.current.onclose = function (event) {
        if (event.reason) {
          alert(event.reason);
        }
        setIsJoined(false);
        setActiveUsers([]);
      };

      // ---------- Handle connection open ----------
      // จัดการเมื่อเชื่อมต่อสำเร็จ
      socket.current.onopen = function () {
        setIsJoined(true);
      };
    }
  };

  // --------------------------------------------------------------------------
  // 2.3 MESSAGE HANDLING (การจัดการข้อความ)
  // --------------------------------------------------------------------------

  /**
   * ส่งข้อความไปยังห้องแชท
   * Send message to chat room
   */
  const sendMessage = () => {
    if (inputMessage !== "" && socket.current) {
      socket.current.send(inputMessage);
      setInputMessage("");
    }
  };

  /**
   * เปลี่ยนห้องแชท (สำหรับกรณีพิเศษ เช่น duck_pond)
   * Change chat room (for special cases like duck_pond)
   * 
   * @param {string} newRoom - ชื่อห้องใหม่
   */
  const handleRoomChange = (newRoom) => {
    setRoom(newRoom);
    if (newRoom === 'duck_pond') {
      // เชื่อมต่อใหม่สำหรับ duck_pond
      // Reconnect for duck_pond
      socket.current.close();
      joinChat('duck_pond');
    }
  };

  // --------------------------------------------------------------------------
  // 2.4 RENDER (แสดงผล)
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[url('/images/ต้นไม้มมม1.png')] bg-cover bg-center bg-fixed ">
      <div className="min-h-screen bg-lightCream/85 p-6" >
        <div className="max-w-7xl mx-auto p-6 bg-white/90 rounded-xl shadow-xl">

          {/* ===== แสดง JoinChat หรือ ChatRoom ตามสถานะ ===== */}
          {/* ===== Show JoinChat or ChatRoom based on status ===== */}
          {!isJoined ? (
            // ---------- หน้า Join Chat ----------
            // ---------- Join Chat Page ----------
            <JoinChat
              username={username}
              setUsername={setUsername}
              isCreatingRoom={isCreatingRoom}
              setIsCreatingRoom={setIsCreatingRoom}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              roomName={roomName}
              setRoomName={setRoomName}
              customRoom={customRoom}
              setCustomRoom={setCustomRoom}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              room={room}
              setRoom={setRoom}
              setRoomCapacity={setRoomCapacity}
              joinChat={joinChat}
            />

          ) : (
            // ---------- หน้า Chat Room ----------
            // ---------- Chat Room Page ----------
            <ChatRoom
              room={room}
              setRoom={handleRoomChange}
              activeUsers={activeUsers}
              roomCapacity={roomCapacity}
              username={username}
              messages={messages}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              sendMessage={sendMessage}
              nextStation="ped pong"
              currentStatus="Driving"
            />
          )}
        </div>

        {/* ===== รูปป้ายรถเมล์ (แสดงเฉพาะหน้า Join) ===== */}
        {/* ===== Bus Stop Image (shown only on Join page) ===== */}
        <div className="">
          {!isJoined ? (
            <div className='max-w-screen-md mx-auto flex justify-center items-center my-6'>
              <Image
                src="/images/busstop.png"
                width={500}
                height={300}
                style={{ width: '100%', height: 'auto' }}
                alt="Bus Stop"
              />
            </div>

          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
}
