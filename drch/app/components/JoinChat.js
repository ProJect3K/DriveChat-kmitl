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

  onSelectUserType,

}) {
  const [userType, setUserType] = useState(null);
  const [noRoomsAvailable, setNoRoomsAvailable] = useState(false);

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
      setCustomRoom(`${type}_${Math.random().toString(36).substr(2, 6)}`);
    }
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setSelectedType(null);
    setIsCreatingRoom(false);
    setNoRoomsAvailable(false);
  };

  const handleRoomNameChange = (e) => {
    const value = e.target.value;
    setRoomName(value);
    if (value) {
      setCustomRoom(value);
    } else if (selectedType) {
      setCustomRoom(`${selectedType}_${Math.random().toString(36).substr(2, 6)}`);
    }
  };

  const joinRandomRoom = async () => {
    if (!username || !selectedType || !userType) {
      alert('Please enter a username, select your role, and select a transport type');
      return;
    }
  
    setIsLoading(true);
    try {
      // First, let's debug what rooms are available
      const debugResponse = await fetch('http://127.0.0.1:8000/rooms/debug');
      const debugData = await debugResponse.json();
      console.log('Available rooms:', debugData);
  
      // Now try to join a room
      const response = await fetch(`http://127.0.0.1:8000/rooms/random?transport_type=${selectedType}`);
      const data = await response.json();
      console.log('Join room response:', data);
      
      if (data.room) {
        console.log('Joining room:', data.room);
        setRoom(data.room);
        setRoomCapacity(data.capacity);
        joinChat(data.room);
      } else {
        console.log('No room available, userType:', userType);
        if (userType === 'passenger') {
          setNoRoomsAvailable(true);
        } else if (userType === 'driver') {
          setIsCreatingRoom(true);
        }
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
      console.log('Creating room:', customRoom, 'with capacity:', capacity);
      
      const response = await fetch('http://127.0.0.1:8000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          room_name: customRoom,
          capacity: capacity,
          creator_type: userType
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Room created successfully:', data);
        setRoom(customRoom);
        setRoomCapacity(data.capacity);
        setIsCreatingRoom(false);
        joinChat(customRoom);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
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
      <div className="w-full flex gap-2">
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ flex: 4 }}
        />
      <div style={{ flex: 3 }}> 
        <TypeUser
          userType={userType}
          onSelectUserType={handleUserTypeSelect}
        />
      </div>
    </div>

      
      {isCreatingRoom && userType === 'driver' ? (
        <div className="w-full">
          <h3 className="text-lg font-medium mb-4">Create New Room</h3>
          <TransportButtons 
            onSelectType={handleTypeSelect}
            selectedType={selectedType}
            userType={userType}
            onSelectUserType={handleUserTypeSelect}
          />
          <input
            type="text"
            placeholder="Enter room name (optional)"
            value={roomName}
            onChange={handleRoomNameChange}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-3">
            <button 
              onClick={createRoom} 
              disabled={isLoading || !username || !selectedType || !customRoom}
              className="createBtn"
              style={{ flex: 5 }}
            >
              {isLoading ? 'Creating...' : 'Create & Join Room'}
            </button>
            <button 
              onClick={() => {
                setIsCreatingRoom(false);
                setRoomName("");
              }} 
              disabled={isLoading}
              className="cancleBtn"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <TransportButtons 
            onSelectType={handleTypeSelect}
            selectedType={selectedType}
            userType={userType}
            onSelectUserType={handleUserTypeSelect}
          />
          
          {noRoomsAvailable && userType === 'passenger' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              No available rooms for this transport type. Please try another type or wait for a driver to create a room.
            </div>
          )}

          <div className="flex gap-3">
            {userType === 'passenger' && (
              <button 
                onClick={joinRandomRoom} 
                disabled={isLoading || !username || !selectedType || !userType}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Finding room...' : 'Join Random Room'}
              </button>
            )}
            
            {userType === 'driver' && (
              <button 
                onClick={() => {
                  setIsCreatingRoom(true);
                  setRoomName("");
                }} 
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
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