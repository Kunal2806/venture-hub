// app/api/agora/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { MentorSessionsTable, MentorProfilesTable, StartupProfilesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // console.error("🔐 Auth session user:", session?.user?.id);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelName, sessionId, role } = await req.json();
    console.error("📡 Request:", { channelName, sessionId, role });
    if (!channelName || !sessionId) {
      return NextResponse.json({ error: "Missing channelName or sessionId" }, { status: 400 });
    }

    // Verify session exists
    const [mentorSession] = await db
      .select()
      .from(MentorSessionsTable)
      .where(eq(MentorSessionsTable.id, sessionId))
      .limit(1);
        console.error("📋 Mentor Session:", { 
      id: mentorSession?.id, 
      mentorId: mentorSession?.mentorId,
      startupId: mentorSession?.startupId,
      status: mentorSession?.status 
    });
    if (!mentorSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session is accepted
    if (mentorSession.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Session not accepted yet" }, { status: 403 });
    }

    // Verify user is authorized
    let isAuthorized = false;
    
    if (role === "mentor") {
      const [mentorProfile] = await db
        .select({ userId: MentorProfilesTable.userId })
        .from(MentorProfilesTable)
        .where(eq(MentorProfilesTable.id, mentorSession.mentorId))
        .limit(1);
       console.error("👨‍🏫 Mentor Profile userId:", mentorProfile?.userId);
      console.error("🔑 Current user:", session.user.id);
      if (mentorProfile?.userId === session.user.id) {
        isAuthorized = true;
      }
    } 
    else if (role === "startup") {
      const [startupProfile] = await db
        .select({ userId: StartupProfilesTable.userId })
        .from(StartupProfilesTable)
        .where(eq(StartupProfilesTable.id, mentorSession.startupId))
        .limit(1);
            console.error("🚀 Startup Profile userId:", startupProfile?.userId);
      console.error("🔑 Current user:", session.user.id);

      if (startupProfile?.userId === session.user.id) {
        isAuthorized = true;
      }
    }
 console.error("✅ Is Authorized:", isAuthorized);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Generate token
    const uid = Math.floor(Math.random() * 1000000);
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    return NextResponse.json({
      token,
      uid,
      channelName,
      appId: APP_ID,
    });
  } catch (error) {
    console.error("[AGORA TOKEN]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}