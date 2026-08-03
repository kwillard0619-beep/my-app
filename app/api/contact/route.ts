import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const allowedTopics = new Set([
  "Opportunity information",
  "Account or favorites",
  "RFP email alerts",
  "Technical issue",
  "General question",
]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured.");
      return NextResponse.json(
        {
          success: false,
          error: "The contact form is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const contactEmail = process.env.CONTACT_EMAIL;

    if (!contactEmail) {
      console.error("CONTACT_EMAIL is not configured.");
      return NextResponse.json(
        {
          success: false,
          error: "The contact form is temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      topic?: unknown;
      message?: unknown;
      website?: unknown;
    };

    const website = String(body.website ?? "").trim();

    // Quietly accept bot submissions without sending an email.
    if (website) {
      return NextResponse.json({ success: true });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const topic = String(body.topic ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid name." },
        { status: 400 }
      );
    }

    if (email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!allowedTopics.has(topic)) {
      return NextResponse.json(
        { success: false, error: "Please select a valid topic." },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 3000) {
      return NextResponse.json(
        {
          success: false,
          error: "Your message must be between 10 and 3,000 characters.",
        },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeTopic = escapeHtml(topic);
    const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ??
        "LG Listings <onboarding@resend.dev>",
      to: contactEmail,
      replyTo: email,
      subject: `LG Listings help request: ${topic}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Topic: ${topic}`,
        "",
        message,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #2f3038; line-height: 1.6;">
          <h2 style="margin-bottom: 20px;">New LG Listings help request</h2>
          <table style="border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 6px 16px 6px 0; font-weight: bold;">Name</td>
              <td style="padding: 6px 0;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 16px 6px 0; font-weight: bold;">Email</td>
              <td style="padding: 6px 0;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 16px 6px 0; font-weight: bold;">Topic</td>
              <td style="padding: 6px 0;">${safeTopic}</td>
            </tr>
          </table>
          <div style="border-top: 1px solid #d7d9da; padding-top: 20px;">
            ${safeMessage}
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend contact error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "We could not send your message. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "We could not send your message. Please try again.",
      },
      { status: 500 }
    );
  }
}