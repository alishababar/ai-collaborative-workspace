"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketSingleton: AppSocket | null = null;

function getSocket(): AppSocket {
  if (!socketSingleton) {
    socketSingleton = io({ path: "/socket.io", autoConnect: false });
  }
  return socketSingleton;
}

export function useSocket(): AppSocket {
  const ref = useRef<AppSocket>(getSocket());
useEffect(() => {
  const socket = ref.current;

  socket.on("connect", () => {
    console.log(" Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  if (!socket.connected) {
    socket.connect();
  }

  return () => {
    socket.off("connect");
    socket.off("connect_error");
    socket.off("disconnect");
  };
}, []);
  return ref.current;
}