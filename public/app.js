const socket = io(); // Connect to server

document.getElementById("socketBtn").addEventListener("click", () => {
  socket.emit("test_event", { message: "Hello from client!" });
});

socket.on("test_event_response", (data) => {
  alert(`Server says: ${data.message}`);
});
