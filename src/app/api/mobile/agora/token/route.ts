import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const channelName = typeof body.channelName === "string" ? body.channelName.trim() : "";
    const uid = typeof body.uid === "number" ? body.uid : Number(body.uid ?? 0);
    const role = body.role === "subscriber" ? "subscriber" : "publisher";

    if (!channelName) {
      return NextResponse.json(
        {
          success: false,
          message: "channelName is required",
        },
        { status: 400 }
      );
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        {
          success: false,
          message: "Agora credentials are not configured in environment variables.",
        },
        { status: 500 }
      );
    }

    const { RtcTokenBuilder, RtcRole } = await import("agora-access-token");

    const expirationInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs
    );

    return NextResponse.json({
      success: true,
      token,
      channelName,
      uid,
      expireAt: privilegeExpiredTs,
      appId,
    });
  } catch (err: any) {
    console.error("Agora token error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to generate Agora token",
      },
      { status: 500 }
    );
  }
}
