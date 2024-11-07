'use client';

import { useState, useEffect, useRef } from 'react';
import ChatRoom from 'app/components/ChatRoom';
import JoinChat from 'app/components/JoinChat';

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

  const joinChat = (roomToJoin) => {
    if (username && roomToJoin) {
      socket.current = new WebSocket(`ws://127.0.0.1:8000/ws/${roomToJoin}/${username}`);
      
      socket.current.onmessage = function(event) {
        const message = event.data;
        
        if (message.startsWith("Active users")) {
          const usersPart = message.split(": ")[1];
          const users = usersPart.split(", ");
          setActiveUsers(users);
        } else if (message.startsWith("System: ROOM_CHANGE:")) {
          const newRoom = message.split(":")[2];
          setRoom(newRoom);
          // Re-establish websocket connection for new room
          socket.current.close();
          joinChat(newRoom);
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

  const handleRoomChange = (newRoom) => {
    setRoom(newRoom);
    if (newRoom === 'duck_pond') {
      // Re-establish websocket connection for duck pond
      socket.current.close();
      joinChat('duck_pond');
    }
  };

  return (
    <div className="min-h-screen bg-[url('/images/ต้นไม้มมม1.png')] bg-cover bg-center bg-fixed ">
      <div className="min-h-screen bg-white/70 pt-6" >
        <div className="max-w-4xl mx-auto p-6 bg-white/90 rounded-xl shadow-xl">
          {!isJoined ? (
            <JoinChat
              username={username}
              setUsername={setUsername}
              isCreatingRoom={isCreatingRoom}
              setIsCreatingRoom={setIsCreatingRoom}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              roomName={roomName}
              setRoomName={setRoomName}
              customRoom={customRoom}
              setCustomRoom={setCustomRoom}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              room={room}
              setRoom={setRoom}
              setRoomCapacity={setRoomCapacity}
              joinChat={joinChat}
            />
            ) : (
              <ChatRoom
              room={room}
              setRoom={handleRoomChange}
              activeUsers={activeUsers}
              roomCapacity={roomCapacity}
              username={username}
              messages={messages}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              sendMessage={sendMessage}
              nextStation="ped pong"
              currentStatus="Driving"
            />
          )}
        </div>
      </div>
    </div>
  );
}