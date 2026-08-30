"use client";

import type { Participant } from "@/lib/types";
import type { WebRTCState } from "@/lib/useWebRTC";
import VideoTile from "./VideoTile";

interface Props {
  selfName: string;
  selfColor: string;
  webrtc: WebRTCState;
  peers: Participant[]; 
}

function IconButton({
  active,
  onClick,
  onLabel,
  offLabel,
  onIcon,
  offIcon
}: {
  active: boolean;
  onClick: () => void;
  onLabel: string;
  offLabel: string;
  onIcon: string;
  offIcon: string;
}) {
  return (
    <button
      onClick={onClick}
      title={active ? onLabel : offLabel}
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: "none",
        background: active ? "rgba(255,255,255,0.18)" : "var(--danger)",
        color: "#fff",
        fontSize: 11,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0
      }}
    >
      {active ? onIcon : offIcon}
    </button>
  );
}

export default function VideoBar({ selfName, selfColor, webrtc, peers }: Props) {
  const { localStream, mediaError, remoteStreams, micOn, camOn, toggleMic, toggleCam } = webrtc;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
        overflowX: "auto"
      }}
    >
      <VideoTile
        stream={localStream}
        label={`${selfName} (you)`}
        color={selfColor}
        isSelf
        muted
        videoOff={!camOn}
        footer={
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton
              active={micOn}
              onClick={toggleMic}
              onLabel="Mute"
              offLabel="Unmute"
              onIcon="●"
              offIcon="✕"
            />
            <IconButton
              active={camOn}
              onClick={toggleCam}
              onLabel="Turn camera off"
              offLabel="Turn camera on"
              onIcon="▮"
              offIcon="✕"
            />
          </div>
        }
      />

      {peers.map((p) => (
        <VideoTile
          key={p.id}
          stream={remoteStreams.get(p.id) ?? null}
          label={p.name}
          color={p.color}
        />
      ))}

      {mediaError && (
        <div
          style={{
            alignSelf: "center",
            fontSize: 11.5,
            color: "var(--text-dim)",
            maxWidth: 220,
            lineHeight: 1.4
          }}
        >
          {mediaError}
        </div>
      )}
    </div>
  );
}
