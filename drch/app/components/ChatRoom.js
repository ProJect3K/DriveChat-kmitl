import { useState, useEffect } from 'react';

const ChatRoom = ({
  room,
  setRoom,
  activeUsers = [], // Add default empty array
  roomCapacity,
  username,
  messages,
  inputMessage,
  setInputMessage,
  sendMessage,
  nextStation = "ped pong",
  currentStatus = "Driving",
}) => {
  const [timeRemaining, setTimeRemaining] = useState(180);

  useEffect(() => {
    let timer;
    if (room !== 'duck_pond' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            setRoom('duck_pond');
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [room, timeRemaining, setRoom]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} Minute ${remainingSeconds} Seconds to change`;
  };

  const getRoomDisplayName = () => {
    if (room === 'duck_pond') return 'Duck Pond';
    const parts = room.split('_');
    if (parts.length > 2) {
      const transportType = parts[0];
      const displayName = parts.slice(2).join('_');
      return `${transportType} - ${displayName}`;
    }
    return room;
  };

  // Safely get the number of active users
  const activeUserCount = Array.isArray(activeUsers) ? activeUsers.length : 0;

  return (
    <div className="relative min-h-screen bg-gray-100 p-4">
      {/* Status Bar */}
      <div className="flex justify-between items-center mb-4 bg-white rounded-lg p-4 shadow-sm">
        <div className="space-y-1">
          <div className="text-lg font-semibold">Next Station: {nextStation}</div>
          <div className="text-lg">Now: {currentStatus}</div>
        </div>
        <div className="text-right">
          {room !== 'duck_pond' && (
            <div className="text-lg">TIME REMAINING: {formatTime(timeRemaining)}</div>
          )}
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Video Section */}
        <div className="w-1/2 bg-white rounded-lg shadow-lg p-4">
          <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg">
            <div className="text-4xl text-white">video</div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-1/2 bg-white rounded-lg shadow-lg p-4 flex flex-col">
          {/* Chat Header */}
          <div className="border-b pb-2 mb-4">
            <h2 className="text-xl font-bold">Room: {getRoomDisplayName()}</h2>
            <div className="text-sm text-gray-600">
              user seat: {activeUserCount}/{roomCapacity}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 px-4 space-y-4">
            {messages.map((msg, index) => {
              const isSystemMessage = msg.startsWith("System:");
              const messageParts = isSystemMessage ? 
                ["System", msg.substring(7)] : 
                msg.split(":");
              const sender = messageParts[0];
              const content = messageParts.slice(1).join(":");

              if (content.trim().startsWith("ROOM_CHANGE:")) {
                return null;
              }

              return (
                <div 
                  key={index} 
                  className={`flex flex-col ${isSystemMessage ? 'items-center' : 'items-start'}`}
                >
                  {!isSystemMessage && (
                    <div className="text-sm text-gray-600 mb-1 px-2">
                      {sender}
                    </div>
                  )}
                  <div className={`rounded-lg p-3 max-w-[80%] break-words
                    ${isSystemMessage 
                      ? 'bg-gray-100 text-gray-600 text-center w-full' 
                      : 'bg-blue-100'}`}
                  >
                    {content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="chat message"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                className="px-6 py-2 bg-amber-400 text-black rounded-lg hover:bg-amber-500 transition-colors"
              >
                send 😊
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Chat Button */}
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        LEAVE CHAT
      </button>
    </div>
  );
};

export default ChatRoom;