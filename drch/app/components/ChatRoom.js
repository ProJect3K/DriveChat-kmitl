/**
 * ================================================================================
 * ChatRoom Component - ห้องแชท
 * ================================================================================
 * Component สำหรับแสดงห้องแชทหลังจากผู้ใช้เข้าร่วมแล้ว
 * แสดงวิดีโอ, ข้อความแชท, และ timer สำหรับการย้ายไป ped_pong
 *
 * โครงสร้างไฟล์:
 * 1. Imports & Props (การนำเข้าและ props)
 * 2. State Management (จัดการ state)
 * 3. Timer Logic (การจัดการ timer)
 * 4. Helper Functions (ฟังก์ชันช่วย)
 * 5. Render UI (แสดงผล)
 * ================================================================================
 */

import { useState, useEffect } from 'react';

// ==============================================================================
// COMPONENT DEFINITION (นิยาม Component)
// ==============================================================================

const ChatRoom = ({
  // --------------------------------------------------------------------------
  // Props ที่รับจาก Parent Component
  // --------------------------------------------------------------------------
  room,                    // ชื่อห้องปัจจุบัน (Current room name)
  setRoom,                 // ฟังก์ชันเปลี่ยนห้อง (Function to change room)
  activeUsers = [],        // รายชื่อผู้ใช้ในห้อง (Users in room)
  roomCapacity,            // ความจุห้อง (Room capacity)
  username,                // ชื่อผู้ใช้ (Username)
  messages,                // ข้อความทั้งหมด (All messages)
  inputMessage,            // ข้อความที่กำลังพิมพ์ (Current input)
  setInputMessage,         // ฟังก์ชันอัพเดทข้อความ (Update input function)
  sendMessage,             // ฟังก์ชันส่งข้อความ (Send message function)
  nextStation = "ped pong", // สถานีถัดไป (Next station)
  currentStatus = "Driving", // สถานะปัจจุบัน (Current status)
}) => {

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT (จัดการ state ภายใน)
  // --------------------------------------------------------------------------

  // เวลาที่เหลือก่อน transition (วินาที)
  // Time remaining before transition (seconds)
  const [timeRemaining, setTimeRemaining] = useState(120);

  // สถานะปัจจุบัน (Driving/ped pong)
  // Current status (Driving/ped pong)
  const [localStatus, setLocalStatus] = useState(currentStatus);

  // สถานีถัดไป
  // Next station
  const [localNextStation, setLocalNextStation] = useState(nextStation);

  // ห้องก่อนหน้า (สำหรับกลับมา)
  // Previous room (for returning)
  const [previousRoom, setPreviousRoom] = useState("");

  // URL วิดีโอที่แสดง
  // Video URL to display
  const [vdoChat, setVdoChat] = useState("");

  // --------------------------------------------------------------------------
  // HELPER: MESSAGE ALIGNMENT (จัดตำแหน่งข้อความ)
  // --------------------------------------------------------------------------

  /**
   * กำหนด CSS class สำหรับจัดตำแหน่งข้อความ
   * Determine CSS class for message alignment
   * 
   * @param {boolean} isSystemMessage - เป็นข้อความ System หรือไม่
   * @param {string} username - ชื่อผู้ใช้ปัจจุบัน
   * @param {string} sender - ชื่อผู้ส่ง
   * @returns {string} CSS class
   */
  const getAlignmentClass = (isSystemMessage, username, sender) => {
    if (isSystemMessage) {
      return 'items-center';  // ข้อความ System อยู่ตรงกลาง
    } else if (username === sender) {
      return 'items-end';     // ข้อความของเราอยู่ขวา
    } else {
      return 'items-start';   // ข้อความคนอื่นอยู่ซ้าย
    }
  };

  // --------------------------------------------------------------------------
  // EFFECT: ROOM TRANSITION TIMER (จับเวลาย้ายห้อง)
  // --------------------------------------------------------------------------

  /**
   * Timer สำหรับนับถอยหลัง และย้ายผู้ใช้ไป ped_pong เมื่อหมดเวลา
   * Timer for countdown and moving users to ped_pong when time is up
   */
  useEffect(() => {
    let timer;

    // ไม่นับเวลาถ้าอยู่ที่ duck_pond
    // Don't count if at duck_pond
    if (room !== 'duck_pond' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);

          // เมื่อหมดเวลา - ย้ายไป ped_pong
          // When time is up - move to ped_pong
          if (newTime === 0) {
            setPreviousRoom(room);               // บันทึกห้องเดิม
            setLocalStatus("ped pong");          // อัพเดทสถานะ
            setLocalNextStation(room);           // ตั้งห้องเดิมเป็น next station
            setRoom('ped_pong');                 // เปลี่ยนไป ped_pong
          }
          return newTime;
        });
      }, 1000);
    }

    // Cleanup timer
    return () => clearInterval(timer);
  }, [room, timeRemaining, setRoom]);

  // --------------------------------------------------------------------------
  // EFFECT: STATUS UPDATE ON ROOM CHANGE (อัพเดทสถานะเมื่อเปลี่ยนห้อง)
  // --------------------------------------------------------------------------

  /**
   * อัพเดทสถานะเมื่อเข้า/ออก ped_pong
   * Update status when entering/leaving ped_pong
   */
  useEffect(() => {
    if (room === 'ped_pong') {
      // อยู่ที่ ped_pong
      setLocalStatus("ped pong");
      setLocalNextStation(previousRoom || "Return to travel");
    } else if (previousRoom && room === previousRoom) {
      // กลับมาห้องเดิม
      setLocalStatus("Driving");
      setLocalNextStation("ped pong");
    }
  }, [room, previousRoom]);

  // --------------------------------------------------------------------------
  // EFFECT: VIDEO SELECTION (เลือกวิดีโอตามประเภทห้อง)
  // --------------------------------------------------------------------------

  /**
   * เลือกวิดีโอที่จะแสดงตามความจุห้อง/ประเภทห้อง
   * Select video to display based on room capacity/type
   */
  useEffect(() => {
    if (room === 'ped_pong') {
      setVdoChat("/videos/duck.mp4");      // ป้ายพักรถ - เป็ด
    } else {
      // เลือกตามความจุ (capacity)
      if (roomCapacity === 2) {
        setVdoChat("/videos/bike.mp4");     // มอเตอร์ไซค์
      } else if (roomCapacity === 4) {
        setVdoChat("/videos/car.mp4");      // รถแท็กซี่
      } else if (roomCapacity === 10) {
        setVdoChat("/videos/songthaew.mp4"); // สองแถว
      } else if (roomCapacity === 15) {
        setVdoChat("/videos/EvBus.mp4");    // รถ EV
      }
    }
  }, [room, roomCapacity]);

  // --------------------------------------------------------------------------
  // HELPER: FORMAT TIME (จัดรูปแบบเวลา)
  // --------------------------------------------------------------------------

  /**
   * แปลงวินาทีเป็นรูปแบบที่อ่านง่าย
   * Convert seconds to readable format
   * 
   * @param {number} seconds - จำนวนวินาที
   * @returns {string} เช่น "2 Minute 30 Seconds to change"
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} Minute ${remainingSeconds} Seconds to change`;
  };

  // --------------------------------------------------------------------------
  // HELPER: ROOM DISPLAY NAME (ชื่อห้องที่แสดง)
  // --------------------------------------------------------------------------

  /**
   * แปลงชื่อห้องเป็นชื่อที่อ่านง่าย
   * Convert room name to readable format
   * 
   * @returns {string} ชื่อห้องที่ format แล้ว
   */
  const getRoomDisplayName = () => {
    if (room === 'ped_pong') return 'Ped Pong';
    if (room === 'duck_pond') return 'Duck Pond';

    // ห้องทั่วไป: แยก transport type และชื่อ
    const parts = room.split('_');
    if (parts.length > 2) {
      const transportType = parts[0];
      const displayName = parts.slice(2).join('_');
      return `${transportType} - ${displayName}`;
    }
    return room;
  };

  // จำนวนผู้ใช้ในห้อง
  const activeUserCount = Array.isArray(activeUsers) ? activeUsers.length : 0;

  // --------------------------------------------------------------------------
  // RENDER UI (แสดงผล)
  // --------------------------------------------------------------------------

  return (
    <div className="relative min-h-screen bg-[#6D81A9] p-4">

      {/* ===== STATUS BAR (แถบสถานะด้านบน) ===== */}
      <div className="flex justify-between items-center mb-4 bg-white rounded-lg p-4 shadow-sm">
        {/* สถานะปัจจุบันและสถานีถัดไป */}
        <div className="space-y-1">
          <div className="text-lg font-semibold">Next Station: {localNextStation}</div>
          <div className="text-lg">Now: {localStatus}</div>
        </div>

        {/* เวลาที่เหลือ (ไม่แสดงสำหรับห้องพิเศษ) */}
        <div className="text-right">
          {room !== 'duck_pond' && room !== 'ped_pong' && (
            <div className="text-lg">TIME REMAINING: {formatTime(timeRemaining)}</div>
          )}
        </div>
      </div>

      {/* ===== MAIN CONTENT (วิดีโอ + แชท) ===== */}
      <div className="flex gap-4 h-[calc(100vh-200px)]">

        {/* ----- VIDEO SECTION (ส่วนวิดีโอ) ----- */}
        <div className="w-1/2 bg-white rounded-lg shadow-lg p-4 flex-grow-0 basis-2/3">
          <video src={vdoChat} autoPlay loop className='h-full w-full' />
        </div>

        {/* ----- CHAT SECTION (ส่วนแชท) ----- */}
        <div className="w-1/2 bg-[#E4E9F3] rounded-lg shadow-lg p-4 flex flex-col flex-grow-0 basis-1/3 bg-[#E4E9F3]">

          {/* Header - ชื่อห้องและจำนวนผู้ใช้ */}
          <div className="border-b pb-2 mb-4">
            <h2 className="text-xl font-bold">Room: {getRoomDisplayName()}</h2>
            <div className="text-sm text-gray-600">
              user seat: {activeUserCount}/{roomCapacity}
            </div>
          </div>

          {/* Messages - รายการข้อความ */}
          <div className="flex-1 overflow-y-auto mb-4 px-4 space-y-4">
            {messages.map((msg, index) => {
              // ตรวจสอบว่าเป็นข้อความ System หรือไม่
              const isSystemMessage = msg.startsWith("System:");
              const messageParts = isSystemMessage ?
                ["System", msg.substring(7)] :
                msg.split(":");
              const sender = messageParts[0];
              const content = messageParts.slice(1).join(":");

              // ซ่อนข้อความ ROOM_CHANGE
              if (content.trim().startsWith("ROOM_CHANGE:")) {
                return null;
              }

              return (
                <div
                  key={index}
                  className={`flex flex-col ${getAlignmentClass(isSystemMessage, username, sender)}`}
                >
                  {/* ชื่อผู้ส่ง (ไม่แสดงสำหรับ System) */}
                  {!isSystemMessage && (
                    <div className="text-xs text-gray-600 mb-1 px-2">
                      {sender}
                    </div>
                  )}

                  {/* กล่องข้อความ */}
                  <div className={`rounded-lg p-3 max-w-[80%] break-words
                    ${isSystemMessage
                      ? 'bg-gray-100 text-gray-00 text-center w-full text-xs'
                      : 'bg-blue-300 font-semibold'}`}
                  >
                    {content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input - ช่องพิมพ์ข้อความ */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="chat message"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#D9D9D9]"
              />
              <button
                onClick={sendMessage}
                className="px-6 py-2 bg-amber-400 text-black rounded-lg hover:bg-amber-500 transition-colors"
              >
                send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LEAVE BUTTON (ปุ่มออกจากห้อง) ===== */}
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        LEAVE CHAT
      </button>
    </div>
  );
};

export default ChatRoom;