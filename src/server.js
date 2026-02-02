require("dotenv").config();
const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: { origin: "*" }
});

require("./sockets/metrics.socket")(io);

/** Easy to add more sockets
 * require("./sockets/chat.socket")(io);
 * require("./sockets/notifications.socket")(io);
 */

/**
 * Make socket available globally
 * Stores io inside the Express app instance.
 */
app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
