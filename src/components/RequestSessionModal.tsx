// components/mentors/RequestSessionModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import type { Mentor, CreateSessionPayload, SessionFormat } from "@/app/(protected)/dashboard/startup/mentors/types";

const FOREST = "#1A362B";
const CREAM  = "#F9F7F2";

const FORMAT_OPTIONS: { value: SessionFormat; label: string; desc: string }[] = [
  { value: "VIDEO_CALL",   label: "Video Call",   desc: "Live 1-on-1 via Zoom / Meet" },
  { value: "ASYNC_REVIEW", label: "Async Review", desc: "Submit materials, get feedback" },
  { value: "IN_PERSON",    label: "In Person",    desc: "Mutually agreed location" },
];

interface RequestSessionModalProps {
  mentor: Mentor;
  open: boolean;
  onClose: () => void;
}

export function RequestSessionModal({ mentor, open, onClose }: RequestSessionModalProps) {
  const [topic,       setTopic]       = useState("");
  const [description, setDescription] = useState("");
  const [format,      setFormat]      = useState<SessionFormat>("VIDEO_CALL");
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!topic.trim()) { setError("Please add a topic."); return; }
    setError(null);
    setLoading(true);
    try {
      const payload: CreateSessionPayload = {
        mentorProfileId: mentor.id,
        topic:           topic.trim(),
        description:     description.trim() || undefined,
        format,
      };
      const res = await fetch("/api/mentor-sessions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to submit.");
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => { setSuccess(false); setTopic(""); setDescription(""); }, 300);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTopic(""); setDescription(""); setError(null); setSuccess(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#1A362B]/20 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ borderTop: `3px solid ${FOREST}` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 lg:p-6 border-b border-[#1A362B]/10">
          <div>
            <h2 className="font-serif text-lg text-[#1A362B]">Request a Session</h2>
            <p className="text-sm text-[#1A362B]/50 mt-0.5">with {mentor.name}</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[#F9F7F2] transition-colors">
            <X className="h-4 w-4 text-[#1A362B]/50" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="font-serif text-lg text-[#1A362B]">Request Sent!</p>
            <p className="text-sm text-[#1A362B]/50 mt-1">{mentor.name} will get back to you soon.</p>
          </div>
        ) : (
          <div className="p-5 lg:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Mentor chip */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: CREAM }}>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: FOREST }}
              >
                {mentor.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A362B]">{mentor.name}</p>
                <p className="text-xs text-[#1A362B]/50 truncate">
                  {mentor.designation}{mentor.organization ? ` · ${mentor.organization}` : ""}
                </p>
              </div>
              {mentor.sessionPrice ? (
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[#1A362B]">₹{mentor.sessionPrice.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-[#1A362B]/40">per session</p>
                </div>
              ) : (
                <span className="text-sm font-bold text-emerald-600 flex-shrink-0">Free</span>
              )}
            </div>

            {/* Format */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1A362B]/50 mb-2">
                Session Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map(({ value, label, desc }) => {
                  const active = format === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setFormat(value)}
                      className="text-left p-3 rounded-xl border transition-all"
                      style={{
                        borderColor:     active ? FOREST : `${FOREST}15`,
                        backgroundColor: active ? `${FOREST}06` : "white",
                      }}
                    >
                      <p className="text-xs font-semibold text-[#1A362B]">{label}</p>
                      <p className="text-[10px] text-[#1A362B]/50 mt-0.5 leading-tight">{desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1A362B]/50 mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Fundraising strategy for Series A"
                className="w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all"
                style={{
                  backgroundColor: CREAM,
                  borderColor: error && !topic.trim() ? "#ef4444" : `${FOREST}15`,
                  color: "#2D2D2D",
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1A362B]/50 mb-2">
                What do you want to discuss?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Share context, specific challenges, or the outcome you're hoping for..."
                className="w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all resize-none"
                style={{ backgroundColor: CREAM, borderColor: `${FOREST}15`, color: "#2D2D2D" }}
              />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-[#1A362B] hover:bg-[#F9F7F2] transition-colors"
                style={{ borderColor: `${FOREST}20` }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: FOREST }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}