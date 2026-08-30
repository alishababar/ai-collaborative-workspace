"use client";

import { useEffect, useRef } from "react";

interface Props {
  stream: MediaStream | null;
  label: string;
  color: string;
  muted?: boolean;
  isSelf?: boolean;
  videoOff?: boolean;
  footer?: React.ReactNode;
}

export default function VideoTile({ stream, label, color, muted, isSelf, videoOff, footer }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const showVideo = stream && !videoOff;

  return (
    <div
      style={{
        position: "relative",
        width: 168,
        height: 108,
        flex: "0 0 auto",
        borderRadius: 10,
        overflow: "hidden",
        background: "#1a1d23",
        border: "1px solid var(--border)"
      }}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: isSelf ? "scaleX(-1)" : "none"
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(160deg, #1c2027, #14161a)"
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: color,
              color: "#141414",
              fontSize: 15,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {label.slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}

      {showVideo && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 36,
            background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
            pointerEvents: "none"
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: 6,
          bottom: 6,
          right: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: "#fff",
            background: "rgba(0,0,0,0.5)",
            padding: "2px 6px",
            borderRadius: 5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 110
          }}
        >
          {label}
        </span>
        {footer}
      </div>
    </div>
  );
}
