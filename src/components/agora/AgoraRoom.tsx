"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!

type ConnectionStatus = "idle" | "requesting-permissions" | "connecting" | "connected" | "permission-denied" | "error";

export default function AgoraRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelName = searchParams.get("channel");
  const role = searchParams.get("role"); // "mentor" ya "startup"
  const sessionId = searchParams.get("sessionId");
    console.log("🔍 AgoraRoom STARTUP:", { 
    channelName, 
    role, 
    sessionId,
    allParams: Object.fromEntries(searchParams.entries())
  });

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<{ micTrack: any; camTrack: any } | null>(null);
  const localRef = useRef<HTMLDivElement | null>(null);
  const joinedRef = useRef(false);

  const [remoteJoined, setRemoteJoined] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ─── Permission check helper ────────────────────────────────────────────────
  const checkAndRequestPermissions = async (): Promise<boolean> => {
    try {
      setStatus("requesting-permissions");

      if (navigator.permissions) {
        const [camPerm, micPerm] = await Promise.all([
          navigator.permissions.query({ name: "camera" as PermissionName }),
          navigator.permissions.query({ name: "microphone" as PermissionName }),
        ]);

        if (camPerm.state === "denied" || micPerm.state === "denied") {
          setStatus("permission-denied");
          setErrorMessage(
            "Camera or microphone access is blocked. Please allow access in your browser settings and reload the page."
          );
          return false;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (err: any) {
      console.error("Permission error:", err);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setStatus("permission-denied");
        setErrorMessage(
          "Camera/microphone access was denied. Please click the camera icon in your browser's address bar, allow access, and reload the page."
        );
      } else if (err.name === "NotFoundError") {
        setStatus("error");
        setErrorMessage(
          "No camera or microphone found. Please connect a device and reload."
        );
      } else if (err.name === "NotReadableError") {
        setStatus("error");
        setErrorMessage(
          "Camera or microphone is already in use by another application. Close other apps using them and reload."
        );
      } else {
        setStatus("error");
        setErrorMessage(`Device error: ${err.message || err.name}`);
      }
      return false;
    }
  };

  // ─── Main Agora init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!channelName) return;
    if (joinedRef.current) return;
    joinedRef.current = true;

    let mounted = true;

    const init = async () => {
      const hasPermission = await checkAndRequestPermissions();
      if (!hasPermission || !mounted) {
        joinedRef.current = false;
        return;
      }

      setStatus("connecting");

      try {
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // ── Remote user handlers ──────────────────────────────────────────
        client.on("user-published", async (user, mediaType) => {
          setRemoteJoined(true);
          await client.subscribe(user, mediaType);

          if (mediaType === "video") {
            const remoteContainer = document.getElementById("remote-container");
            let remoteDiv = document.getElementById(`remote-${user.uid}`);
            if (!remoteDiv) {
              remoteDiv = document.createElement("div");
              remoteDiv.id = `remote-${user.uid}`;
              Object.assign(remoteDiv.style, {
                width: "100%",
                height: "100%",
                position: "absolute",
                top: "0",
                left: "0",
              });
              remoteContainer?.appendChild(remoteDiv);
            }
            user.videoTrack?.play(`remote-${user.uid}`);
          }

          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            document.getElementById(`remote-${user.uid}`)?.remove();
          }
        });

        client.on("user-left", (user) => {
          document.getElementById(`remote-${user.uid}`)?.remove();
          setRemoteJoined(false);
        });

        // ── Token fetch ───────────────────────────────────────────────────
        const response = await fetch(`/api/agora`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            channelName, 
            sessionId,
            role 
          }),
        });

        if (!response.ok) {
          throw new Error(`Token fetch failed: ${response.status}`);
        }

        const data = await response.json();
        if (!mounted) return;

        // ── Join channel ──────────────────────────────────────────────────
        await client.join(APP_ID, data.channelName, data.token, data.uid);

        // ── Create & publish tracks ───────────────────────────────────────
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        tracksRef.current = { micTrack, camTrack };
        await client.publish([micTrack, camTrack]);

        await new Promise((resolve) => setTimeout(resolve, 150));

        if (localRef.current && mounted) {
          camTrack.play(localRef.current);
        }

        if (mounted) {
          setJoined(true);
          setStatus("connected");
        }

        // ── Handle already-present remote users ───────────────────────────
        for (const user of client.remoteUsers) {
          if (user.hasVideo) {
            await client.subscribe(user, "video");
            const remoteContainer = document.getElementById("remote-container");
            let remoteDiv = document.getElementById(`remote-${user.uid}`);
            if (!remoteDiv) {
              remoteDiv = document.createElement("div");
              remoteDiv.id = `remote-${user.uid}`;
              Object.assign(remoteDiv.style, {
                width: "100%",
                height: "100%",
                position: "absolute",
                top: "0",
                left: "0",
              });
              remoteContainer?.appendChild(remoteDiv);
            }
            user.videoTrack?.play(`remote-${user.uid}`);
          }
          if (user.hasAudio) {
            await client.subscribe(user, "audio");
            user.audioTrack?.play();
          }
          setRemoteJoined(true);
        }
      } catch (err: any) {
        console.error("Agora error:", err);
        joinedRef.current = false;

        if (mounted) {
          setStatus("error");
          setErrorMessage(
            err?.message || "Failed to connect. Please check your internet connection and try again."
          );
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (tracksRef.current) {
        tracksRef.current.micTrack?.close();
        tracksRef.current.camTrack?.close();
        tracksRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.leave();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
    };
  }, [channelName, sessionId, role]);

  // ─── Actions ──────────────────────────────────────────────────────────────────
  const leaveCall = async () => {
    joinedRef.current = false;
    if (tracksRef.current) {
      tracksRef.current.micTrack?.close();
      tracksRef.current.camTrack?.close();
      tracksRef.current = null;
    }
    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current.removeAllListeners();
      clientRef.current = null;
    }
    router.back();
  };

  const toggleMic = async () => {
    if (!tracksRef.current) return;
    const newState = !micOn;
    await tracksRef.current.micTrack.setEnabled(newState);
    setMicOn(newState);
  };

  const toggleCam = async () => {
    if (!tracksRef.current) return;
    const newState = !camOn;
    await tracksRef.current.camTrack.setEnabled(newState);
    if (newState && localRef.current) {
      setTimeout(() => {
        tracksRef.current?.camTrack.play(localRef.current!);
      }, 100);
    }
    setCamOn(newState);
  };

  // ─── Permission denied / error screen ────────────────────────────────────────
  if (status === "permission-denied" || status === "error") {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black z-[9999] flex flex-col items-center justify-center text-white px-6">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-5 border border-white/20">
          {status === "permission-denied" ? (
            <ShieldAlert className="w-12 h-12 text-yellow-400" />
          ) : (
            <AlertCircle className="w-12 h-12 text-red-400" />
          )}
          <h2 className="text-lg font-semibold">
            {status === "permission-denied" ? "Permission Required" : "Connection Error"}
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">{errorMessage}</p>

          {status === "permission-denied" && (
            <div className="text-xs text-gray-400 bg-white/5 rounded-xl p-3 text-left w-full">
              <p className="font-medium text-white mb-1">How to fix:</p>
              <p>1. Click the 🔒 or 📷 icon in your browser address bar</p>
              <p>2. Set Camera & Microphone to <strong>Allow</strong></p>
              <p>3. Reload the page</p>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition"
          >
            Reload & Try Again
          </button>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black z-[9999] flex flex-col">

      {/* Remote Video */}
      <div id="remote-container" className="absolute inset-0" />

      {/* Local Video */}
      <div
        ref={localRef}
        className="absolute bottom-28 right-6 w-36 h-48 rounded-xl overflow-hidden border-2 border-white shadow-xl bg-gray-800 z-10"
      />

      {/* Connecting / Requesting Permissions Overlay */}
      {(status === "idle" || status === "requesting-permissions" || status === "connecting") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white z-50">
          <Loader2 className="animate-spin w-10 h-10 mb-4" />
          <p className="text-lg font-medium">
            {status === "requesting-permissions"
              ? "Requesting camera & mic access..."
              : "Connecting..."}
          </p>
          {status === "requesting-permissions" && (
            <p className="text-sm text-gray-400 mt-2 text-center px-8">
              A browser popup may appear — please click <strong>Allow</strong>
            </p>
          )}
        </div>
      )}

      {/* Waiting for remote user */}
      {joined && !remoteJoined && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center gap-6 pointer-events-auto">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute w-24 h-24 rounded-full border border-white/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
                <Video className="w-8 h-8 text-white/80" />
              </div>
            </div>
            <div className="px-10 py-6 text-center text-white">
              <h2 className="text-lg font-semibold tracking-wide">
                Waiting for {role === "mentor" ? "startup" : "mentor"} to join...
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                The session will begin once they join.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connected - Call in Progress */}
      {/* {joined && remoteJoined && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="text-center text-white/60 text-sm">
            Call in progress
          </div>
        </div>
      )} */}

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/40 backdrop-blur-lg px-8 py-4 rounded-full shadow-xl z-10">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition ${
            micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {micOn ? <Mic className="text-white" /> : <MicOff className="text-white" />}
        </button>

        <button
          onClick={toggleCam}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition ${
            camOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {camOn ? <Video className="text-white" /> : <VideoOff className="text-white" />}
        </button>

        <button
          onClick={leaveCall}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 transition"
        >
          <PhoneOff className="text-white" />
        </button>
      </div>
    </div>
  );
}