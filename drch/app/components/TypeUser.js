/**
 * ================================================================================
 * TypeUser Component - ปุ่มเลือกประเภทผู้ใช้
 * ================================================================================
 * Component สำหรับให้ผู้ใช้เลือกว่าเป็น Passenger หรือ Driver
 * 
 * ประเภทผู้ใช้:
 * - Passenger (ผู้โดยสาร): สามารถเข้าร่วมห้องที่ Driver สร้างไว้
 * - Driver (คนขับ): สามารถสร้างห้องแชทใหม่ได้
 * ================================================================================
 */

import { User, Users } from 'lucide-react';
import "./transportselect.css"

// ==============================================================================
// COMPONENT DEFINITION (นิยาม Component)
// ==============================================================================

export default function TypeUser({
  // --------------------------------------------------------------------------
  // Props
  // --------------------------------------------------------------------------
  userType,           // ประเภทผู้ใช้ที่เลือก: 'passenger' | 'driver' | null
  onSelectUserType    // ฟังก์ชันเมื่อเลือกประเภท (Callback when type selected)
}) {

  // --------------------------------------------------------------------------
  // RENDER (แสดงผล)
  // --------------------------------------------------------------------------

  return (
    <div className="w-full">
      <div className="flex gap-2">

        {/* ===== PASSENGER BUTTON (ปุ่มผู้โดยสาร) ===== */}
        <button
          onClick={() => onSelectUserType('passenger')}
          className={`flex-1 rounded-lg overflow-hidden border ${userType === 'passenger' ? 'border-red-500' : 'border-gray-200'
            }`}
        >
          <div className={`flex items-center justify-center gap-2 py-2 px-3 w-full ${userType === 'passenger' ? 'bg-red-50' : 'bg-white'
            }`}>
            <User className={`w-5 h-6 ${userType === 'passenger' ? 'text-red-600' : 'text-gray-600'}`} />
            <span className={`text-sm ${userType === 'passenger' ? 'text-red-600' : 'text-gray-600'}`}>Passenger</span>
          </div>
        </button>

        {/* ===== DRIVER BUTTON (ปุ่มคนขับ) ===== */}
        <button
          onClick={() => onSelectUserType('driver')}
          className={`flex-1 rounded-lg overflow-hidden border ${userType === 'driver' ? 'border-red-500' : 'border-gray-200'
            }`}
        >
          <div className={`flex items-center justify-center gap-2 py-2 px-3 w-full ${userType === 'driver' ? 'bg-red-50' : 'bg-white'
            }`}>
            <Users className={`w-5 h-5 ${userType === 'driver' ? 'text-red-600' : 'text-gray-600'}`} />
            <span className={`text-sm ${userType === 'driver' ? 'text-red-600' : 'text-gray-600'}`}>Driver</span>
          </div>
        </button>
      </div>
    </div>
  );
}