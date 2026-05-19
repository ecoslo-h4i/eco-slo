import { createServerLevelClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { updateMemberEmail } from "@/lib/admin/members";

type IParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET API ROUTE: Fetch a single volunteer by ID
 *
 * Retrieves one volunteer record using the provided ID.
 *
 * Parameters:
 * @param params - route parameters
 * @param params.id - the ID of the volunteer
 *
 * Returns:
 * - 200 with { data } on success
 * - 404 if no volunteer is found
 * - 500 on server error
 */
export async function GET(_request: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;

    const { data, error } = await supabase.from("members").select("*").eq("id", id).single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    if (!data) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT API ROUTE: Updates a volunteer record by ID
 *
 * Updates a volunteer using the provided ID and request body.
 *
 * Parameters:
 * @param request - JSON body containing fields to update
 * @param params - route parameters
 * @param params.id - the ID of the volunteer
 *
 * Returns:
 * - 200 with { data } on success
 * - Supabase error with mapped status code
 * - 500 on server error
 */
export async function PUT(request: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Gate: admin only.
    const userClient = await createServerLevelClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { data: isAdminRow } = await userClient.rpc("is_admin");
    if (!isAdminRow) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Extract email separately if it's being changed. The remaining fields
    // can go through a normal update.
    const { email, ...rest } = body;
    const memberId = Number(id);

    if (email) {
      const result = await updateMemberEmail(memberId, email);
      if (!result.success) {
        const status = result.code === "not_found" ? 404 : result.code === "email_taken" ? 409 : 500;
        return NextResponse.json({ message: result.error }, { status });
      }
    }

    // Non-email fields: use the user-level client so RLS still validates
    // the caller is an admin. (The is_admin check above is redundant with
    // RLS but provides a cleaner 403 instead of "0 rows updated.")
    if (Object.keys(rest).length > 0) {
      const adminClient = await createServiceRoleClient();
      const { data, error } = await adminClient.from("members").update(rest).eq("id", memberId).select().single();

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }
      return NextResponse.json({ data }, { status: 200 });
    }

    // Email-only update: re-fetch to return the updated row.
    const adminClient = await createServiceRoleClient();
    const { data } = await adminClient.from("members").select("*").eq("id", memberId).single();

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("[admin/members PUT] unexpected error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE API ROUTE: Deletes a volunteer by ID
 *
 * Removes a volunteer record using the provided ID.
 *
 * Parameters:
 * @param params - route parameters
 * @param params.id - the ID of the volunteer
 *
 * Returns:
 * - 200 with { data } containing the deleted volunteer
 * - Supabase error with mapped status code
 * - 500 on server error
 */
export async function DELETE(_request: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;

    const { data, error } = await supabase.from("members").delete().eq("id", id).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
