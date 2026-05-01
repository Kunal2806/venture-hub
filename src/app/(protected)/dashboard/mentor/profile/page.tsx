import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProfileForm } from "@/components/ProfileForm";

const FOREST = "#1A362B";

export default function MentorProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/dashboard/mentor" className="transition-colors" style={{ color: `${FOREST}50` }}>
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" style={{ color: `${FOREST}30` }} />
        <span className="font-medium" style={{ color: FOREST }}>My Profile</span>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-semibold" style={{ color: FOREST }}>My Profile</h1>
        <p className="text-sm mt-1" style={{ color: `${FOREST}55` }}>
          Keep your profile updated to attract the right startups
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}