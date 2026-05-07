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
import moment from "moment-timezone";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!

type ConnectionStatus = "idle" | "requesting-permissions" | "connecting" | "connected" | "permission-denied" | "error";

export default function AgoraRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelName = searchParams.get("channel");
  const role = searchParams.get("role");
  const consultationId = searchParams.get("consultationId");

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<{ micTrack: any; camTrack: any } | null>(null);
  const localRef = useRef<HTMLDivElement | null>(null);
  const joinedRef = useRef(false);

  const [remoteJoined, setRemoteJoined] = useState(false);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [productInput, setProductInput] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState<string[]>([]);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  // ─── Permission check helper ────────────────────────────────────────────────
  const checkAndRequestPermissions = async (): Promise<boolean> => {
    try {
      setStatus("requesting-permissions");

      // Check existing permissions first (supported in most modern browsers)
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

      // Actually request access — this triggers the browser prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Immediately stop the test stream — Agora will create its own tracks
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

        // ── Create & publish tracks ───────────────────────────────────────
        const [micTrack, camTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        tracksRef.current = { micTrack, camTrack };

        await client.publish([micTrack, camTrack]);

        // Small delay ensures DOM is ready before playing local video
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
  }, [channelName]);

  // ─── Fetch consultation end time ─────────────────────────────────────────────
  // API returns: { success: true, data: { toTime: "18:30" } }  (24hr, no date)
  useEffect(() => {
    if (!joined || !consultationId) return;

    const fetchConsultationTime = async () => {
      try {
        const res = await fetch(
          `/api/astrologer/consultation/${consultationId}`
        );
        const json = await res.json();
        const toTime: string = json?.data?.toTime ?? json?.toTime;
        const customerId: string = json?.data?.customerId ?? json?.customerId;

        if(customerId) {
          setCustomerId(customerId);
        }
        if (!toTime) {
          console.error("toTime missing in response", json);
          return;
        }
        // toTime = "HH:mm" (24hr). Combine with today's IST date → ISO string
        const todayIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
        const endISO = moment
          .tz(`${todayIST} ${toTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata")
          .toISOString();
        console.log("✅ Call ends at:", endISO);
        setEndTime(endISO); // store as ISO; countdown uses this directly
      } catch (err) {
        console.error("Failed to fetch consultation time:", err);
      }
    };

    fetchConsultationTime();
  }, [joined, consultationId]);

  // ─── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!endTime) return;

    const endDateTime = moment(endTime); // ISO string → moment

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

    tick(); // show immediately, don't wait 1s
    const ticker = setInterval(tick, 1000);
    return () => clearInterval(ticker);
  }, [endTime]);

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

  const handleSendProduct = async () => {
    if (!productInput.trim()) return;
    const updatedProducts = [...recommendedProducts, productInput];
    setRecommendedProducts(updatedProducts);
    setProductInput("");

    try {
      await fetch(
        `/api/astrologer/add-product-recommendations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelName: channelName,
            astrologerId: localStorage.getItem("astrologer_id"),
            customerId: customerId,
            products: updatedProducts,
          }),
        }
      );
    } catch (err) {
      console.error("Recommendation error:", err);
    }
  };

  // ─── Permission denied screen ─────────────────────────────────────────────────
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
        className="absolute bottom-28 right-6 w-36 h-48 rounded-xl overflow-hidden border-2 border-white shadow-xl bg-gray-800"
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
                Waiting for other participant
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                Waiting for other person to join...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
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

      {/* Astrologer Product Recommendation Panel */}
      {role === "astrologer" && joined && (
        <div className="absolute bottom-10 left-10 w-96 bg-[#8E1C1F] border border-white/20 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-sm font-semibold tracking-wide mb-4 text-white">
            Recommend Products
          </h3>
          <div className="flex gap-3">
            <input
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendProduct()}
              placeholder="Type product name..."
              className="flex-1 bg-white/20 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-white/40 transition"
            />
            <button
              onClick={handleSendProduct}
              className="bg-white/20 hover:bg-white/30 transition px-5 rounded-xl text-sm font-medium text-white"
            >
              Send
            </button>
          </div>
          {recommendedProducts.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto space-y-2">
              {recommendedProducts.map((p, i) => (
                <div
                  key={i}
                  className="bg-white/20 px-4 py-2 rounded-xl text-xs text-white/90"
                >
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}