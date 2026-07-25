import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "kwillard0619@gmail.com",
      subject: "🎉 Big Breakfast Email Test",
      html: `
        <h1>Your email integration is working!</h1>
        <p>If you received this email, Resend is successfully connected to your Next.js app.</p>
      `,
    });

    if (error) {
      return Response.json(error, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(error, { status: 500 });
  }
}