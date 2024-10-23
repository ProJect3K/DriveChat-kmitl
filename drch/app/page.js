'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState(""); 
  const [customRoom, setCustomRoom] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const socket = useRef(null);

  useEffect(() => {
    // Fetch available rooms when component mounts
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/rooms');
      const rooms = await response.json();
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const createRoom = async () => {
    if (customRoom.trim()) {
      try {
        const response = await fetch('http://127.0.0.1:8000/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ room_name: customRoom }),
        });
        
        if (response.ok) {
          setRoom(customRoom);
          setAvailableRooms([...availableRooms, customRoom]);
          setIsCreatingRoom(false);
          setCustomRoom("");
        }
      } catch (error) {
        console.error('Error creating room:', error);
      }
    }
  };

  const joinChat = () => {
    if (username && room) {
      socket.current = new WebSocket(`ws://127.0.0.1:8000/ws/${room}/${username}`);
      
      socket.current.onmessage = function(event) {
        const message = event.data;
        
        if (message.startsWith("Active users: ")) {
          const users = message.replace("Active users: ", "").split(", ");
          setActiveUsers(users);
        } else {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      };

      socket.current.onclose = function() {
        setIsJoined(false);
        setActiveUsers([]);
      };

      setIsJoined(true);
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
        <div>
          <h2>Enter Chat</h2>
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
              <div className="button-group">
                <button onClick={createRoom} className="primary-button">Create Room</button>
                <button onClick={() => setIsCreatingRoom(false)} className="secondary-button">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="join-room-container">
              <select 
                value={room} 
                onChange={(e) => setRoom(e.target.value)}
                className="room-select"
              >
                <option value="">Select a room</option>
                {availableRooms.map((roomName) => (
                  <option key={roomName} value={roomName}>{roomName}</option>
                ))}
              </select>
              <button onClick={() => setIsCreatingRoom(true)} className="secondary-button">
                Create New Room
              </button>
            </div>
          )}
          
          <button 
            onClick={joinChat} 
            disabled={!username || !room}
            className="primary-button"
          >
            Join Chat
          </button>
        </div>
      ) : (
        <div className="chat-room">
          <h1>Chat Room: {room}</h1>
          <div className="active-users">
            <h3>Active Users</h3>
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
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
