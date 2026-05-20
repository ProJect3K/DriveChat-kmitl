/**
 * ================================================================================
 * JoinChat Component - หน้าเข้าร่วมห้องแชท
 * ================================================================================
 * Component สำหรับให้ผู้ใช้เลือกประเภท, สร้างห้อง หรือเข้าร่วมห้องที่มีอยู่
 * 
 * Flow การใช้งาน:
 * 1. ใส่ username และเลือก Passenger/Driver
 * 2. เลือกประเภทยานพาหนะ
 * 3. Passenger: กดปุ่ม "Join Random Room" เพื่อเข้าห้องสุ่ม
 *    Driver: กดปุ่ม "Create New Room" เพื่อสร้างห้องใหม่
 *
 * โครงสร้างไฟล์:
 * 1. Imports & Props (การนำเข้าและ props)
 * 2. State Management (จัดการ state)
 * 3. Handler Functions (ฟังก์ชันจัดการ events)
 * 4. API Functions (ฟังก์ชันเรียก API)
 * 5. Render UI (แสดงผล)
 * ================================================================================
 */

import { useState } from 'react';
import { ROOM_TYPES } from '../lib/constants';
import TransportButtons from './TransportButtons';
import TypeUser from './TypeUser';
import Image from 'next/image';

// ==============================================================================
// COMPONENT DEFINITION (นิยาม Component)
// ==============================================================================

export default function JoinChat({
  // --------------------------------------------------------------------------
  // Props ที่รับจาก Parent Component
  // --------------------------------------------------------------------------
  username,              // ชื่อผู้ใช้ (Username)
  setUsername,           // ฟังก์ชันอัพเดทชื่อ (Update username)
  isCreatingRoom,        // กำลังสร้างห้องหรือไม่ (Is creating room?)
  setIsCreatingRoom,     // ฟังก์ชันเปลี่ยนโหมดสร้างห้อง
  selectedType,          // ประเภทยานพาหนะที่เลือก (Selected transport type)
  setSelectedType,       // ฟังก์ชันเลือกประเภท
  roomName,              // ชื่อห้อง (Room name)
  setRoomName,           // ฟังก์ชันอัพเดทชื่อห้อง
  customRoom,            // ห้องที่กำหนดเอง
  setCustomRoom,         // ฟังก์ชันอัพเดทห้องที่กำหนดเอง
  isLoading,             // กำลังโหลดหรือไม่
  setIsLoading,          // ฟังก์ชันเปลี่ยนสถานะโหลด
  room,                  // ห้องปัจจุบัน
  setRoom,               // ฟังก์ชันเปลี่ยนห้อง
  setRoomCapacity,       // ฟังก์ชันตั้งความจุห้อง
  joinChat,              // ฟังก์ชันเข้าร่วมห้อง
}) {

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT (จัดการ state ภายใน)
  // --------------------------------------------------------------------------

  // ประเภทผู้ใช้: 'passenger' หรือ 'driver'
  // User type: 'passenger' or 'driver'
  const [userType, setUserType] = useState(null);

  // ไม่มีห้องว่างหรือไม่
  // No rooms available?
  const [noRoomsAvailable, setNoRoomsAvailable] = useState(false);

  // ชื่อห้องที่จะแสดง/สร้าง
  // Room display name
  const [roomDisplayName, setRoomDisplayName] = useState("");

  // --------------------------------------------------------------------------
  // HELPER: GET CAPACITY BY TYPE (ดึงความจุตามประเภทยานพาหนะ)
  // --------------------------------------------------------------------------

  /**
   * ดึงความจุห้องตามประเภทยานพาหนะ
   * Get room capacity based on transport type
   * 
   * @param {string} type - ประเภทยานพาหนะ
   * @returns {number} ความจุห้อง
   */
  const getCapacityByType = (type) => {
    switch (type) {
      case ROOM_TYPES.BIKE: return 2;      // มอเตอร์ไซค์ 2 คน
      case ROOM_TYPES.CAR: return 4;       // รถแท็กซี่ 4 คน
      case ROOM_TYPES.LOCATION: return 10; // สองแถว 10 คน
      case ROOM_TYPES.BUS: return 15;      // EV/Minibus 15 คน
      default: return 4;
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER FUNCTIONS (ฟังก์ชันจัดการ events)
  // --------------------------------------------------------------------------

  /**
   * จัดการเมื่อเลือกประเภทยานพาหนะ
   * Handle transport type selection
   */
  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setNoRoomsAvailable(false);
  };

  /**
   * จัดการเมื่อเลือกประเภทผู้ใช้ (Passenger/Driver)
   * Handle user type selection (Passenger/Driver)
   */
  const handleUserTypeSelect = (type) => {
    setUserType(type);

    // ถ้าเป็น passenger ให้ reset ประเภทยานพาหนะ
    // If passenger, reset transport type
    if (type === 'passenger') {
      setSelectedType(null);
    }

    setIsCreatingRoom(false);
    setNoRoomsAvailable(false);
  };

  /**
   * จัดการเมื่อพิมพ์ชื่อห้อง
   * Handle room name input
   */
  const handleRoomNameChange = (e) => {
    const value = e.target.value;
    setRoomDisplayName(value);
  };

  // --------------------------------------------------------------------------
  // API: JOIN RANDOM ROOM (เข้าร่วมห้องสุ่ม)
  // --------------------------------------------------------------------------

  /**
   * เข้าร่วมห้องสุ่มที่ว่าง (เฉพาะ Passenger)
   * Join a random available room (Passenger only)
   */
  const joinRandomRoom = async () => {
    // ตรวจสอบข้อมูลที่ต้องการ
    // Validate required data
    if (!username || !selectedType || !userType) {
      alert('Please enter a username, select your role, and select a transport type');
      return;
    }

    setIsLoading(true);
    try {
      // เรียก API หาห้องสุ่ม
      // Call API to find random room
      const response = await fetch(`http://127.0.0.1:8000/rooms/random?transport_type=${selectedType}&user_type=${userType}`);
      const data = await response.json();

      if (data.room) {
        // พบห้องว่าง - เข้าร่วม
        // Found available room - join it
        console.log('Joining room:', data.room);
        setRoom(data.room);
        setRoomCapacity(data.capacity);
        joinChat(data.room);
      } else {
        // ไม่พบห้องว่าง
        // No rooms available
        setNoRoomsAvailable(true);
      }
    } catch (error) {
      console.error('Error joining random room:', error);
      alert('Error joining room. Please try again.');
    }
    setIsLoading(false);
  };

  // --------------------------------------------------------------------------
  // API: CREATE ROOM (สร้างห้องใหม่)
  // --------------------------------------------------------------------------

  /**
   * สร้างห้องแชทใหม่ (เฉพาะ Driver)
   * Create a new chat room (Driver only)
   */
  const createRoom = async () => {
    // ตรวจสอบว่าเป็น driver หรือไม่
    // Validate that user is a driver
    if (!username || !selectedType || !userType || userType !== 'driver') {
      alert('Only drivers can create rooms. Please check your selections.');
      return;
    }

    // ตรวจสอบชื่อห้อง
    // Validate room name
    if (!roomDisplayName.trim()) {
      alert('Please enter a room name');
      return;
    }

    setIsLoading(true);
    try {
      const capacity = getCapacityByType(selectedType);

      // เรียก API สร้างห้อง
      // Call API to create room
      const response = await fetch('http://127.0.0.1:8000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_name: roomDisplayName,
          transport_type: selectedType,
          capacity: capacity,
          creator_type: userType,
          display_name: roomDisplayName
        }),
      });

      if (response.ok) {
        // สร้างสำเร็จ - เข้าร่วมห้อง
        // Created successfully - join the room
        const data = await response.json();
        setRoom(roomDisplayName);
        setRoomCapacity(data.capacity);
        setIsCreatingRoom(false);
        joinChat(roomDisplayName);
      } else {
        // เกิดข้อผิดพลาด
        // Error occurred
        const error = await response.json();
        alert(error.detail);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error creating room. Please try again.');
    }
    setIsLoading(false);
  };

  // --------------------------------------------------------------------------
  // RENDER UI (แสดงผล)
  // --------------------------------------------------------------------------

  return (
    <>
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-lightbrown">DriveChat@kmitl</h2>

        {/* ===== USERNAME & USER TYPE SECTION ===== */}
        {/* ===== ส่วนใส่ชื่อและเลือกประเภทผู้ใช้ ===== */}
        <div className="w-full flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
          />
          <div className="w-2/5">
            <TypeUser
              userType={userType}
              onSelectUserType={handleUserTypeSelect}
            />
          </div>
        </div>

        {/* ===== ROOM CREATION FORM (สำหรับ Driver) ===== */}
        {isCreatingRoom && userType === 'driver' ? (
          <div className="w-full space-y-4">
            <h3 className="text-lg font-medium">Create New Room</h3>

            {/* ช่องใส่ชื่อห้อง */}
            <input
              type="text"
              placeholder="Enter room name"
              value={roomDisplayName}
              onChange={handleRoomNameChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* ปุ่มเลือกประเภทยานพาหนะ */}
            <TransportButtons
              onSelectType={handleTypeSelect}
              selectedType={selectedType}
              userType={userType}
            />

            {/* ปุ่ม Create & Cancel */}
            <div className="flex gap-3">
              <button
                onClick={createRoom}
                disabled={isLoading || !username || !selectedType || !roomDisplayName.trim()}
                className="flex-1 px-4 py-2 bg-amber-400 text-black rounded-lg hover:bg-amber-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create & Join Room'}
              </button>
              <button
                onClick={() => {
                  setIsCreatingRoom(false);
                  setRoomDisplayName("");
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ===== ROOM JOINING INTERFACE (สำหรับทั้ง Passenger และ Driver) ===== */
          <div className="w-full space-y-4">
            {/* ปุ่มเลือกประเภทยานพาหนะ */}
            <TransportButtons
              onSelectType={handleTypeSelect}
              selectedType={selectedType}
              userType={userType}
            />

            {/* แจ้งเตือนไม่มีห้องว่าง */}
            {noRoomsAvailable && userType === 'passenger' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                No available rooms for this transport type. Please try another type or wait for a driver to create a room.
              </div>
            )}

            {/* ปุ่ม Action */}
            <div className="flex gap-3">
              {/* Passenger: ปุ่มเข้าห้องสุ่ม */}
              {userType === 'passenger' && (
                <button
                  onClick={joinRandomRoom}
                  disabled={isLoading || !username || !selectedType}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Finding room...' : 'Join Random Room'}
                </button>
              )}

              {/* Driver: ปุ่มสร้างห้องใหม่ */}
              {userType === 'driver' && (
                <button
                  onClick={() => {
                    setIsCreatingRoom(true);
                    setRoomDisplayName("");
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-amber-400 text-black rounded-lg hover:bg-amber-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Create New Room
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}