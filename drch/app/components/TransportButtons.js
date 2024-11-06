import { Bus, Car, MapPin, Bike, User, Users } from 'lucide-react';
import { ROOM_TYPES } from 'app/lib/constants';

export default function TransportButtons({ 
  onSelectType, 
  selectedType,
  userType,
  onSelectUserType 
}) {
  return (
    <div className="space-y-4 w-full mb-4">
      {/* User Type Selection */}
      <div className="w-full">
        <h3 className="text-sm font-medium text-gray-700 mb-2">I am a:</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => onSelectUserType('passenger')}
            className={`flex-1 rounded-lg overflow-hidden border ${
              userType === 'passenger' ? 'border-green-500' : 'border-gray-200'
            }`}
          >
            <div className={`flex items-center justify-center gap-2 py-2 px-3 w-full ${
              userType === 'passenger' ? 'bg-green-50' : 'bg-white'
            }`}>
              <User className={`w-5 h-5 ${userType === 'passenger' ? 'text-green-600' : 'text-gray-600'}`} />
              <span className={`text-sm ${userType === 'passenger' ? 'text-green-600' : 'text-gray-600'}`}>Passenger</span>
            </div>
          </button>

          <button 
            onClick={() => onSelectUserType('driver')}
            className={`flex-1 rounded-lg overflow-hidden border ${
              userType === 'driver' ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <div className={`flex items-center justify-center gap-2 py-2 px-3 w-full ${
              userType === 'driver' ? 'bg-blue-50' : 'bg-white'
            }`}>
              <Users className={`w-5 h-5 ${userType === 'driver' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`text-sm ${userType === 'driver' ? 'text-blue-600' : 'text-gray-600'}`}>Driver</span>
            </div>
          </button>
        </div>
      </div>

      {/* Transport Type Selection */}
      <div className="w-full">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Transport type:</h3>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button 
              onClick={() => onSelectType(ROOM_TYPES.BIKE)}
              disabled={!userType}
              className={`flex-1 rounded-lg overflow-hidden border ${
                selectedType === ROOM_TYPES.BIKE ? 'border-blue-500' : 'border-gray-200'
              } ${!userType && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`flex items-center gap-2 py-2 px-3 w-full ${
                selectedType === ROOM_TYPES.BIKE ? 'bg-blue-50' : 'bg-white'
              }`}>
                <Bike className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">มอเตอร์ไซค์</span>
              </div>
            </button>

            <button 
              onClick={() => onSelectType(ROOM_TYPES.CAR)}
              disabled={!userType}
              className={`flex-1 rounded-lg overflow-hidden border ${
                selectedType === ROOM_TYPES.CAR ? 'border-orange-500' : 'border-gray-200'
              } ${!userType && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`flex items-center gap-2 py-2 px-3 w-full ${
                selectedType === ROOM_TYPES.CAR ? 'bg-orange-100' : 'bg-white'
              }`}>
                <Car className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-orange-500">แท็กซี่</span>
              </div>
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onSelectType(ROOM_TYPES.LOCATION)}
              disabled={!userType}
              className={`flex-1 rounded-lg overflow-hidden border ${
                selectedType === ROOM_TYPES.LOCATION ? 'border-blue-500' : 'border-gray-200'
              } ${!userType && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`flex items-center gap-2 py-2 px-3 w-full ${
                selectedType === ROOM_TYPES.LOCATION ? 'bg-blue-50' : 'bg-white'
              }`}>
                <MapPin className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">สองแถว</span>
              </div>
            </button>

            <button 
              onClick={() => onSelectType(ROOM_TYPES.BUS)}
              disabled={!userType}
              className={`flex-1 rounded-lg overflow-hidden border ${
                selectedType === ROOM_TYPES.BUS ? 'border-blue-500' : 'border-gray-200'
              } ${!userType && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`flex items-center gap-2 py-2 px-3 w-full ${
                selectedType === ROOM_TYPES.BUS ? 'bg-blue-50' : 'bg-white'
              }`}>
                <Bus className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Ev มินิบัส</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}