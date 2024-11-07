import { User, Users } from 'lucide-react';
import "./transportselect.css"

export default function TypeUser({
    userType,
    onSelectUserType 
  }) {
    return (

<div className="w-full">
        {/* <h3 className="text-sm font-medium text-gray-700 mb-2">I am a:</h3> */}
        <div className="flex gap-2">
          <button 
            onClick={() => onSelectUserType('passenger')}
            className={`flex-1 rounded-lg overflow-hidden border ${
              userType === 'passenger' ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <div className={`flex items-center justify-center gap-2 py-2 px-3 w-full ${
              userType === 'passenger' ? 'bg-red-50' : 'bg-white'
            }`}>
              <User className={`w-5 h-6 ${userType === 'passenger' ? 'text-red-600' : 'text-gray-600'}`} />
              <span className={`text-sm ${userType === 'passenger' ? 'text-red-600' : 'text-gray-600'}`}>Passenger</span>
            </div>
          </button>

          <button 
            onClick={() => onSelectUserType('driver')}
            className={`flex-1 rounded-lg overflow-hidden border ${
              userType === 'driver' ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <div className={`flex items-center justify-center gap-2 py-2 px-3 w-full ${
              userType === 'driver' ? 'bg-red-50' : 'bg-white'
            }`}>
              <Users className={`w-5 h-5 ${userType === 'driver' ? 'text-red-600' : 'text-gray-600'}`} />
              <span className={`text-sm ${userType === 'driver' ? 'text-red-600' : 'text-gray-600'}`}>Driver</span>
            </div>
          </button>
        </div>
      </div>

);
}