"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/lib/useSocket";
import { useWebRTC } from "@/lib/useWebRTC";
import type { CanvasNode, CanvasEdge, ChatMessage, Participant, NodeKind } from "@/lib/types";
import { NODE_COLORS } from "@/lib/types";
import TopBar from "@/components/TopBar";
import VideoBar from "@/components/VideoBar";
import Canvas from "@/components/Canvas";
import SidePanel from "@/components/SidePanel";

const ADJECTIVES = ["Swift", "Calm", "Bold", "Bright", "Quiet", "Sharp", "Kind", "Quick"];
const ANIMALS = ["Fox", "Owl", "Lynx", "Hawk", "Wren", "Otter", "Falcon", "Heron"];

function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const b = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${a} ${b}`;
}

export default function Page() {
  const socket = useSocket();

  const [room, setRoom] = useState("main");
  const [selfName, setSelfName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);

  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [aiThinking, setAiThinking] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRoom(params.get("room") || "main");
    setNameDraft(randomName());
  }, []);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onRoomState(state: { nodes: CanvasNode[]; edges: CanvasEdge[]; messages: ChatMessage[] }) {
      setNodes(state.nodes);
      setEdges(state.edges);
      setMessages(state.messages);
    }
    function onNodesAdd(added: CanvasNode[]) {
      setNodes((prev) => [...prev, ...added]);
    }
    function onNodeUpdate(node: CanvasNode) {
      setNodes((prev) => {
        const exists = prev.some((n) => n.id === node.id);
        return exists ? prev.map((n) => (n.id === node.id ? node : n)) : [...prev, node];
      });
    }
    function onNodeRemove(id: string) {
      setNodes((prev) => prev.filter((n) => n.id !== id));
      setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    }
    function onEdges(all: CanvasEdge[]) {
      setEdges(all);
    }
    function onMessage(m: ChatMessage) {
      setMessages((prev) => [...prev, m]);
    }
    function onPresence(list: Participant[]) {
      setParticipants(list);
    }
    function onCursor(p: { id: string; x: number; y: number }) {
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(p.id, { x: p.x, y: p.y });
        return next;
      });
    }
    function onThinking(t: boolean) {
      setAiThinking(t);
    }
    function onSummary(s: string) {
      setAiSummary(s);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onRoomState);
    socket.on("canvas:nodes", onNodesAdd);
    socket.on("canvas:node-update", onNodeUpdate);
    socket.on("canvas:node-remove", onNodeRemove);
    socket.on("canvas:edges", onEdges);
    socket.on("chat:message", onMessage);
    socket.on("presence:list", onPresence);
    socket.on("presence:cursor", onCursor);
    socket.on("ai:thinking", onThinking);
    socket.on("ai:summary", onSummary);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onRoomState);
      socket.off("canvas:nodes", onNodesAdd);
      socket.off("canvas:node-update", onNodeUpdate);
      socket.off("canvas:node-remove", onNodeRemove);
      socket.off("canvas:edges", onEdges);
      socket.off("chat:message", onMessage);
      socket.off("presence:list", onPresence);
      socket.off("presence:cursor", onCursor);
      socket.off("ai:thinking", onThinking);
      socket.off("ai:summary", onSummary);
    };
  }, [socket]);

  function joinRoom() {
    const name = nameDraft.trim() || randomName();
    setSelfName(name);
    setJoined(true);
    socket.emit("room:join", { room, name });
  }

  function handleMove(id: string, x: number, y: number) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    socket.emit("canvas:node-move", { id, x, y });
  }

  function handleEdit(id: string, text: string) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    socket.emit("canvas:node-edit", { id, text });
  }

  function handleRemove(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    socket.emit("canvas:node-remove", id);
  }

  function handleAddEdge(source: string, target: string) {
    const edge: CanvasEdge = { id: crypto.randomUUID(), source, target };
    setEdges((prev) => [...prev, edge]);
    socket.emit("canvas:edge-add", edge);
  }

  function handleAddNote(kind: NodeKind) {
    const node: CanvasNode = {
      id: crypto.randomUUID(),
      kind,
      text: "New note — double-click to edit",
      x: 120 + Math.random() * 300,
      y: 120 + Math.random() * 220,
      w: 180,
      h: 96,
      color: NODE_COLORS[kind],
      author: selfName,
      createdAt: Date.now()
    };
    setNodes((prev) => [...prev, node]);
    socket.emit("canvas:node-add", node);
  }

  function handleSend(text: string) {
    socket.emit("chat:message", { text });
  }

  function handleCommand(text: string) {
    setAiSummary(null);
    socket.emit("ai:command", { instruction: text });
  }

  function handleCursor(x: number, y: number) {
    socket.emit("presence:cursor", { x, y });
  }

  const others = useMemo(
    () => participants.filter((p) => p.id !== socket.id),
    [participants, socket.id]
  );
  const activeIds = useMemo(() => others.map((p) => p.id), [others]);
  const webrtc = useWebRTC(socket, socket.id, activeIds);
  const selfColor = useMemo(
    () => participants.find((p) => p.id === socket.id)?.color ?? "#6ee7f2",
    [participants, socket.id]
  );

  if (!joined) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, rgba(110,231,242,0.06), transparent 40%), radial-gradient(circle at 75% 75%, rgba(131,56,236,0.08), transparent 45%), var(--bg)"
        }}
      >
        <div
          style={{
            width: 340,
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-2)",
            padding: "32px 28px",
            animation: "fadeIn 200ms ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                color: "#0e1013"
              }}
            >
              ◈
            </div>
          </div>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <h1 style={{ fontSize: 19, margin: "0 0 8px", fontWeight: 700, letterSpacing: -0.3 }}>
              Weave
            </h1>
            <p style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
              Talk with your team on video. The AI listens and turns the conversation into a
              shared visual canvas — live, for everyone in the room.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              joinRoom();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)" }}>
                DISPLAY NAME
              </span>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Your display name"
                style={{
                  background: "var(--panel-2)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text)",
                  padding: "10px 12px",
                  fontSize: 14
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)" }}>
                ROOM
              </span>
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value || "main")}
                placeholder="Room name"
                style={{
                  background: "var(--panel-2)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text)",
                  padding: "10px 12px",
                  fontSize: 14
                }}
              />
            </label>
            <button
              type="submit"
              style={{
                marginTop: 8,
                background: "linear-gradient(135deg, var(--accent), #5ad0dc)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "11px 12px",
                fontWeight: 700,
                fontSize: 14,
                color: "#0e1013"
              }}
            >
              Enter workspace
            </button>
            <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", margin: "6px 0 0" }}>
              You&apos;ll be asked to allow camera &amp; microphone access.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar room={room} selfName={selfName} participants={participants} connected={connected} />
      <VideoBar selfName={selfName} selfColor={selfColor} webrtc={webrtc} peers={others} />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Canvas
          nodes={nodes}
          edges={edges}
          cursors={cursors}
          participants={others}
          onMove={handleMove}
          onEdit={handleEdit}
          onRemove={handleRemove}
          onAddEdge={handleAddEdge}
          onCursor={handleCursor}
        />
        <SidePanel
          messages={messages}
          selfName={selfName}
          aiThinking={aiThinking}
          aiSummary={aiSummary}
          onSend={handleSend}
          onCommand={handleCommand}
          onAddNote={handleAddNote}
        />
      </div>
    </div>
  );
}
