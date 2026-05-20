/**
 * Constants - ค่าคงที่ของแอปพลิเคชัน
 * เก็บประเภทห้อง/ยานพาหนะ ที่ใช้ทั่วทั้งแอป
 */

// ประเภทห้องแชทตามยานพาหนะ (ต้องตรงกับ Backend)
export const ROOM_TYPES = {
  BIKE: 'motorcycle',    // มอเตอร์ไซค์ - 2 คน
  CAR: 'taxi',           // แท็กซี่ - 4 คน
  LOCATION: 'location',  // สองแถว - 10 คน
  BUS: 'evmini'          // EV/Minibus - 15 คน
};