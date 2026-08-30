"use client";

import { useRef, useState } from "react";
import type { CanvasNode } from "@/lib/types";
import { NODE_LABELS } from "@/lib/types";

interface Props {
  node: CanvasNode;
  scale: number;
  onMove: (id: string, x: number, y: number) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onConnectClick: (id: string) => void;
  isConnectSource: boolean;
  connectionPending: boolean;
}

export default function NodeCard({
  node,
  scale,
  onMove,
  onEdit,
  onRemove,
  onConnectClick,
  isConnectSource,
  connectionPending
}: Props) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.text);
  const [dragging, setDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent) {
    if (editing) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / scale;
    const dy = (e.clientY - dragRef.current.startY) / scale;
    onMove(node.id, Math.round(dragRef.current.origX + dx), Math.round(dragRef.current.origY + dy));
  }

  function onPointerUp() {
    dragRef.current = null;
    setDragging(false);
  }

  function commitEdit() {
    setEditing(false);
    if (draft.trim() && draft !== node.text) onEdit(node.id, draft.trim());
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => setEditing(true)}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.w,
        minHeight: node.h,
        background: node.color,
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: dragging
          ? "0 12px 24px rgba(0,0,0,0.35)"
          : "0 2px 8px rgba(0,0,0,0.25)",
        cursor: editing ? "text" : dragging ? "grabbing" : "grab",
        color: "#141414",
        userSelect: editing ? "text" : "none",
        transition: dragging ? "none" : "box-shadow 120ms ease, outline-color 120ms ease",
        outline: isConnectSource
          ? "2px dashed #141414"
          : connectionPending
            ? "2px dashed rgba(20,20,20,0.35)"
            : "none",
        touchAction: "none"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, opacity: 0.65 }}>
          {NODE_LABELS[node.kind].toUpperCase()}
        </span>
        <div data-no-drag style={{ display: "flex", gap: 6 }}>
          <button
            title={
              isConnectSource
                ? "Cancel connecting"
                : connectionPending
                  ? "Finish connection here"
                  : "Connect to another node"
            }
            onClick={(e) => {
              e.stopPropagation();
              onConnectClick(node.id);
            }}
            style={{
              border: "none",
              background: isConnectSource ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.12)",
              borderRadius: 6,
              width: 20,
              height: 20,
              fontSize: 11,
              lineHeight: "20px",
              padding: 0
            }}
          >
            {connectionPending && !isConnectSource ? "✓" : "↗"}
          </button>
          <button
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(node.id);
            }}
            style={{
              border: "none",
              background: "rgba(0,0,0,0.12)",
              borderRadius: 6,
              width: 20,
              height: 20,
              fontSize: 11,
              lineHeight: "20px",
              padding: 0
            }}
          >
            ×
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          data-no-drag
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitEdit();
            }
          }}
          style={{
            width: "100%",
            minHeight: 48,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 13,
            fontWeight: 600,
            color: "#141414"
          }}
        />
      ) : (
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{node.text}</p>
      )}

      <div style={{ fontSize: 10, opacity: 0.55, marginTop: 8 }}>{node.author}</div>
    </div>
  );
}
