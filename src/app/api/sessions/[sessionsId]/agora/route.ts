// import { NextRequest, NextResponse } from "next/server";
// import { eq, and } from "drizzle-orm";
// import { db } from "@/db";
// import { MentorSessionsTable, MentorProfilesTable, StartupProfilesTable } from "@/db/schema";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/auth";

// // Placeholder for Agora token generation
// // Replace with actual Agora SDK code when provided
// async function generateAgoraToken(channel: string, uid: string, role: "publisher" | "subscriber") {
//   // TODO: Implement actual Agora token generation
//   // Example using Agora Access Token library:
//   // const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
//   // const appId = process.env.AGORA_APP_ID;
//   // const appCertificate = process.env.AGORA_APP_CERTIFICATE;
//   // const expirationTimeInSeconds = 3600; // 1 hour
//   // const currentTimestamp = Math.floor(Date.now() / 1000);
//   // const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
//   // return RtcTokenBuilder.buildTokenWithUid(
//   //   appId,
//   //   appCertificate,
//   //   channel,
//   //   uid,
//   //   role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
//   //   privilegeExpiredTs
//   // );

//   // For now, return mock token
//   return `mock_token_${channel}_${uid}_${role}_${Date.now()}`;
// }

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { sessionsId: string } }
// ) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const sessionId = params.sessionsId;

//     // Fetch session with participants
//     const [sessionData] = await db
//       .select({
//         id: MentorSessionsTable.id,
//         status: MentorSessionsTable.status,
//         scheduledAt: MentorSessionsTable.scheduledAt,
//         mentorId: MentorSessionsTable.mentorId,
//         startupId: MentorSessionsTable.startupId,
//         agoraChannel: MentorSessionsTable.agoraChannel,
//         agoraTokenMentor: MentorSessionsTable.agoraTokenMentor,
//         agoraTokenStartup: MentorSessionsTable.agoraTokenStartup,
//         mentorUserId: MentorProfilesTable.userId,
//         startupUserId: StartupProfilesTable.userId,
//       })
//       .from(MentorSessionsTable)
//       .innerJoin(MentorProfilesTable, eq(MentorSessionsTable.mentorId, MentorProfilesTable.id))
//       .innerJoin(StartupProfilesTable, eq(MentorSessionsTable.startupId, StartupProfilesTable.id))
//       .where(eq(MentorSessionsTable.id, sessionId))
//       .limit(1);

//     if (!sessionData) {
//       return NextResponse.json({ error: "Session not found" }, { status: 404 });
//     }

//     // Check if user is participant
//     const isMentor = session.user.id === sessionData.mentorUserId;
//     const isStartup = session.user.id === sessionData.startupUserId;

//     if (!isMentor && !isStartup) {
//       return NextResponse.json({ error: "Access denied" }, { status: 403 });
//     }

//     // Only allow for accepted sessions close to scheduled time
//     if (sessionData.status !== "ACCEPTED") {
//       return NextResponse.json({ error: "Session not active" }, { status: 400 });
//     }

//     const now = new Date();
//     const scheduled = new Date(sessionData.scheduledAt!);
//     const timeDiff = Math.abs(now.getTime() - scheduled.getTime()) / (1000 * 60); // minutes

//     if (timeDiff > 30) { // Allow 30 minutes before/after
//       return NextResponse.json({ error: "Session not within time window" }, { status: 400 });
//     }

//     let channel = sessionData.agoraChannel;
//     let tokenMentor = sessionData.agoraTokenMentor;
//     let tokenStartup = sessionData.agoraTokenStartup;

//     // Generate if not exists
//     if (!channel) {
//       channel = `session_${sessionId}`;
//       tokenMentor = await generateAgoraToken(channel, sessionData.mentorUserId, "publisher");
//       tokenStartup = await generateAgoraToken(channel, sessionData.startupUserId, "publisher");

//       // Update session with Agora details
//       await db
//         .update(MentorSessionsTable)
//         .set({
//           agoraChannel: channel,
//           agoraTokenMentor: tokenMentor,
//           agoraTokenStartup: tokenStartup,
//           updatedAt: new Date(),
//         })
//         .where(eq(MentorSessionsTable.id, sessionId));
//     }

//     // Return appropriate token
//     const credentials = {
//       appId: process.env.AGORA_APP_ID || "mock_app_id",
//       channel,
//       token: isMentor ? tokenMentor : tokenStartup,
//       uid: isMentor ? sessionData.mentorUserId : sessionData.startupUserId,
//     };

//     return NextResponse.json({ data: credentials });
//   } catch (error) {
//     console.error("[GET /api/sessions/[sessionsId]/agora]", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }