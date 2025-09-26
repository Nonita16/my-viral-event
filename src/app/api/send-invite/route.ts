import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
  console.log("SendGrid API key set");
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

    if (!apiKey || apiKey === "your_sendgrid_api_key_here") {
      return NextResponse.json(
        {
          error:
            "SendGrid API key not configured. Please add a valid SENDGRID_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    const msg = {
      to: email,
      from: "alondra.casur@gmail.com", // Replace with your verified SendGrid sender
      subject: `You're invited to ${eventName}`,
      html: `<p>Check out this event: <a href="${inviteLink}">${inviteLink}</a></p>`,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("SendGrid error:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
