// components/mentors/TagBadge.tsx

interface TagBadgeProps {
  label: string;
  size?: "sm" | "md";
}

const FOREST = "#1A362B";
const BEIGE = "#EFEBE3";

export function TagBadge({ label, size = "md" }: TagBadgeProps) {
  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses}`}
      style={{ backgroundColor: BEIGE, color: FOREST }}
    >
      {label}
    </span>
  );
}