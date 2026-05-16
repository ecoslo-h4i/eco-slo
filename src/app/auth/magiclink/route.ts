import { EmailTemplate } from "@/components/MagicLinkEmailTemplate";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface MagicLinkRequest {
  email: string;
}

export function GET() {
  return NextResponse.json({ message: "Method Not Allowed. Use POST with a JSON body." }, { status: 405 });
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<MagicLinkRequest>;
    const email = body?.email?.trim();

    if (!email) {
      return NextResponse.json({ message: "Missing email" }, { status: 400 });
    }

    const client = await createServiceRoleClient();
    const redirectTo = new URL("/auth/callback", request.url).toString();

    const { data, error } = await client.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    const { data: resendData, error: resendError } = await resend.emails.send({
      // TODO: replace "from" line with ECOSLO's email once we get their domain
      from: "onboarding@resend.dev",
      to: [email],
      subject: "ECOSLO Sign In",
      react: EmailTemplate({ redirectTo: data.properties.action_link }),
    });

    if (resendError) {
      return NextResponse.json({ message: resendError.message }, { status: 401 });
    }

    return NextResponse.json({ message: `Sending email to ${email}` }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
