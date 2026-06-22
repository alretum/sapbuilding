"use client";

import { io, type Socket } from "socket.io-client";

// Single shared browser socket. Same-origin: it connects back to the custom
// server that also serves Next, so no URL/config needed.
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({ transports: ["websocket", "polling"] });
  }
  return socket;
}
