"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, NodeKind } from "@/lib/types";
import { NODE_COLORS, NODE_LABELS } from "@/lib/types";

interface Props {
  messages: ChatMessage[];
  selfName: string;
  aiThinking: boolean;
  aiSummary: string | null;
  onSend: (text: string) => void;
  onCommand: (text: string) => void;
  onAddNote: (kind: NodeKind) => void;
}

export default function SidePanel({
  messages,
  selfName,
  aiThinking,
  aiSummary,
  onSend,
  onCommand,
  onAddNote
}: Props) {
  const [text, setText] = useState("");
  const [command, setCommand] = useState("");
  const [tab, setTab] = useState<"talk" | "ai">("talk");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  return (
    <aside
      style={{
        width: 340,
        display: "flex",
        flexDirection: "column",
        background: "var(--panel)",
        borderLeft: "1px solid var(--border)",
        height: "100%"
      }}
    >
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {(["talk", "ai"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t ? "var(--text)" : "var(--text-dim)",
              fontSize: 13,
              fontWeight: 600
            }}
          >
            {t === "talk" ? "Conversation" : "Ask the AI"}
          </button>
        ))}
      </div>

      {tab === "talk" ? (
        <>
          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            {messages.length === 0 && (
              <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
                Say what&apos;s on your mind — type as if you were speaking in the meeting. The AI
                reads along and grows the board.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 14, animation: "fadeIn 180ms ease" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.author}</span>
                  <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 13.5, lineHeight: 1.45, color: "var(--text)" }}>
                  {m.text}
                </p>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              onSend(text.trim());
              setText("");
            }}
            style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Speak as ${selfName}…`}
              style={{
                flex: 1,
                background: "var(--panel-2)",
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                color: "var(--text)",
                padding: "9px 10px",
                fontSize: 13,
                outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                padding: "0 14px",
                fontWeight: 700,
                fontSize: 13,
                color: "#0e1013"
              }}
            >
              Send
            </button>
          </form>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 14, gap: 14 }}>
          <p style={{ fontSize: 13, color: "var(--text-dim)", margin: 0, lineHeight: 1.5 }}>
            Give the AI a direct instruction about the board — it can reorganize, connect related
            nodes, break a task down, or summarize open questions.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Connect related ideas with arrows",
              "Turn the open questions into tasks",
              "Summarize decisions made so far as one note"
            ].map((s) => (
              <button
                key={s}
                onClick={() => onCommand(s)}
                style={{
                  textAlign: "left",
                  background: "var(--panel-2)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 8,
                  color: "var(--text)",
                  padding: "8px 10px",
                  fontSize: 12.5
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!command.trim()) return;
              onCommand(command.trim());
              setCommand("");
            }}
            style={{ display: "flex", gap: 8, marginTop: "auto" }}
          >
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g. group the tasks by owner"
              style={{
                flex: 1,
                background: "var(--panel-2)",
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                color: "var(--text)",
                padding: "9px 10px",
                fontSize: 13,
                outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--accent-2)",
                border: "none",
                borderRadius: 8,
                padding: "0 14px",
                fontWeight: 700,
                fontSize: 13,
                color: "#fff"
              }}
            >
              Ask
            </button>
          </form>

          <div
            style={{
              minHeight: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: aiThinking ? "var(--accent)" : "var(--text-dim)",
              background: aiThinking || aiSummary ? "var(--panel-2)" : "transparent",
              border: aiThinking || aiSummary ? "1px solid var(--border-soft)" : "none",
              borderRadius: 8,
              padding: aiThinking || aiSummary ? "8px 10px" : 0
            }}
          >
            {aiThinking ? (
              <>
                <span style={{ display: "flex", gap: 3 }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        background: "var(--accent)",
                        animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`
                      }}
                    />
                  ))}
                </span>
                AI is thinking…
              </>
            ) : (
              aiSummary && <span>✦ {aiSummary}</span>
            )}
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border)", padding: 12 }}>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 8, fontWeight: 700 }}>
          ADD MANUALLY
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(Object.keys(NODE_COLORS) as NodeKind[]).map((kind) => (
            <button
              key={kind}
              onClick={() => onAddNote(kind)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--panel-2)",
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                color: "var(--text)"
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: NODE_COLORS[kind],
                  display: "inline-block"
                }}
              />
              {NODE_LABELS[kind]}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
