module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Admin connected to metrics socket");

    socket.on("disconnect", () => {
      console.log("Admin disconnected");
    });

    io.emit("metrics:update", {
      success: 103,
      fails: 11,
      pendings: 13,
      revenue: 1500000,
      totalBookings: 120,
      confirmed: 90,
      pending: 20,
      cancels: 7,
      guests: 200,
      hosts: 20,
      properties: 78,
      users: 93,
      recentBookings: [
        {
          id: "B1001",
          user: "Damian",
          property: "Lekki View",
          status: "CONFIRMED"
        }
      ]
    });

    // Admin joins metrics room
    socket.on("admin:join", () => {
      socket.join("admin-dashboard");
      console.log("Admin joined metrics room");
    });
  });
};
