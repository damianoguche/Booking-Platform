const socket = io();

socket.on("connect", () => {
  console.log("Connected to socket:", socket.id);

  // Tell server this is admin
  socket.emit("admin:join");
});
