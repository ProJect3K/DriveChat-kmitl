export default function ChatRoom({
    room,
    activeUsers,
    roomCapacity,
    username,
    messages,
    inputMessage,
    setInputMessage,
    sendMessage
  }) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Chat Room: {room}</h1>
        
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-lg font-medium mb-2">
            Active Users ({activeUsers.length}/{roomCapacity})
          </h3>
          <ul className="space-y-1">
            {activeUsers.map((user, index) => (
              <li key={index} className="text-gray-700">
                {user === username ? `${user} (You)` : user}
              </li>
            ))}
          </ul>
        </div>
  
        <div className="h-96 overflow-y-auto p-4 bg-white rounded-lg border">
          {messages.map((msg, index) => (
            <p key={index} className="py-2 border-b border-gray-100 last:border-0">
              {msg}
            </p>
          ))}
        </div>
  
        <div className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={sendMessage}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    );
  }