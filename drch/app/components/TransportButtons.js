import { Bus, Car, MapPin, Bike, User, Users } from 'lucide-react';
import { ROOM_TYPES } from 'app/lib/constants';
import "./transportselect.css"
import TypeUser from './TypeUser';

export default function TransportButtons({ 
  onSelectType, 
  selectedType,
  userType,
  onSelectUserType 
}) {
  return (
    <div className="space-y-4 w-full mb-4">
      {/* Transport Type Selection */}
      <div className="w-full">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Transport type:</h3>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button 
              onClick={() => onSelectType(ROOM_TYPES.BIKE)}
              disabled={!userType}
              className={`flex-1 rounded-lg overflow-hidden border ${
                selectedType === ROOM_TYPES.BIKE ? 'border-orange-500' : 'border-gray-200'
              } ${!userType && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`iconType ${
                selectedType === ROOM_TYPES.BIKE ? 'bg-orange-100' : 'bg-white'
              }`}>
                <Bike className="iconSize" />
                <div className='inBtn'>
                  <div className="typeTextInBtn">Bicycle</div>
                  <div className='personInBtn'>2 person</div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onSelectType(ROOM_TYPES.CAR)}
              disabled={!userType}
              className={`flex-1 rounded-lg overflow-hidden border ${
                selectedType === ROOM_TYPES.CAR ? 'border-orange-500' : 'border-gray-200'
              } ${!userType && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`iconType ${
                selectedType === ROOM_TYPES.CAR ? 'bg-orange-100' : 'bg-white'
              }`}>
                <Car className="iconSize" />
                <div className='inBtn'>
                  <div className="typeTextInBtn">Taxi</div>
                  <div className='personInBtn'>2-4 person</div>
                </div>
              </div>
            </button>
          {/* </div> */}

          {/* <div className="flex gap-2"> */}
            <button 
              onClick={() => onSelectType(ROOM_TYPES.LOCATION)}
              disabled={!userType}
              className={`flex-1 rounded-lg overflow-hidden border ${
                selectedType === ROOM_TYPES.LOCATION ? 'border-orange-500' : 'border-gray-200'
              } ${!userType && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`iconType ${
                selectedType === ROOM_TYPES.LOCATION ? 'bg-orange-100' : 'bg-white'
              }`}>
                <MapPin className="iconSize" />
                <div className='inBtn'>
                  <div className="typeTextInBtn">Songthaew</div>
                  <div className='personInBtn'>2-10 person</div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => onSelectType(ROOM_TYPES.BUS)}
              disabled={!userType}
              className={`flex-1 rounded-lg overflow-hidden border ${
                selectedType === ROOM_TYPES.BUS ? 'border-orange-500' : 'border-gray-200'
              } ${!userType && 'opacity-50 cursor-not-allowed'}`}
            >
              <div className={`iconType ${
                selectedType === ROOM_TYPES.BUS ? 'bg-orange-100' : 'bg-white'
              }`}>
                <Bus className="iconSize"/>
                <div className='inBtn'>
                  <div className="typeTextInBtn">EV / Minibus</div>
                  <div className='personInBtn'>2-15 person</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}