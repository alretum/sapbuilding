import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { registerSocketHandlers } from "./src/server/socket";

// Custom server: hosts Socket.IO on the same HTTP server as Next.
// engine.io intercepts its own /socket.io path and forwards everything else to
// Next's request handler, so this single process serves app + realtime.

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });
  (globalThis as unknown as { io?: SocketIOServer }).io = io;

  registerSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Cloud Readiness Challenge ready on http://${hostname}:${port}  (dev=${dev})`);
  });
});
