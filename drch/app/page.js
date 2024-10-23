'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("room1"); // Default to room1
  const [isJoined, setIsJoined] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const socket = useRef(null);

  const joinChat = () => {
    if (username && room) {
      socket.current = new WebSocket(`ws://127.0.0.1:8000/ws/${room}/${username}`);
      
      socket.current.onmessage = function(event) {
        const message = event.data;
        
        // Check if the message contains the active users list
        if (message.startsWith("Active users: ")) {
          const users = message.replace("Active users: ", "").split(", ");
          setActiveUsers(users);
        } else {
          // Add regular messages to the chat
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      };

      socket.current.onclose = function() {
        setIsJoined(false);
        setActiveUsers([]); // Clear active users when disconnected
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
    <div>
      {!isJoined ? (
        <div>
          <h2>Enter Chat</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <select value={room} onChange={(e) => setRoom(e.target.value)}>
            <option value="room1">Room 1</option>
            <option value="room2">Room 2</option>
            <option value="room3">Room 3</option>
            <option value="room4">Room 4</option>
            <option value="room5">Room 5</option>
          </select>
          <button onClick={joinChat}>Join Chat</button>
        </div>
      ) : (
        <div>
          <h1>Chat Room: {room}</h1>
          <div>
            <h3>Active Users</h3>
            <ul>
              {/* Display all active users including the current user */}
              {activeUsers.map((user, index) => (
                <li key={index}>
                  {user === username ? `${user} (You)` : user}
                </li>
              ))}
            </ul>
          </div>
          <div>
            {messages.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("room1"); // Default to room1
  const [isJoined, setIsJoined] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const socket = useRef(null);

  const joinChat = () => {
    if (username && room) {
      socket.current = new WebSocket(`ws://127.0.0.1:8000/ws/${room}/${username}`);
      
      socket.current.onmessage = function(event) {
        const message = event.data;
        
        // Check if the message contains the active users list
        if (message.startsWith("Active users: ")) {
          const users = message.replace("Active users: ", "").split(", ");
          setActiveUsers(users);
        } else {
          // Add regular messages to the chat
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      };

      socket.current.onclose = function() {
        setIsJoined(false);
        setActiveUsers([]); // Clear active users when disconnected
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
    <div>
      {!isJoined ? (
        <div>
          <h2>Enter Chat</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <select value={room} onChange={(e) => setRoom(e.target.value)}>
            <option value="room1">Room 1</option>
            <option value="room2">Room 2</option>
            <option value="room3">Room 3</option>
            <option value="room4">Room 4</option>
            <option value="room5">Room 5</option>
          </select>
          <button onClick={joinChat}>Join Chat</button>
        </div>
      ) : (
        <div>
          <h1>Chat Room: {room}</h1>
          <div>
            <h3>Active Users</h3>
            <ul>
              {/* Display all active users including the current user */}
              {activeUsers.map((user, index) => (
                <li key={index}>
                  {user === username ? `${user} (You)` : user}
                </li>
              ))}
            </ul>
          </div>
          <div>
            {messages.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}
