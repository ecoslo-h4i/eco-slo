import { isEmail, isPhone, postgrestErrorToHttpStatus } from "@/database/utils";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONTACT_LENGTH = 160;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const SOURCE_TAG = "public_issue_report";

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type IssueReportBody = {
  message?: unknown;
  reporterEmail?: unknown;
  reporterName?: unknown;
  reporterPhone?: unknown;
  treeId?: unknown;
};

function cleanOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

function checkRateLimit(clientIp: string) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(clientIp);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(getClientIp(request));
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Too many issue reports. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    let body: IssueReportBody;
    try {
      body = (await request.json()) as IssueReportBody;
    } catch {
      return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    const treeId = Number(body.treeId);
    const message = cleanOptionalText(body.message, MAX_MESSAGE_LENGTH);
    const reporterName = cleanOptionalText(body.reporterName, MAX_CONTACT_LENGTH);
    const reporterPhone = cleanOptionalText(body.reporterPhone, MAX_CONTACT_LENGTH);
    const reporterEmail = cleanOptionalText(body.reporterEmail, MAX_CONTACT_LENGTH);

    if (!Number.isInteger(treeId) || treeId <= 0) {
      return NextResponse.json({ message: "A valid tree is required." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ message: "Please enter a report message." }, { status: 400 });
    }

    if (reporterEmail && !isEmail(reporterEmail)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    if (reporterPhone && !isPhone(reporterPhone)) {
      return NextResponse.json({ message: "Please enter a valid phone number." }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    const { data: tree, error: treeError } = await supabase
      .from("public_trees")
      .select("id, ecoslo_num, common_name, address")
      .eq("id", treeId)
      .eq("is_public", true)
      .maybeSingle();

    if (treeError) {
      console.error("[issue-reports] tree lookup failed:", treeError);
      return NextResponse.json({ message: treeError.message }, { status: postgrestErrorToHttpStatus(treeError) });
    }

    if (!tree) {
      return NextResponse.json({ message: "Tree not found or is not public." }, { status: 404 });
    }

    const { data: admins, error: adminsError } = await supabase
      .from("members")
      .select("id")
      .eq("role", "Admin")
      .order("id", { ascending: true });

    if (adminsError) {
      console.error("[issue-reports] admin lookup failed:", adminsError);
      return NextResponse.json({ message: adminsError.message }, { status: postgrestErrorToHttpStatus(adminsError) });
    }

    const adminIds = (admins ?? []).map((admin) => admin.id);
    const reporterDetails = [reporterName, reporterPhone, reporterEmail].filter(Boolean);

    const reportMessage = [
      `Source: ${SOURCE_TAG}`,
      message,
      `Tree: #${tree.ecoslo_num} (${tree.common_name ?? "Unknown tree"})`,
      tree.address ? `Address: ${tree.address}` : "",
      reporterDetails.length > 0 ? `Reported by: ${reporterDetails.join(" ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert({
        assignees: adminIds,
        completion_date: null,
        created_by: null,
        is_complete: false,
        message: reportMessage,
        surveys_needed: 0,
        title: `[${SOURCE_TAG}] Reported Issue on Tree #${tree.ecoslo_num}`,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[issue-reports] task insert failed:", insertError);
      return NextResponse.json({ message: insertError.message }, { status: postgrestErrorToHttpStatus(insertError) });
    }

    return NextResponse.json({ message: task }, { status: 201 });
  } catch (error) {
    console.error("[issue-reports] unexpected error:", error);
    return NextResponse.json({ message: "Unexpected server error." }, { status: 500 });
  }
}
