"use client";

import { useState } from "react";
import type { Participant } from "@/lib/types";

interface Props {
  room: string;
  selfName: string;
  participants: Participant[];
  connected: boolean;
}

export default function TopBar({ room, selfName, participants, connected }: Props) {
  const [copied, setCopied] = useState(false);

  function share() {
    const url = `${window.location.origin}/?room=${encodeURIComponent(room)}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <header
      style={{
        height: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
        boxShadow: "var(--shadow-1)",
        zIndex: 10,
        position: "relative"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "#0e1013"
            }}
          >
            ◈
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: -0.2 }}>Weave</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--panel-2)",
            border: "1px solid var(--border-soft)",
            borderRadius: 999,
            padding: "5px 12px 5px 10px"
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              background: connected ? "var(--success)" : "var(--danger)",
              animation: connected ? "none" : "pulse 1.4s ease-in-out infinite"
            }}
          />
          <strong style={{ fontSize: 12.5, fontWeight: 600 }}>{room}</strong>
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
            {connected ? "live" : "connecting…"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", marginRight: 4 }}>
          {participants.map((p, i) => (
            <div
              key={p.id}
              title={p.name}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: p.color,
                color: "#141414",
                fontSize: 12,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--panel)",
                marginLeft: i === 0 ? 0 : -10,
                position: "relative"
              }}
            >
              {p.name.slice(0, 1).toUpperCase()}
              <span
                style={{
                  position: "absolute",
                  bottom: -1,
                  right: -1,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "var(--success)",
                  border: "2px solid var(--panel)"
                }}
              />
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>You: {selfName}</span>
        <button
          onClick={share}
          style={{
            background: copied ? "var(--success)" : "var(--panel-2)",
            border: "1px solid var(--border-soft)",
            borderRadius: 8,
            padding: "7px 13px",
            fontSize: 12,
            color: copied ? "#0e1013" : "var(--text)",
            fontWeight: 600
          }}
        >
          {copied ? "Link copied ✓" : "Invite"}
        </button>
      </div>
    </header>
  );
}
