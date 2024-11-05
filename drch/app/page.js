'use client';

import { useState, useEffect, useRef } from 'react';

const ROOM_CAPACITIES = [
  { value: 2, label: '2 Users' },
  { value: 4, label: '4 Users' },
  { value: 10, label: '10 Users' },
  { value: 15, label: '15 Users' }
];

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
  const [selectedCapacity, setSelectedCapacity] = useState(4);
  const [roomCapacity, setRoomCapacity] = useState(0);
  const socket = useRef(null);

  const joinRandomRoom = async () => {
    if (!username) {
      alert('Please enter a username first');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/rooms/random');
      const data = await response.json();
      if (data.room) {
        setRoom(data.room);
        setRoomCapacity(data.capacity);
        joinChat(data.room);
      } else {
        alert('No rooms available. Please create a new room to start chatting.');
      }
    } catch (error) {
      console.error('Error joining random room:', error);
      alert('Error joining room. Please try again.');
    }
    setIsLoading(false);
  };

  const createRoom = async () => {
    if (!username) {
      alert('Please enter a username first');
      return;
    }
    
    if (customRoom.trim()) {
      setIsLoading(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            room_name: customRoom,
            capacity: selectedCapacity
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setRoom(customRoom);
          setRoomCapacity(data.capacity);
          setIsCreatingRoom(false);
          setCustomRoom("");
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
    }
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
          <h2>Welcome to Chat</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
          
          {isCreatingRoom ? (
            <div className="create-room-container">
              <input
                type="text"
                placeholder="Enter room name"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                className="input-field"
              />
              <select
                value={selectedCapacity}
                onChange={(e) => setSelectedCapacity(Number(e.target.value))}
                className="room-select"
              >
                {ROOM_CAPACITIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="button-group">
                <button 
                  onClick={createRoom} 
                  className="primary-button"
                  disabled={isLoading || !username || !customRoom.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create & Join Room'}
                </button>
                <button 
                  onClick={() => setIsCreatingRoom(false)} 
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