import { useState } from 'react';
import { ROOM_TYPES } from '../lib/constants';
import TransportButtons from './TransportButtons';
import TypeUser from './TypeUser';

export default function JoinChat({
  username,
  setUsername,
  isCreatingRoom,
  setIsCreatingRoom,
  selectedType,
  setSelectedType,
  roomName,
  setRoomName,
  customRoom,
  setCustomRoom,
  isLoading,
  setIsLoading,
  room,
  setRoom,
  setRoomCapacity,
  joinChat,
}) {
  const [userType, setUserType] = useState(null);
  const [noRoomsAvailable, setNoRoomsAvailable] = useState(false);
  const [roomDisplayName, setRoomDisplayName] = useState("");

  const getCapacityByType = (type) => {
    switch(type) {
      case ROOM_TYPES.BIKE: return 2;
      case ROOM_TYPES.CAR: return 4;
      case ROOM_TYPES.LOCATION: return 10;
      case ROOM_TYPES.BUS: return 15;
      default: return 4;
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setNoRoomsAvailable(false);
    if (!roomName && isCreatingRoom) {
      const randomId = Math.random().toString(36).substr(2, 6);
      setCustomRoom(`${type}_${randomId}`);
    }
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    if (type === 'passenger') {
      setSelectedType(null);
    }
    setIsCreatingRoom(false);
    setNoRoomsAvailable(false);
  };

  const handleRoomNameChange = (e) => {
    const value = e.target.value;
    setRoomDisplayName(value);
  };

  const joinRandomRoom = async () => {
    if (!username || !selectedType || !userType) {
      alert('Please enter a username, select your role, and select a transport type');
      return;
    }
  
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/rooms/random?transport_type=${selectedType}&user_type=${userType}`);
      const data = await response.json();
      
      if (data.room) {
        console.log('Joining room:', data.room);
        setRoom(data.room);
        setRoomCapacity(data.capacity);
        joinChat(data.room);
      } else {
        setNoRoomsAvailable(true);
      }
    } catch (error) {
      console.error('Error joining random room:', error);
      alert('Error joining room. Please try again.');
    }
    setIsLoading(false);
  };

  const createRoom = async () => {
    if (!username || !selectedType || !userType || userType !== 'driver') {
      alert('Only drivers can create rooms. Please check your selections.');
      return;
    }
    
    setIsLoading(true);
    try {
      const capacity = getCapacityByType(selectedType);
      const finalRoomName = customRoom + (roomDisplayName ? `_${roomDisplayName}` : '');
      
      const response = await fetch('http://127.0.0.1:8000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          room_name: finalRoomName,
          capacity: capacity,
          creator_type: userType,
          display_name: roomDisplayName
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoom(finalRoomName);
        setRoomCapacity(data.capacity);
        setIsCreatingRoom(false);
        joinChat(finalRoomName);
      } else {
        const error = await response.json();
        alert(error.detail);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Error creating room. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">DriveChat@kmitl</h2>
      
      {/* Username and User Type Selection */}
      <div className="w-full flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="w-1/3">
          <TypeUser
            userType={userType}
            onSelectUserType={handleUserTypeSelect}
          />
        </div>
      </div>

      {/* Room Creation for Drivers */}
      {isCreatingRoom && userType === 'driver' ? (
        <div className="w-full space-y-4">
          <h3 className="text-lg font-medium">Create New Room</h3>
          
          <TransportButtons 
            onSelectType={handleTypeSelect}
            selectedType={selectedType}
            userType={userType}
          />
          
          <input
            type="text"
            placeholder="Enter room name (optional)"
            value={roomDisplayName}
            onChange={handleRoomNameChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="flex gap-3">
            <button 
              onClick={createRoom} 
              disabled={isLoading || !username || !selectedType}
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
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Room Joining Interface */
        <div className="w-full space-y-4">
          <TransportButtons 
            onSelectType={handleTypeSelect}
            selectedType={selectedType}
            userType={userType}
          />
          
          {noRoomsAvailable && userType === 'passenger' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              No available rooms for this transport type. Please try another type or wait for a driver to create a room.
            </div>
          )}

          <div className="flex gap-3">
            {userType === 'passenger' && (
              <button 
                onClick={joinRandomRoom} 
                disabled={isLoading || !username || !selectedType}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Finding room...' : 'Join Random Room'}
              </button>
            )}
            
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
  );
}