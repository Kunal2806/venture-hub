"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import {
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import moment from "moment-timezone";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

type ConnectionStatus = "idle" | "requesting-permissions" | "connecting" | "connected" | "permission-denied" | "error";

export default function AgoraVoiceRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelName = searchParams.get("channel");
  const consultationId = searchParams.get("consultationId");

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micTrackRef = useRef<any>(null);
  const joinedRef = useRef(false);

  const [remoteJoined, setRemoteJoined] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ─── Permission check helper ─────────────────────────────────────────────────
  const checkAndRequestPermissions = async (): Promise<boolean> => {
    try {
      setStatus("requesting-permissions");

      if (navigator.permissions) {
        const micPerm = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (micPerm.state === "denied") {
          setStatus("permission-denied");
          setErrorMessage(
            "Microphone access is blocked. Please allow access in your browser settings and reload the page."
          );
          return false;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (err: any) {
      console.error("Permission error:", err);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("permission-denied");
        setErrorMessage(
          "Microphone access was denied. Please click the mic icon in your browser's address bar, allow access, and reload the page."
        );
      } else if (err.name === "NotFoundError") {
        setStatus("error");
        setErrorMessage("No microphone found. Please connect a device and reload.");
      } else if (err.name === "NotReadableError") {
        setStatus("error");
        setErrorMessage(
          "Microphone is already in use by another application. Close other apps using it and reload."
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
      // Step 1: permissions
      const hasPermission = await checkAndRequestPermissions();
      if (!hasPermission || !mounted) {
        joinedRef.current = false;
        return;
      }

      setStatus("connecting");

      try {
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          setRemoteJoined(true);
          await client.subscribe(user, mediaType);
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", () => {
          // optional: handle remote mute
        });

        client.on("user-left", () => {
          setRemoteJoined(false);
        });

        // ── Token fetch ───────────────────────────────────────────────────
        const response = await fetch(
          `/api/mobile/agora/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelName }),
          }
        );

        if (!response.ok) {
          throw new Error(`Token fetch failed: ${response.status}`);
        }

        const data = await response.json();
        if (!mounted) return;

        // ── Join channel ──────────────────────────────────────────────────
        await client.join(APP_ID, data.channelName, data.token, data.uid);

        const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
        micTrackRef.current = micTrack;
        await client.publish([micTrack]);

        // ── Handle already-present remote users ───────────────────────────
        for (const user of client.remoteUsers) {
          if (user.hasAudio) {
            await client.subscribe(user, "audio");
            user.audioTrack?.play();
          }
          setRemoteJoined(true);
        }

        if (mounted) {
          setJoined(true);
          setStatus("connected");
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
      if (micTrackRef.current) {
        micTrackRef.current.close();
        micTrackRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.leave();
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
    };
  }, [channelName]);

  // ─── Fetch consultation end time ─────────────────────────────────────────────
  useEffect(() => {
    if (!joined || !consultationId) return;

    const fetchConsultationTime = async () => {
      try {
        const res = await fetch(
          `/api/astrologer/consultation/${consultationId}`
        );
        const json = await res.json();
        const toTime: string = json?.data?.toTime ?? json?.toTime;
        if (!toTime) {
          console.error("toTime missing in response", json);
          return;
        }
        const todayIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
        const endISO = moment
          .tz(`${todayIST} ${toTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata")
          .toISOString();
        console.log("✅ Call ends at:", endISO);
        setEndTime(endISO);
      } catch (err) {
        console.error("Failed to fetch consultation time:", err);
      }
    };

    fetchConsultationTime();
  }, [joined, consultationId]);

  // ─── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!endTime) return;

    const endDateTime = moment(endTime);

    const tick = () => {
      const remaining = endDateTime.diff(moment());
      if (remaining <= 0) {
        setTimeRemaining("00:00");
        leaveCall();
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(
        `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    tick();
    const ticker = setInterval(tick, 1000);
    return () => clearInterval(ticker);
  }, [endTime]);

  // ─── Actions ──────────────────────────────────────────────────────────────────
  const leaveCall = async () => {
    joinedRef.current = false;
    if (micTrackRef.current) {
      micTrackRef.current.close();
      micTrackRef.current = null;
    }
    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current.removeAllListeners();
      clientRef.current = null;
    }
    router.back();
  };

  const toggleMic = async () => {
    if (!micTrackRef.current) return;
    const newState = !micOn;
    await micTrackRef.current.setEnabled(newState);
    setMicOn(newState);
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
              <p>1. Click the 🔒 or 🎤 icon in your browser address bar</p>
              <p>2. Set Microphone to <strong>Allow</strong></p>
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
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-black to-gray-950 text-white flex flex-col items-center justify-center">

      {/* Connecting / Requesting Permissions Overlay */}
      {(status === "idle" || status === "requesting-permissions" || status === "connecting") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white z-50">
          <Loader2 className="animate-spin w-10 h-10 mb-4" />
          <p className="text-lg font-medium">
            {status === "requesting-permissions"
              ? "Requesting microphone access..."
              : "Connecting..."}
          </p>
          {status === "requesting-permissions" && (
            <p className="text-sm text-gray-400 mt-2 text-center px-8">
              A browser popup may appear — please click <strong>Allow</strong>
            </p>
          )}
        </div>
      )}

      {/* Timer */}
      {timeRemaining && (
        <div
          className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 ${
            parseInt(timeRemaining) <= 1
              ? "bg-red-600 text-white animate-pulse"
              : "bg-black/50 text-white"
          }`}
        >
          <span>⏱</span>
          <span>Time Remaining: {timeRemaining}</span>
        </div>
      )}

      {/* Waiting for remote user */}
      {joined && !remoteJoined && (
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full border border-white/20 animate-ping"></div>
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
              <Mic className="w-10 h-10 text-white/80" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold tracking-wide">Waiting for other participant</h2>
            <p className="text-sm text-gray-400 mt-2">The call will begin once they join.</p>
          </div>
        </div>
      )}

      {/* Connected */}
      {joined && remoteJoined && (
        <div className="flex flex-col items-center gap-10">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full bg-green-500/20 animate-pulse"></div>
            <div className="w-24 h-24 rounded-full bg-green-500/30 backdrop-blur-md border border-green-400/40 flex items-center justify-center shadow-xl">
              <Mic className="w-10 h-10 text-green-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-wide">Voice Call in Progress</h2>
        </div>
      )}

      {/* Controls */}
      {joined && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/40 backdrop-blur-lg px-8 py-4 rounded-full shadow-xl">
          <button
            onClick={toggleMic}
            className={`w-14 h-14 flex items-center justify-center rounded-full transition ${
              micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {micOn ? <Mic className="text-white" /> : <MicOff className="text-white" />}
          </button>

          <button
            onClick={leaveCall}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 transition"
          >
            <PhoneOff className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}