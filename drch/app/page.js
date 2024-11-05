'use client';

import { useState, useEffect, useRef } from 'react';
import { Bus, Car, MapPin, Bike } from 'lucide-react';

const ROOM_TYPES = {
  BIKE: 'motorcycle',
  CAR: 'taxi',
  LOCATION: 'location',
  BUS: 'evmini'
};

const TransportButtons = ({ onSelectType, selectedType }) => {
  return (
    <div className="flex flex-col gap-2 max-w-sm w-full mb-4">
      <div className="flex gap-2">
        <button 
          onClick={() => onSelectType(ROOM_TYPES.BIKE)}
          className={`flex-1 flex items-center rounded-lg overflow-hidden border border-gray-200 ${
            selectedType === ROOM_TYPES.BIKE ? 'border-blue-500' : ''
          }`}
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
          className={`flex-1 flex items-center rounded-lg overflow-hidden border border-gray-200 ${
            selectedType === ROOM_TYPES.CAR ? 'border-orange-500' : ''
          }`}
        >
          <div className={`flex items-center gap-2 py-2 px-3 w-full ${
            selectedType === ROOM_TYPES.CAR ? 'bg-orange-100' : 'bg-white'
          }`}>
            <Car className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-orange-500">แท้กซี่</span>
          </div>
        </button>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onSelectType(ROOM_TYPES.LOCATION)}
          className={`flex-1 flex items-center rounded-lg overflow-hidden border border-gray-200 ${
            selectedType === ROOM_TYPES.LOCATION ? 'border-blue-500' : ''
          }`}
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
          className={`flex-1 flex items-center rounded-lg overflow-hidden border border-gray-200 ${
            selectedType === ROOM_TYPES.BUS ? 'border-blue-500' : ''
          }`}
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
  );
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState(""); 
  const [customRoom, setCustomRoom] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [roomCapacity, setRoomCapacity] = useState(0);
  const [roomName, setRoomName] = useState("");
  const socket = useRef(null);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    // Generate default room name if custom name is not set
    if (!roomName) {
      setCustomRoom(`${type}_${Math.random().toString(36).substr(2, 6)}`);
    }
  };

  const getCapacityByType = (type) => {
    switch(type) {
      case ROOM_TYPES.BIKE:
        return 2;
      case ROOM_TYPES.CAR:
        return 4;
      case ROOM_TYPES.LOCATION:
        return 10;
      case ROOM_TYPES.BUS:
        return 15;
      default:
        return 4;
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
      // Send the selected room type as a query parameter to filter rooms by type
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

  const joinChat = (roomToJoin) => {
    if (username && roomToJoin) {
      socket.current = new WebSocket(`ws://127.0.0.1:8000/ws/${roomToJoin}/${username}`);
      
      socket.current.onmessage = function(event) {
        const message = event.data;
        
        if (message.startsWith("Active users")) {
          const usersPart = message.split(": ")[1];
          const users = usersPart.split(", ");
          setActiveUsers(users);
        } else {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      };

      socket.current.onclose = function(event) {
        if (event.reason) {
          alert(event.reason);
        }
        setIsJoined(false);
        setActiveUsers([]);
      };

      socket.current.onopen = function() {
        setIsJoined(true);
      };
    }
  };

  const sendMessage = () => {
    if (inputMessage !== "" && socket.current) {
      socket.current.send(inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div className="chat-container">
      {!isJoined ? (
        <div className="join-container">
          <h2 className="text-2xl font-semibold mb-6">DriveChat@kmitl</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
          
          {isCreatingRoom ? (
            <div className="create-room-container">
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
                className="input-field"
              />
              <div className="button-group">
                <button 
                  onClick={createRoom} 
                  className="primary-button"
                  disabled={isLoading || !username || !selectedType}
                >
                  {isLoading ? 'Creating...' : 'Create & Join Room'}
                </button>
                <button 
                  onClick={() => {
                    setIsCreatingRoom(false);
                    setSelectedType(null);
                    setRoomName("");
                  }} 
                  className="secondary-button"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="join-options-container">
              <div className="button-group">
                <button 
                  onClick={joinRandomRoom} 
                  className="primary-button"
                  disabled={isLoading || !username}
                >
                  {isLoading ? 'Finding room...' : 'Join Random Room'}
                </button>
                <button 
                  onClick={() => setIsCreatingRoom(true)} 
                  className="secondary-button"
                  disabled={isLoading}
                >
                  Create New Room
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="chat-room">
          <h1>Chat Room: {room}</h1>
          <div className="active-users">
            <h3>Active Users ({activeUsers.length}/{roomCapacity})</h3>
            <ul>
              {activeUsers.map((user, index) => (
                <li key={index}>
                  {user === username ? `${user} (You)` : user}
                </li>
              ))}
            </ul>
          </div>
          <div className="message-list">
            {messages.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="input-field"
            />
            <button onClick={sendMessage} className="primary-button">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}