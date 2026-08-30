import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import next from "next";
import { Server } from "socket.io";
import type {
  CanvasNode,
  CanvasEdge,
  ChatMessage,
  ClientToServerEvents,
  ServerToClientEvents,
  Participant,
  AIOp
} from "./lib/types";
import { NODE_COLORS, PARTICIPANT_COLORS } from "./lib/types";
import { roomStore } from "./lib/store";
import { analyzeTranscript, runCommand } from "./lib/ai";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

const participants = new Map<string, Participant>();
const socketRoom = new Map<string, string>();

function nextSpot(nodeCount: number) {
  const col = nodeCount % 6;
  const row = Math.floor(nodeCount / 6);
  return { x: 80 + col * 220, y: 120 + row * 160 };
}

function applyOps(
  room: string,
  ops: AIOp[],
  author: string
): { newNodes: CanvasNode[]; newEdges: CanvasEdge[]; updated: CanvasNode[] } {
  const state = roomStore.getState(room);
  const tempIdToRealId = new Map<string, string>();
  const newNodes: CanvasNode[] = [];
  const newEdges: CanvasEdge[] = [];
  const updated: CanvasNode[] = [];

  for (const op of ops) {
    if (op.op === "add_node") {
      const spot = nextSpot(state.nodes.length + newNodes.length);
      const node: CanvasNode = {
        id: randomUUID(),
        kind: op.kind,
        text: op.text.slice(0, 140),
        x: op.x ?? spot.x,
        y: op.y ?? spot.y,
        w: 180,
        h: 96,
        color: NODE_COLORS[op.kind] ?? NODE_COLORS.note,
        author,
        createdAt: Date.now()
      };
      tempIdToRealId.set(op.id, node.id);
      roomStore.addNode(room, node);
      newNodes.push(node);
    } else if (op.op === "add_edge") {
      const source = tempIdToRealId.get(op.source) ?? op.source;
      const target = tempIdToRealId.get(op.target) ?? op.target;
      const exists = state.nodes.some((n) => n.id === source) || newNodes.some((n) => n.id === source);
      const existsT = state.nodes.some((n) => n.id === target) || newNodes.some((n) => n.id === target);
      if (!exists || !existsT || source === target) continue;
      const edge: CanvasEdge = { id: randomUUID(), source, target, label: op.label };
      roomStore.addEdge(room, edge);
      newEdges.push(edge);
    } else if (op.op === "update_node") {
      const patch: Partial<CanvasNode> = {};
      if (op.text) patch.text = op.text.slice(0, 140);
      if (op.kind) {
        patch.kind = op.kind;
        patch.color = NODE_COLORS[op.kind] ?? NODE_COLORS.note;
      }
      const node = roomStore.updateNode(room, op.id, patch);
      if (node) updated.push(node);
    }
  }

  return { newNodes, newEdges, updated };
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
 const io = new Server<ClientToServerEvents, ServerToClientEvents>(
  httpServer,
  {
    path: "/socket.io",
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  }
);

  io.on("connection", (socket) => {
    socket.on("room:join", ({ room, name }) => {
      socket.join(room);
      socketRoom.set(socket.id, room);

      const existingPeerIds = [...participants.keys()].filter(
        (id) => socketRoom.get(id) === room
      );

      const color = PARTICIPANT_COLORS[participants.size % PARTICIPANT_COLORS.length];
      const participant: Participant = {
        id: socket.id,
        name: name?.trim() || `Guest ${socket.id.slice(0, 4)}`,
        color,
        joinedAt: Date.now()
      };
      participants.set(socket.id, participant);

      socket.emit("room:state", roomStore.getState(room));
      socket.emit("webrtc:peers", { peers: existingPeerIds });
      io.to(room).emit(
        "presence:list",
        [...participants.values()].filter((p) => socketRoom.get(p.id) === room)
      );
    });

    socket.on("canvas:node-add", (node) => {
      const room = socketRoom.get(socket.id);
      if (!room) return;
      roomStore.addNode(room, node);
      io.to(room).emit("canvas:node-update", node);
    });

    socket.on("canvas:node-move", ({ id, x, y }) => {
      const room = socketRoom.get(socket.id);
      if (!room) return;
      const node = roomStore.updateNode(room, id, { x, y });
      if (node) io.to(room).emit("canvas:node-update", node);
    });

    socket.on("canvas:node-edit", ({ id, text }) => {
      const room = socketRoom.get(socket.id);
      if (!room) return;
      const node = roomStore.updateNode(room, id, { text });
      if (node) io.to(room).emit("canvas:node-update", node);
    });

    socket.on("canvas:node-remove", (id) => {
      const room = socketRoom.get(socket.id);
      if (!room) return;
      roomStore.removeNode(room, id);
      io.to(room).emit("canvas:node-remove", id);
    });

    socket.on("canvas:edge-add", (edge) => {
      const room = socketRoom.get(socket.id);
      if (!room) return;
      roomStore.addEdge(room, edge);
      io.to(room).emit("canvas:edges", roomStore.getState(room).edges);
    });

    socket.on("chat:message", async ({ text }) => {
      const room = socketRoom.get(socket.id);
      const participant = participants.get(socket.id);
      if (!room || !participant || !text.trim()) return;

      const message: ChatMessage = {
        id: randomUUID(),
        author: participant.name,
        color: participant.color,
        text: text.trim(),
        createdAt: Date.now()
      };
      roomStore.addMessage(room, message);
      io.to(room).emit("chat:message", message);

      try {
        io.to(room).emit("ai:thinking", true);
        const transcript = roomStore.recentTranscript(room, 12);
        const { nodes } = roomStore.getState(room);
        const result = await analyzeTranscript(transcript, nodes);
        const { newNodes, newEdges, updated } = applyOps(room, result.ops, "AI");
        if (newNodes.length) io.to(room).emit("canvas:nodes", newNodes);
        for (const n of updated) io.to(room).emit("canvas:node-update", n);
        if (newEdges.length) io.to(room).emit("canvas:edges", roomStore.getState(room).edges);
        const isAdvisory =
          result.summary.includes("isn't reachable") ||
          result.summary.includes("Ollama returned") ||
          result.summary.includes("couldn't be parsed");
        if (isAdvisory || newNodes.length || newEdges.length || updated.length) {
          io.to(room).emit("ai:summary", result.summary);
        }
      } catch (err) {
        console.error("AI analyze failed:", err);
      } finally {
        io.to(room).emit("ai:thinking", false);
      }
    });

    socket.on("ai:command", async ({ instruction }) => {
      const room = socketRoom.get(socket.id);
      if (!room || !instruction.trim()) return;
      try {
        io.to(room).emit("ai:thinking", true);
        const { nodes } = roomStore.getState(room);
        const result = await runCommand(instruction.trim(), nodes);
        const { newNodes, newEdges, updated } = applyOps(room, result.ops, "AI");
        if (newNodes.length) io.to(room).emit("canvas:nodes", newNodes);
        for (const n of updated) io.to(room).emit("canvas:node-update", n);
        if (newEdges.length) io.to(room).emit("canvas:edges", roomStore.getState(room).edges);
        io.to(room).emit("ai:summary", result.summary);
      } catch (err) {
        console.error("AI command failed:", err);
        io.to(room).emit("ai:summary", "AI command failed — check server logs / API key.");
      } finally {
        io.to(room).emit("ai:thinking", false);
      }
    });

    socket.on("webrtc:signal", (payload) => {
      io.to(payload.to).emit("webrtc:signal", { ...payload, from: socket.id });
    });

    socket.on("presence:cursor", ({ x, y }) => {
      const room = socketRoom.get(socket.id);
      if (!room) return;
      socket.to(room).emit("presence:cursor", { id: socket.id, x, y });
    });

    socket.on("disconnect", () => {
      const room = socketRoom.get(socket.id);
      participants.delete(socket.id);
      socketRoom.delete(socket.id);
      if (room) {
        io.to(room).emit(
          "presence:list",
          [...participants.values()].filter((p) => socketRoom.get(p.id) === room)
        );
      }
    });
  });

  const host = "0.0.0.0";

httpServer.listen(port, host, () => {
  console.log(`> AI Collaborative Workspace ready on port ${port}`);
});
});
