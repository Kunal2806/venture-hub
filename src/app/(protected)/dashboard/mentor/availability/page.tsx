"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, DollarSign } from "lucide-react";

const FOREST = "#1A362B";
const CREAM  = "#F9F7F2";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Half-hour options for dropdowns
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isProBono: boolean;
}

export default function AvailabilityPage() {
  const [slots,   setSlots]   = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Add-slot form state
  const [showForm,   setShowForm]   = useState(false);
  const [newDay,     setNewDay]     = useState(1);      
  const [newStart,   setNewStart]   = useState("09:00");
  const [newEnd,     setNewEnd]     = useState("17:00");
  const [newIsProBono, setNewIsProBono] = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [addError,   setAddError]   = useState("");

  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mentor/availability")
      .then(r => r.json())
      .then(j => setSlots(j.data ?? []))
      .catch(() => setError("Could not load availability. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  // ── Add slot ──────────────────────────────────────────────────────
  async function handleAdd() {
    if (newStart >= newEnd) {
      setAddError("Start time must be before end time");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/mentor/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek: newDay, startTime: newStart, endTime: newEnd, isProBono: newIsProBono }),
      });
      const { data, error: err } = await res.json();
      if (!res.ok) throw new Error(err ?? "Failed to add slot");
      setSlots(prev => [...prev, data].sort((a, b) =>
        a.dayOfWeek !== b.dayOfWeek ? a.dayOfWeek - b.dayOfWeek : a.startTime.localeCompare(b.startTime)
      ));
      setShowForm(false);
      setNewIsProBono(false);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  // ── Toggle isActive ───────────────────────────────────────────────
  async function handleToggle(slot: Slot) {
    setTogglingId(slot.id);
    try {
      const res = await fetch("/api/mentor/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id, isActive: !slot.isActive }),
      });
      const { data, error: err } = await res.json();
      if (!res.ok) throw new Error(err);
      setSlots(prev => prev.map(s => s.id === data.id ? data : s));
    } catch {
      // silently revert — slot stays as-is
    } finally {
      setTogglingId(null);
    }
  }

  async function handleToggleMode(slot: Slot) {
    setTogglingId(slot.id);
    try {
      const res = await fetch("/api/mentor/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id, isProBono: !slot.isProBono }),
      });
      const { data, error: err } = await res.json();
      if (!res.ok) throw new Error(err);
      setSlots(prev => prev.map(s => s.id === data.id ? data : s));
    } catch {
      // silently revert — slot stays as-is
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/mentor/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  }

  // ── Group slots by day ────────────────────────────────────────────
  const byDay = DAYS.map((day, idx) => ({
    day,
    idx,
    slots: slots.filter(s => s.dayOfWeek === idx),
  })).filter(d => d.slots.length > 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link href="/dashboard/mentor" style={{ color: `${FOREST}50` }}>Dashboard</Link>
        <ChevronRight className="h-3.5 w-3.5" style={{ color: `${FOREST}30` }} />
        <span className="font-medium" style={{ color: FOREST }}>Availability</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: FOREST }}>Availability</h1>
          <p className="text-sm mt-1" style={{ color: `${FOREST}55` }}>
            Set your weekly slots — times are in UTC
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setAddError(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shrink-0"
          style={{ backgroundColor: FOREST, color: "white" }}
        >
          <Plus className="w-4 h-4" />
          Add Slot
        </button>
      </div>

      {/* Add-slot form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: `${FOREST}12` }}>
          <h2 className="font-serif text-sm font-semibold" style={{ color: FOREST }}>New Availability Slot</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: `${FOREST}60` }}>Day</label>
              <select
                value={newDay}
                onChange={e => setNewDay(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none"
                style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
              >
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: `${FOREST}60` }}>Start Time (UTC)</label>
              <select
                value={newStart}
                onChange={e => setNewStart(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none"
                style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
              >
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: `${FOREST}60` }}>End Time (UTC)</label>
              <select
                value={newEnd}
                onChange={e => setNewEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none"
                style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
              >
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: `${FOREST}60` }}>Slot type</label>
              <select
                value={newIsProBono ? "PROBONO" : "PAID"}
                onChange={e => setNewIsProBono(e.target.value === "PROBONO")}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none"
                style={{ borderColor: `${FOREST}18`, backgroundColor: CREAM, color: "#2D2D2D" }}
              >
                <option value="PAID">Paid slot</option>
                <option value="PROBONO">Pro bono slot</option>
              </select>
            </div>
          </div>
          {addError && <p className="text-xs" style={{ color: "#991B1B" }}>{addError}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-70"
              style={{ backgroundColor: FOREST, color: "white" }}
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {adding ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ color: `${FOREST}60` }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border px-5 py-4 text-sm" style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "white" }} />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: `${FOREST}10` }}>
          <p className="text-sm font-medium" style={{ color: FOREST }}>No availability slots yet</p>
          <p className="text-xs mt-1" style={{ color: `${FOREST}50` }}>
            Click "Add Slot" to set your weekly availability
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {byDay.map(({ day, slots: daySlots }) => (
            <div key={day} className="bg-white rounded-xl border p-5" style={{ borderColor: `${FOREST}12` }}>
              <h3 className="font-serif text-sm font-semibold mb-3" style={{ color: FOREST }}>{day}</h3>
              <div className="space-y-2">
                {daySlots.map(slot => {
                  const isToggling = togglingId === slot.id;
                  const isDeleting = deletingId === slot.id;
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: slot.isActive ? `${FOREST}06` : "#F9FAFB",
                        opacity: isDeleting ? 0.5 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {/* Time range */}
                      <span
                        className="text-sm font-medium tabular-nums"
                        style={{ color: slot.isActive ? FOREST : `${FOREST}50` }}
                      >
                        {slot.startTime} – {slot.endTime} UTC
                      </span>

                      {/* Status pill */}
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: slot.isActive ? `${FOREST}12` : "#F3F4F6",
                          color: slot.isActive ? FOREST : "#9CA3AF",
                        }}
                      >
                        {slot.isActive ? "Active" : "Paused"}
                      </span>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: slot.isProBono ? "#fef3c7" : "#dbeafe",
                          color: slot.isProBono ? "#92400e" : "#1d4ed8",
                        }}
                      >
                        {slot.isProBono ? "Pro bono" : "Paid"}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-auto">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(slot)}
                          disabled={isToggling || isDeleting}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: FOREST }}
                          title={slot.isActive ? "Pause slot" : "Activate slot"}
                        >
                          {isToggling
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : slot.isActive
                              ? <ToggleRight className="w-5 h-5" />
                              : <ToggleLeft className="w-5 h-5" style={{ color: `${FOREST}40` }} />
                          }
                        </button>

                        <button
                          onClick={() => handleToggleMode(slot)}
                          disabled={isToggling || isDeleting}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: slot.isProBono ? "#b45309" : "#1d4ed8" }}
                          title={slot.isProBono ? "Set paid" : "Set pro bono"}
                        >
                          {isToggling
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <DollarSign className="w-5 h-5" />
                          }
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(slot.id)}
                          disabled={isToggling || isDeleting}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: "#DC2626" }}
                          title="Delete slot"
                        >
                          {isDeleting
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}