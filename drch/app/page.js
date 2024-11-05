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
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
          body: JSON.stringify({ room_name: customRoom }),
        });
        
        if (response.ok) {
          setRoom(customRoom);
          setIsCreatingRoom(false);
          setCustomRoom("");
          joinChat(customRoom);
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
          <h1>Chat Room: {room} ({activeUsers.length} users)</h1>
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