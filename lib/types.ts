export type NodeKind = "idea" | "decision" | "task" | "question" | "note";

export interface CanvasNode {
  id: string;
  kind: NodeKind;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  author: string;
  createdAt: number;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  color: string;
  text: string;
  createdAt: number;
}

export interface Participant {
  id: string; 
  name: string;
  color: string;
  x?: number;
  y?: number;
  joinedAt: number;
}

export interface RoomState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  messages: ChatMessage[];
}

export interface AIOpAddNode {
  op: "add_node";
  id: string; 
  kind: NodeKind;
  text: string;
  x?: number;
  y?: number;
}

export interface AIOpAddEdge {
  op: "add_edge";
  source: string; 
  target: string;
  label?: string;
}

export interface AIOpUpdateNode {
  op: "update_node";
  id: string; 
  text?: string;
  kind?: NodeKind;
}

export type AIOp = AIOpAddNode | AIOpAddEdge | AIOpUpdateNode;

export interface AIAnalyzeResponse {
  summary: string;
  ops: AIOp[];
}

export interface WebRTCSignal {
  to: string;
  from?: string;
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "canvas:nodes": (nodes: CanvasNode[]) => void;
  "canvas:node-update": (node: CanvasNode) => void;
  "canvas:node-remove": (id: string) => void;
  "canvas:edges": (edges: CanvasEdge[]) => void;
  "chat:message": (message: ChatMessage) => void;
  "presence:list": (participants: Participant[]) => void;
  "presence:cursor": (p: { id: string; x: number; y: number }) => void;
  "ai:thinking": (thinking: boolean) => void;
  "ai:summary": (summary: string) => void;
  "webrtc:peers": (payload: { peers: string[] }) => void;
  "webrtc:signal": (payload: WebRTCSignal) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: { room: string; name: string }) => void;
  "canvas:node-add": (node: CanvasNode) => void;
  "canvas:node-move": (payload: { id: string; x: number; y: number }) => void;
  "canvas:node-edit": (payload: { id: string; text: string }) => void;
  "canvas:node-remove": (id: string) => void;
  "canvas:edge-add": (edge: CanvasEdge) => void;
  "chat:message": (payload: { text: string }) => void;
  "presence:cursor": (payload: { x: number; y: number }) => void;
  "ai:command": (payload: { instruction: string }) => void;
  "webrtc:signal": (payload: WebRTCSignal) => void;
}

export const NODE_COLORS: Record<NodeKind, string> = {
  idea: "#ffd166",
  decision: "#06d6a0",
  task: "#4cc9f0",
  question: "#f78c6b",
  note: "#c8b6ff"
};

export const NODE_LABELS: Record<NodeKind, string> = {
  idea: "Idea",
  decision: "Decision",
  task: "Task",
  question: "Question",
  note: "Note"
};

export const PARTICIPANT_COLORS = [
  "#ef476f",
  "#06d6a0",
  "#118ab2",
  "#ffd166",
  "#8338ec",
  "#fb5607"
];
