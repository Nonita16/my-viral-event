import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export async function POST(request: NextRequest) {
  try {
    const { email, eventName, inviteLink } = await request.json();

    if (!email || !eventName || !inviteLink) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const msg = {
      to: email,
      from: "noreply@yourdomain.com", // Replace with your verified SendGrid sender
      subject: `You're invited to ${eventName}`,
      html: `<p>Check out this event: <a href="${inviteLink}">${inviteLink}</a></p>`,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SendGrid error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
