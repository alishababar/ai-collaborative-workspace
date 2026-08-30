import type { CanvasNode, CanvasEdge, ChatMessage, RoomState } from "./types";

class RoomStore {
  private rooms = new Map<string, RoomState>();

  private ensure(room: string): RoomState {
    let state = this.rooms.get(room);
    if (!state) {
      state = { nodes: [], edges: [], messages: [] };
      this.rooms.set(room, state);
    }
    return state;
  }

  getState(room: string): RoomState {
    return this.ensure(room);
  }

  addNode(room: string, node: CanvasNode) {
    this.ensure(room).nodes.push(node);
  }

  updateNode(room: string, id: string, patch: Partial<CanvasNode>) {
    const state = this.ensure(room);
    const node = state.nodes.find((n) => n.id === id);
    if (node) Object.assign(node, patch);
    return node;
  }

  removeNode(room: string, id: string) {
    const state = this.ensure(room);
    state.nodes = state.nodes.filter((n) => n.id !== id);
    state.edges = state.edges.filter((e) => e.source !== id && e.target !== id);
  }

  addEdge(room: string, edge: CanvasEdge) {
    this.ensure(room).edges.push(edge);
  }

  addMessage(room: string, message: ChatMessage) {
    const state = this.ensure(room);
    state.messages.push(message);
    if (state.messages.length > 300) state.messages.shift();
  }

  recentTranscript(room: string, count = 20): ChatMessage[] {
    return this.ensure(room).messages.slice(-count);
  }
}

export const roomStore = new RoomStore();
