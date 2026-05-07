"use client";

import { useState } from "react";
import { X, Star, Loader2, CheckCircle2 } from "lucide-react";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  rateeId: string;        
  rateeName: string;      
  rateeRole: "mentor" | "startup";
  onRated?: (rating: number) => void;   
}

export function RatingModal({
  open, onClose, sessionId, rateeId, rateeName, rateeRole, onRated,
}: RatingModalProps) {
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [review,  setReview]  = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit() {
    if (rating === 0) { setError("Please select a rating."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sessions/rate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sessionId, rateeId, rating, review: review.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit rating");
      setDone(true);
      setTimeout(() => {
        onRated?.(rating);
        onClose();
        // reset
        setTimeout(() => { setDone(false); setRating(0); setReview(""); }, 300);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    onClose();
    setTimeout(() => { setDone(false); setRating(0); setReview(""); setError(""); }, 300);
  }

  if (!open) return null;

  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-stone-100">
          <div>
            <h2 className="font-serif text-lg text-stone-800">Rate your session</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              with {rateeName}
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="font-serif text-lg text-stone-800">Rating submitted!</p>
            <p className="text-sm text-stone-400 mt-1">Thank you for your feedback.</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Stars */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className="w-9 h-9 transition-colors"
                      style={{
                        fill:  i <= (hover || rating) ? "#F59E0B" : "transparent",
                        color: i <= (hover || rating) ? "#F59E0B" : "#D1D5DB",
                      }}
                    />
                  </button>
                ))}
              </div>
              {(hover || rating) > 0 && (
                <p className="text-sm font-medium text-amber-600">
                  {LABELS[hover || rating]}
                </p>
              )}
            </div>

            {/* Review */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-1.5 block">
                Review <span className="normal-case text-stone-300">(optional)</span>
              </label>
              <textarea
                value={review}
                onChange={e => setReview(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={
                  rateeRole === "mentor"
                    ? "How was the session? What did you find most helpful?"
                    : "How engaged was this startup? Would you mentor them again?"
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-stone-50 outline-none resize-none focus:border-stone-400 transition-colors"
              />
              <p className="text-xs text-stone-300 text-right mt-1">{review.length}/500</p>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#1A362B" }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Submitting…" : "Submit Rating"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}