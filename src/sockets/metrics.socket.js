module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Admin connected to metrics socket");

    socket.on("disconnect", () => {
      console.log("Admin disconnected");
    });

    // Admin joins metrics room
    socket.on("admin:join", () => {
      socket.join("admin-dashboard");
      console.log("Admin joined metrics room");
    });
  });
};
