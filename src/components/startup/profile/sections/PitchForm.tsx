"use client";

import { useState, useTransition } from "react";
import { updatePitch } from "../actions";
import type { StartupProfile } from "@/db/schema";

type Props = { profile: StartupProfile; userId: string; onSaved: () => void };

type Field = {
  name: keyof StartupProfile;
  formName: string;
  label: string;
  placeholder: string;
  hint?: string;
  rows?: number;
};

const FIELDS: Field[] = [
  {
    name: "problemStatement",
    formName: "problemStatement",
    label: "Problem Statement",
    placeholder: "What painful problem does your startup solve? Who suffers from it?",
    hint: "Be specific — investors remember concrete problems.",
    rows: 4,
  },
  {
    name: "solutionDescription",
    formName: "solutionDescription",
    label: "Solution",
    placeholder: "How does your product solve the problem? Walk through the core mechanism.",
    rows: 4,
  },
  {
    name: "uniqueValueProposition",
    formName: "uniqueValueProposition",
    label: "Unique Value Proposition",
    placeholder: "In one sentence — why you and not anyone else?",
    hint: "Your UVP is what investors quote to each other.",
    rows: 2,
  },
  {
    name: "businessModel",
    formName: "businessModel",
    label: "Business Model",
    placeholder: "How do you make money? (subscription, marketplace, SaaS, licensing…)",
    rows: 3,
  },
  {
    name: "targetMarket",
    formName: "targetMarket",
    label: "Target Market",
    placeholder: "Who is your ideal customer? Market size (TAM/SAM/SOM)?",
    rows: 3,
  },
  {
    name: "competitiveLandscape",
    formName: "competitiveLandscape",
    label: "Competitive Landscape",
    placeholder: "Who are your main competitors? What's your moat?",
    rows: 3,
  },
];

export default function PitchForm({ profile, userId, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updatePitch(fd);
      setResult(res);
      if (res.success) onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="profileId" value={profile.id} />
      <input type="hidden" name="userId" value={userId} />

      <div className="space-y-6">
        {FIELDS.map((field) => (
          <div key={field.formName}>
            <label className="label-style" htmlFor={field.formName}>
              {field.label}
            </label>
            {field.hint && (
              <p className="text-xs text-moss mb-2 italic">{field.hint}</p>
            )}
            <textarea
              id={field.formName}
              name={field.formName}
              rows={field.rows ?? 3}
              className="input-field resize-none w-full"
              defaultValue={(profile[field.name] as string | null) ?? ""}
              placeholder={field.placeholder}
              maxLength={2000}
            />
          </div>
        ))}
      </div>

      {result && (
        <p className={`text-sm font-medium ${result.success ? "text-green-600" : "text-red-500"}`}>
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary bg-forest text-cream px-6 py-3 text-sm font-semibold uppercase tracking-widest disabled:opacity-60 transition-all"
      >
        {isPending ? "Saving…" : "Save Pitch"}
      </button>
    </form>
  );
}