const WS_PATH = "ws://localhost:8080";
let socket;

function setupWebSocket() {
  socket = new WebSocket(WS_PATH);
  socket.onopen = () => {
    console.log("WebSocket bağlantısı kuruldu.");
  };
  socket.onerror = (error) => {
    console.error("WebSocket hatası:", error);
  };
  socket.onmessage = (message) => {
    setSliders(message.data.split(",").map(Number));
  };
  return socket;
}
