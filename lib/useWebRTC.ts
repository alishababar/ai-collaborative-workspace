"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSocket } from "./useSocket";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
];

interface PeerEntry {
  connection: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[];
}

export interface WebRTCState {
  localStream: MediaStream | null;
  mediaError: string | null;
  remoteStreams: Map<string, MediaStream>;
  micOn: boolean;
  camOn: boolean;
  toggleMic: () => void;
  toggleCam: () => void;
}



export function useWebRTC(socket: AppSocket, selfId: string | undefined, activeIds: string[]): WebRTCState {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      })
      .catch(() => {
        if (!cancelled) setMediaError("Camera/mic unavailable — joining view-only.");
      });
    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const closePeer = useCallback((id: string) => {
    const entry = peersRef.current.get(id);
    if (entry) {
      entry.connection.close();
      peersRef.current.delete(id);
    }
    setRemoteStreams((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const createPeer = useCallback(
    (id: string) => {
      const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const entry: PeerEntry = { connection, pendingCandidates: [] };
      peersRef.current.set(id, entry);

      localStreamRef.current?.getTracks().forEach((track) => {
        connection.addTrack(track, localStreamRef.current!);
      });

      connection.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc:signal", { to: id, candidate: e.candidate.toJSON() });
        }
      };

      connection.ontrack = (e) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(id, e.streams[0]);
          return next;
        });
      };

      connection.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
          closePeer(id);
        }
      };

      return entry;
    },
    [socket, closePeer]
  );

  useEffect(() => {
    function onPeers({ peers }: { peers: string[] }) {
      peers.forEach(async (id) => {
        const entry = peersRef.current.get(id) ?? createPeer(id);
        const offer = await entry.connection.createOffer();
        await entry.connection.setLocalDescription(offer);
        socket.emit("webrtc:signal", { to: id, description: offer });
      });
    }
    socket.on("webrtc:peers", onPeers);
    return () => {
      socket.off("webrtc:peers", onPeers);
    };
  }, [socket, createPeer]);

  useEffect(() => {
    async function onSignal(payload: {
      from?: string;
      description?: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
    }) {
      const from = payload.from;
      if (!from) return;

      let entry = peersRef.current.get(from);

      if (payload.description) {
        if (payload.description.type === "offer") {
          entry = entry ?? createPeer(from);
          await entry.connection.setRemoteDescription(payload.description);
          for (const c of entry.pendingCandidates) await entry.connection.addIceCandidate(c);
          entry.pendingCandidates = [];
          const answer = await entry.connection.createAnswer();
          await entry.connection.setLocalDescription(answer);
          socket.emit("webrtc:signal", { to: from, description: answer });
        } else if (payload.description.type === "answer" && entry) {
          await entry.connection.setRemoteDescription(payload.description);
          for (const c of entry.pendingCandidates) await entry.connection.addIceCandidate(c);
          entry.pendingCandidates = [];
        }
      } else if (payload.candidate) {
        if (entry && entry.connection.remoteDescription) {
          await entry.connection.addIceCandidate(payload.candidate);
        } else if (entry) {
          entry.pendingCandidates.push(payload.candidate);
        }
      }
    }
    socket.on("webrtc:signal", onSignal);
    return () => {
      socket.off("webrtc:signal", onSignal);
    };
  }, [socket, createPeer]);

  useEffect(() => {
    const active = new Set(activeIds);
    for (const id of [...peersRef.current.keys()]) {
      if (!active.has(id)) closePeer(id);
    }
  }, [activeIds, closePeer]);

  useEffect(() => {
    return () => {
      for (const id of [...peersRef.current.keys()]) closePeer(id);
    };
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  const toggleCam = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }, []);

  return { localStream, mediaError, remoteStreams, micOn, camOn, toggleMic, toggleCam };
}
