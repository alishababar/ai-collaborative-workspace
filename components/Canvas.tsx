"use client";

import { useRef, useState, useCallback } from "react";
import type { CanvasNode, CanvasEdge, Participant } from "@/lib/types";
import NodeCard from "./NodeCard";

interface Props {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  cursors: Map<string, { x: number; y: number }>;
  participants: Participant[];
  onMove: (id: string, x: number, y: number) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onAddEdge: (source: string, target: string) => void;
  onCursor: (x: number, y: number) => void;
}

export default function Canvas({
  nodes,
  edges,
  cursors,
  participants,
  onMove,
  onEdit,
  onRemove,
  onAddEdge,
  onCursor
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const panRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  const nodeById = useCallback((id: string) => nodes.find((n) => n.id === id), [nodes]);

  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setScale((s) => Math.min(1.6, Math.max(0.5, s - e.deltaY * 0.001)));
  }

  function onBackgroundPointerDown(e: React.PointerEvent) {
    if (e.target !== e.currentTarget) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    if (connectFrom) setConnectFrom(null);
  }

  function onBackgroundPointerMove(e: React.PointerEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      onCursor(
        Math.round((e.clientX - rect.left - offset.x) / scale),
        Math.round((e.clientY - rect.top - offset.y) / scale)
      );
    }
    if (!panRef.current) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setOffset({ x: panRef.current.origX + dx, y: panRef.current.origY + dy });
  }

  function onBackgroundPointerUp() {
    panRef.current = null;
  }

  function centerOf(n: CanvasNode) {
    return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
  }

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onBackgroundPointerMove}
      onPointerUp={onBackgroundPointerUp}
      style={{
        position: "relative",
        flex: 1,
        overflow: "hidden",
        background:
          "radial-gradient(circle, #262b33 1px, transparent 1px) 0 0 / 24px 24px, var(--bg-canvas)",
        touchAction: "none",
        cursor: panRef.current ? "grabbing" : "default"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0"
        }}
      >
        <svg
          style={{ position: "absolute", overflow: "visible", pointerEvents: "none", left: 0, top: 0 }}
        >
          {edges.map((edge) => {
            const s = nodeById(edge.source);
            const t = nodeById(edge.target);
            if (!s || !t) return null;
            const a = centerOf(s);
            const b = centerOf(t);
            return (
              <g key={edge.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#414852"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                />
                {edge.label && (
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2 - 6}
                    fill="#9aa1ab"
                    fontSize={11}
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#414852" />
            </marker>
          </defs>
        </svg>

        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            scale={scale}
            onMove={onMove}
            onEdit={onEdit}
            onRemove={onRemove}
            isConnectSource={connectFrom === node.id}
            connectionPending={connectFrom !== null}
            onConnectClick={(id) => {
              setConnectFrom((prev) => {
                if (prev === null) return id; 
                if (prev === id) return null; 
                onAddEdge(prev, id); 
                return null;
              });
            }}
          />
        ))}

        {participants.map((p) => {
          const c = cursors.get(p.id);
          if (!c) return null;
          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: c.x,
                top: c.y,
                pointerEvents: "none",
                transition: "left 80ms linear, top 80ms linear",
                zIndex: 50
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M1 1 L15 8 L8 9 L6 15 Z" fill={p.color} />
              </svg>
              <span
                style={{
                  background: p.color,
                  color: "#141414",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 6,
                  marginLeft: 12,
                  whiteSpace: "nowrap"
                }}
              >
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {nodes.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "var(--text-dim)",
            pointerEvents: "none",
            textAlign: "center",
            padding: 24
          }}
        >
          <div style={{ fontSize: 26, opacity: 0.5 }}>◈</div>
          <div style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.5 }}>
            Start talking in the panel on the right — the AI will turn the conversation into
            ideas, decisions, tasks and questions right here.
          </div>
        </div>
      )}
    </div>
  );
}
