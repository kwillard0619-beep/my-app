import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Get subscribers
    const {
      data: subscribers,
      error: subscriberError,
    } = await supabase
      .from("subscribers")
      .select("email, categories");

    if (subscriberError) {
      throw subscriberError;
    }

    console.log("ALL SUBSCRIBERS:", subscribers);

    let emailsSent = 0;

    // Get date 7 days ago
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 7
    );

    for (const subscriber of subscribers ?? []) {
      console.log(
        "CURRENT SUBSCRIBER:",
        subscriber
      );

      if (
        !subscriber.email ||
        !subscriber.categories?.length
      ) {
        console.log(
          "Skipping subscriber - missing email or categories"
        );

        continue;
      }

      // Find active matching opportunities
      // added during the last 7 days.
      const {
        data: opportunities,
        error: opportunityError,
      } = await supabase
        .from("Personal_BB")
        .select("*")
        .eq("status", "active")
        .overlaps(
          "rfp_categories",
          subscriber.categories
        )
        .gte(
          "created_at",
          sevenDaysAgo.toISOString()
        )
        .order("created_at", {
          ascending: false,
        });

      if (opportunityError) {
        console.error(
          "Opportunity query error:",
          opportunityError
        );

        throw opportunityError;
      }

      console.log(
        "MATCHED ACTIVE OPPORTUNITIES:",
        opportunities
      );

      if (
        !opportunities ||
        opportunities.length === 0
      ) {
        console.log(
          "No matching active opportunities found"
        );

        continue;
      }

      // Build email table rows
      const opportunityRows = opportunities
        .map(
          (opp) => `
            <tr>
              <td style="
                padding: 10px;
                border-bottom: 1px solid #ddd;
                border-right: 1px solid #ddd;
              ">
                ${opp.opportunity_name ?? ""}
              </td>

              <td style="
                padding: 10px;
                border-bottom: 1px solid #ddd;
              ">
                ${
                  Array.isArray(
                    opp.rfp_categories
                  )
                    ? opp.rfp_categories.join(", ")
                    : ""
                }
              </td>
            </tr>
          `
        )
        .join("");

      const emailBody = `
        <h2>
          New Grant Opportunities Matching Your Interests
        </h2>

        <p>
          Here are opportunities that match your selected categories:
        </p>

        <table style="
          width: 100%;
          border-collapse: collapse;
          font-family: Arial, sans-serif;
        ">
          <thead>
            <tr>
              <th style="
                text-align: left;
                padding: 10px;
                background-color: #f3f4f6;
                border-bottom: 2px solid #ccc;
                border-right: 1px solid #ccc;
              ">
                Opportunity
              </th>

              <th style="
                text-align: left;
                padding: 10px;
                background-color: #f3f4f6;
                border-bottom: 2px solid #ccc;
              ">
                Categories
              </th>
            </tr>
          </thead>

          <tbody>
            ${opportunityRows}
          </tbody>
        </table>
      `;

      console.log(
        "Sending email to:",
        subscriber.email
      );

      const emailResponse = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from:
              "Your App <onboarding@resend.dev>",
            to: subscriber.email,
            subject:
              "New Grant Opportunities Matching Your Interests",
            html: emailBody,
          }),
        }
      );

      if (!emailResponse.ok) {
        const errorText =
          await emailResponse.text();

        console.error(
          "Email failed:",
          errorText
        );

        continue;
      }

      console.log(
        "Email sent successfully to:",
        subscriber.email
      );

      emailsSent++;
    }

    return NextResponse.json({
      success: true,
      emailsSent,
    });
  } catch (error: unknown) {
    console.error(
      "SEND OPPORTUNITIES ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}