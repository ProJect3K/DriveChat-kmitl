const { useEffect } = require("react");

export default function Home() {
  const [ws, setWs] = useState(null);

  function sendMessage(event) {
    event.preventDefault();
    if (!ws) return;
    var input = document.getElementById("messageText");
    ws.send(input.value);
    input.value = "";
  }
  useEffect(() => {
    const client_id = Date.now();
    document.querySelector("#ws-id").textContent = client_id;
    const _ws = new WebSocket(`ws://localhost:8000/ws/${client_id}`);
    _ws.onmessage = function (event) {
      var messages = document.getElementById("messages");
      var message = document.createElement("li");
      var content = document.createTextNode(event.data);
      message.appendChild(content);
      messages.appendChild(message);
    };
    setWs(_ws);
  }, []);
  return (
    <div class="container mt-3">
      <h1>DriveChat@Kmitl</h1>
      <h2>
        Your ID: <span id="ws-id"></span>
      </h2>
      <form action="" onSubmit={sendMessage}>
        <input
          type="text"
          class="form-control"
          id="messageText"
          autocomplete="off"
        />
        <button class="btn btn-outline-primary mt-2">Send</button>
      </form>
      <ul id="messages" class="mt-5"></ul>
    </div>
  );
}
