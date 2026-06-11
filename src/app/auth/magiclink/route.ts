import { EmailTemplate } from "@/components/MagicLinkEmailTemplate";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface MagicLinkRequest {
  email: string;
}

// Basic shape check only. Don't reveal whether a well-formed email is
// registered. See the uniform 200 response below.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Approximate baseline latency of the happy path. Padding the "no member"
// branch up to this duration prevents an attacker from distinguishing
// registered vs unregistered emails via response timing.
const RESPONSE_BUDGET_MS = 1200;

// Same payload returned to the client whether the email is registered.
const UNIFORM_SUCCESS_RESPONSE = {
  message: "If that email is registered, a sign-in link is on its way.",
};

const resend = new Resend(process.env.RESEND_API_KEY);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const padTo = async (startMs: number, budgetMs: number) => {
  const elapsed = Date.now() - startMs;
  const remaining = budgetMs - elapsed;
  if (remaining > 0) await sleep(remaining);
};

export function GET() {
  return NextResponse.json({ message: "Method Not Allowed. Use POST with a JSON body." }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const startMs = Date.now();

  try {
    const body = (await request.json()) as Partial<MagicLinkRequest>;
    const email = body?.email?.trim().toLowerCase();

    // Malformed email: 400. Constant for bad inputs and malicious attacks
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
    }

    // Service-role client intentionally bypasses RLS so we can verify
    // member existence and call auth.admin.generateLink
    const client = await createServiceRoleClient();

    const { data: member, error: memberError } = await client
      .from("members")
      .select("id, firstname")
      .ilike("email", email)
      .maybeSingle();

    if (memberError) {
      // DB error: surface a generic 500 to avoid hinting at schema
      console.error("[magiclink] member lookup failed:", memberError);
      await padTo(startMs, RESPONSE_BUDGET_MS);
      return NextResponse.json(
        { message: "Unable to process your request right now. Please try again." },
        { status: 500 },
      );
    }

    // Unregistered Email Branch
    // Do not generate a link or send email; pad to typical happy-path
    // latency; return same 200 response as registered branch.
    if (!member) {
      // Server logs for forensics
      console.info("[magiclink] unregistered email attempted:", email);
      await padTo(startMs, RESPONSE_BUDGET_MS);
      return NextResponse.json(UNIFORM_SUCCESS_RESPONSE, { status: 200 });
    }

    // Branch: email is registered. Happy path.
    const redirectTo = new URL("/auth/callback", request.url).toString();
    const { data, error } = await client.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error) {
      // generateLink can fail for reasons that don't reveal membership
      // (rate limits, Supabase outage). Log internally; respond uniformly.
      console.error("[magiclink] generateLink failed:", error);
      await padTo(startMs, RESPONSE_BUDGET_MS);
      return NextResponse.json(UNIFORM_SUCCESS_RESPONSE, { status: 200 });
    }

    const { error: resendError } = await resend.emails.send({
      from: "no-reply@notifications.ecoslo.org",
      to: [email],
      subject: "ECOSLO Sign In",
      react: EmailTemplate({ redirectTo: data.properties.action_link, firstName: member.firstname }),
    });

    if (resendError) {
      // Same reasoning: deliverability failures shouldn't tell the
      // caller anything about whether the email was valid.
      console.error("[magiclink] resend send failed:", resendError);
      console.log("[magiclink] DEV link for", email, ":", data.properties.action_link);
      await padTo(startMs, RESPONSE_BUDGET_MS);
      return NextResponse.json(UNIFORM_SUCCESS_RESPONSE, { status: 200 });
    }

    // TODO: delete this after setting up ECOSLO email domain
    await padTo(startMs, RESPONSE_BUDGET_MS);
    return NextResponse.json(UNIFORM_SUCCESS_RESPONSE, { status: 200 });
  } catch (error) {
    console.error("[magiclink] unexpected error:", error);
    await padTo(startMs, RESPONSE_BUDGET_MS);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
