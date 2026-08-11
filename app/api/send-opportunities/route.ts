import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Subscriber = {
  email: string | null;
  categories: string[] | null;
};

type OpportunityContact = {
  name: string | null;
  email: string | null;
};

type Opportunity = {
  id: number;
  grantor: string | null;
  opportunity_name: string | null;
  maximum_grant: string | number | null;
  deadline: string | null;
  abstract: string | null;
  rfp_categories: string[] | null;
  status: string | null;
  contact: OpportunityContact | null;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDeadline = (value: string | null) => {
  if (!value) return "Not specified";

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatMultilineText = (value: string | null) => {
  if (!value?.trim()) {
    return "No abstract provided.";
  }

  return escapeHtml(value).replace(/\r?\n/g, "<br />");
};

const buildContactHtml = (contact: OpportunityContact | null) => {
  if (!contact?.name?.trim()) {
    return `<span style="color:#778189;">Not provided</span>`;
  }

  const name = escapeHtml(contact.name.trim());

  if (!contact.email?.trim()) {
    return `<span style="color:#394147;font-weight:700;">${name}</span>`;
  }

  const email = escapeHtml(contact.email.trim());

  return `
    <a
      href="mailto:${email}"
      style="
        color:#8D4D45;
        font-weight:700;
        text-decoration:underline;
        text-decoration-color:#D9B5A7;
        text-underline-offset:3px;
      "
    >
      ${name}
    </a>
  `;
};

const buildOpportunityCard = (
  opportunity: Opportunity,
  index: number
) => {
  const grantor = escapeHtml(
    opportunity.grantor || "Grantor not specified"
  );
  const opportunityName = escapeHtml(
    opportunity.opportunity_name || "Untitled opportunity"
  );
  const maximumGrant = escapeHtml(
    opportunity.maximum_grant || "Not specified"
  );
  const deadline = escapeHtml(
    formatDeadline(opportunity.deadline)
  );
  const abstract = formatMultilineText(
    opportunity.abstract
  );
  const contact = buildContactHtml(opportunity.contact);

  return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width:100%;
        margin:0 0 18px 0;
        border:1px solid #C8CBCC;
        border-collapse:separate;
        border-spacing:0;
        border-radius:20px;
        background:#FFFFFF;
        overflow:hidden;
      "
    >
      <tr>
        <td style="padding:22px 24px 18px 24px;">
          <div style="
            margin:0 0 7px 0;
            color:#8A6A34;
            font-family:Arial,Helvetica,sans-serif;
            font-size:10px;
            font-weight:700;
            letter-spacing:1.5px;
            line-height:15px;
            text-transform:uppercase;
          ">
            ${grantor}
          </div>

          <div style="
            margin:0;
            color:#2F3038;
            font-family:Arial,Helvetica,sans-serif;
            font-size:20px;
            font-weight:700;
            letter-spacing:-0.3px;
            line-height:27px;
          ">
            ${opportunityName}
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:0 24px;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="width:100%;border-collapse:collapse;"
          >
            <tr>
              <td
                width="50%"
                valign="top"
                style="
                  width:50%;
                  padding:14px 16px;
                  border:1px solid #D7D9DA;
                  border-radius:14px 0 0 14px;
                  background:#F4F3F1;
                "
              >
                <div style="
                  color:#778189;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:9px;
                  font-weight:700;
                  letter-spacing:1.3px;
                  line-height:14px;
                  text-transform:uppercase;
                ">
                  Maximum Grant
                </div>
                <div style="
                  margin-top:5px;
                  color:#2F3038;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:15px;
                  font-weight:700;
                  line-height:21px;
                ">
                  ${maximumGrant}
                </div>
              </td>

              <td
                width="50%"
                valign="top"
                style="
                  width:50%;
                  padding:14px 16px;
                  border-top:1px solid #D7D9DA;
                  border-right:1px solid #D7D9DA;
                  border-bottom:1px solid #D7D9DA;
                  border-radius:0 14px 14px 0;
                  background:#F4F3F1;
                "
              >
                <div style="
                  color:#778189;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:9px;
                  font-weight:700;
                  letter-spacing:1.3px;
                  line-height:14px;
                  text-transform:uppercase;
                ">
                  Deadline
                </div>
                <div style="
                  margin-top:5px;
                  color:#2F3038;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:15px;
                  font-weight:700;
                  line-height:21px;
                ">
                  ${deadline}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 24px 0 24px;">
          <div style="
            color:#778189;
            font-family:Arial,Helvetica,sans-serif;
            font-size:9px;
            font-weight:700;
            letter-spacing:1.3px;
            line-height:14px;
            text-transform:uppercase;
          ">
            Abstract
          </div>
          <div style="
            margin-top:7px;
            color:#565E64;
            font-family:Arial,Helvetica,sans-serif;
            font-size:14px;
            font-weight:400;
            line-height:22px;
          ">
            ${abstract}
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:18px 24px 22px 24px;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width:100%;
              border-collapse:separate;
              border-spacing:0;
              border-radius:14px;
              background:#E9E9E7;
            "
          >
            <tr>
              <td style="padding:12px 14px;">
                <span style="
                  margin-right:9px;
                  color:#778189;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:9px;
                  font-weight:700;
                  letter-spacing:1.2px;
                  text-transform:uppercase;
                ">
                  Contact
                </span>
                <span style="
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:13px;
                  line-height:19px;
                ">
                  ${contact}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="height:4px;background:${
          index % 2 === 0 ? "#C2A05A" : "#B7655E"
        };font-size:0;line-height:0;">
          &nbsp;
        </td>
      </tr>
    </table>
  `;
};

const buildEmailHtml = (
  opportunities: Opportunity[],
  selectedCategories: string[]
) => {
  const opportunityCards = opportunities
    .map(buildOpportunityCard)
    .join("");

  const categoryText = selectedCategories
    .map((category) => escapeHtml(category))
    .join(" · ");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>LG Listings RFP Alerts</title>
      </head>
      <body style="margin:0;padding:0;background:#D4D5D6;">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="width:100%;background:#D4D5D6;border-collapse:collapse;"
        >
          <tr>
            <td align="center" style="padding:32px 14px;">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  max-width:720px;
                  border-collapse:separate;
                  border-spacing:0;
                  border-radius:26px;
                  background:#F4F3F1;
                  overflow:hidden;
                "
              >
                <tr>
                  <td style="padding:30px 32px;background:#2F3038;">
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="width:100%;border-collapse:collapse;"
                    >
                      <tr>
                        <td valign="middle">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td
                                align="center"
                                valign="middle"
                                style="
                                  width:42px;
                                  height:42px;
                                  border-radius:13px;
                                  background:#FFFFFF;
                                  color:#2F3038;
                                  font-family:Arial,Helvetica,sans-serif;
                                  font-size:13px;
                                  font-weight:800;
                                "
                              >
                                LG
                              </td>
                              <td style="padding-left:13px;">
                                <div style="
                                  color:#FFFFFF;
                                  font-family:Arial,Helvetica,sans-serif;
                                  font-size:16px;
                                  font-weight:700;
                                  line-height:20px;
                                ">
                                  LG Listings
                                </div>
                                <div style="
                                  margin-top:2px;
                                  color:#C8CED1;
                                  font-family:Arial,Helvetica,sans-serif;
                                  font-size:9px;
                                  font-weight:700;
                                  letter-spacing:1.5px;
                                  line-height:14px;
                                  text-transform:uppercase;
                                ">
                                  Funding Intelligence
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <div style="
                      margin-top:28px;
                      color:#D4D9DC;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:10px;
                      font-weight:700;
                      letter-spacing:1.8px;
                      line-height:15px;
                      text-transform:uppercase;
                    ">
                      RFP Alerts
                    </div>

                    <h1 style="
                      margin:6px 0 0 0;
                      color:#FFFFFF;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:29px;
                      font-weight:700;
                      letter-spacing:-0.7px;
                      line-height:36px;
                    ">
                      Active opportunities for you
                    </h1>

                    <p style="
                      margin:10px 0 0 0;
                      color:#D4D9DC;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:14px;
                      line-height:22px;
                    ">
                      ${opportunities.length} ${
                        opportunities.length === 1
                          ? "active opportunity matches"
                          : "active opportunities match"
                      } your selected funding interests.
                    </p>

                    <div style="
                      margin-top:20px;
                      height:2px;
                      background:#C2A05A;
                      font-size:0;
                      line-height:0;
                    ">&nbsp;</div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 32px 6px 32px;">
                    <div style="
                      color:#778189;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:9px;
                      font-weight:700;
                      letter-spacing:1.3px;
                      line-height:14px;
                      text-transform:uppercase;
                    ">
                      Your alert categories
                    </div>
                    <div style="
                      margin-top:5px;
                      color:#565E64;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:12px;
                      font-weight:600;
                      line-height:19px;
                    ">
                      ${categoryText}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 32px 20px 32px;">
                    ${opportunityCards}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:20px 32px 26px 32px;
                    border-top:1px solid #D7D9DA;
                    background:#E9E9E7;
                    color:#778189;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:11px;
                    line-height:18px;
                  ">
                    You&apos;re receiving this email because you subscribed to LG Listings RFP Alerts.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export async function GET() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or server-only Supabase secret key."
      );
    }

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: subscriberData,
      error: subscriberError,
    } = await supabase
      .from("subscribers")
      .select("email, categories");

    if (subscriberError) {
      throw subscriberError;
    }

    const subscribers =
      (subscriberData ?? []) as Subscriber[];

    let emailsSent = 0;
    let subscribersSkipped = 0;

    for (const subscriber of subscribers) {
      if (
        !subscriber.email?.trim() ||
        !subscriber.categories?.length
      ) {
        subscribersSkipped += 1;
        continue;
      }

      // TEMPORARY TEST BEHAVIOR:
      // Return every ACTIVE opportunity matching this subscriber's
      // categories, regardless of when the opportunity was added.
      // When weekly production alerts are ready, add the created_at
      // seven-day filter back to this query.
      const {
        data: opportunityData,
        error: opportunityError,
      } = await supabase
        .from("Personal_BB")
        .select(`
          id,
          grantor,
          opportunity_name,
          maximum_grant,
          deadline,
          abstract,
          rfp_categories,
          status,
          contact:contacts!Personal_BB_contact_id_fkey (
            name,
            email
          )
        `)
        .eq("status", "active")
        .overlaps(
          "rfp_categories",
          subscriber.categories
        )
        .order("deadline", {
          ascending: true,
          nullsFirst: false,
        });

      if (opportunityError) {
        console.error(
          `Opportunity query failed for ${subscriber.email}:`,
          opportunityError
        );
        continue;
      }

      const opportunities =
        (opportunityData ?? []) as unknown as Opportunity[];

      if (opportunities.length === 0) {
        subscribersSkipped += 1;
        continue;
      }

      const emailResponse = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "lg-listings/1.0",
          },
          body: JSON.stringify({
            from:
              process.env.RESEND_FROM_EMAIL ??
              "LG Listings <onboarding@resend.dev>",
            to: subscriber.email.trim(),
            subject: `LG Listings: ${opportunities.length} active ${
              opportunities.length === 1
                ? "opportunity"
                : "opportunities"
            } matching your interests`,
            html: buildEmailHtml(
              opportunities,
              subscriber.categories
            ),
          }),
        }
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();

        console.error(
          `Email failed for ${subscriber.email}:`,
          errorText
        );
        continue;
      }

      emailsSent += 1;
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      subscribersSkipped,
      mode: "all-active-matching-categories",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    console.error(
      "SEND OPPORTUNITIES ERROR:",
      error
    );

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