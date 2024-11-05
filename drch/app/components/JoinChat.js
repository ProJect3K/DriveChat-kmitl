import { ROOM_TYPES } from '../lib/constants';
import TransportButtons from './TransportButtons';

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
  joinChat
}) {
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
    if (!roomName) {
      setCustomRoom(`${type}_${Math.random().toString(36).substr(2, 6)}`);
    }
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
    if (!username || !selectedType) {
      alert('Please enter a username and select a room type');
      return;
    }
  
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/rooms/random?room_type=${selectedType}`);
      const data = await response.json();
      if (data.room) {
        setRoom(data.room);
        setRoomCapacity(data.capacity);
        joinChat(data.room);
      } else {
        alert('No rooms available for the selected type. Please create a new room.');
      }
    } catch (error) {
      console.error('Error joining random room:', error);
      alert('Error joining room. Please try again.');
    }
    setIsLoading(false);
  };

  const createRoom = async () => {
    if (!username || !selectedType) {
      alert('Please enter a username and select a room type');
      return;
    }
    
    setIsLoading(true);
    try {
      const capacity = getCapacityByType(selectedType);
      const response = await fetch('http://127.0.0.1:8000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          room_name: customRoom,
          capacity: capacity
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoom(customRoom);
        setRoomCapacity(data.capacity);
        setIsCreatingRoom(false);
        joinChat(customRoom);
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
    <div className="flex flex-col items-center max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">DriveChat@kmitl</h2>
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      {isCreatingRoom ? (
        <div className="w-full">
          <h3 className="text-lg font-medium mb-4">Select Room Type</h3>
          <TransportButtons 
            onSelectType={handleTypeSelect}
            selectedType={selectedType}
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
              disabled={isLoading || !username || !selectedType}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create & Join Room'}
            </button>
            <button 
              onClick={() => {
                setIsCreatingRoom(false);
                setSelectedType(null);
                setRoomName("");
              }} 
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
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
          />
          <div className="flex gap-3">
            <button 
              onClick={joinRandomRoom} 
              disabled={isLoading || !username}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Finding room...' : 'Join Random Room'}
            </button>
            <button 
              onClick={() => setIsCreatingRoom(true)} 
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Create New Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}