import { createServerLevelClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/database/database.types";
import { hasOnlyAllowedKeys, isDate, isEmail, isPhone, postgrestErrorToHttpStatus } from "@/database/utils";
import { syncTreeAssignments } from "@/lib/admin/members";

type VolunteerRow = Database["public"]["Tables"]["members"]["Row"];
type VolunteerInsert = Database["public"]["Tables"]["members"]["Insert"];

/**
 * GET API ROUTE: Retrieves all members from the database
 *
 * Fetches all rows and columns from the members table, sorted by creation date ascending.
 *
 * Parameters: none
 *
 * Returns:
 * - 200 with { message: Volunteer[] } on success
 * - 404 with { message: null, error: "Not Found" } if no members exist
 * - Supabase error with mapped status code { message: null, error: string }
 * - 500 on server error { data: null, error: "Internal Server Error" }
 */
export async function GET() {
  try {
    const supabase = await createServerLevelClient();
    const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: true });

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ message: null, error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ message: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}

/**
 * Admin POST API route for creating a volunteer.
 * @param request
 * @returns {message: VolunteerRow, status: number}
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerLevelClient();
    const body = await request.json();

    const { data, error } = await supabase.from("members").insert(body).select().single<VolunteerRow>();

    if (error) {
      console.log("Supabase error creating volunteer:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    if (data && Array.isArray(body.trees_assigned) && body.trees_assigned.length > 0) {
      await syncTreeAssignments(data.id, [], body.trees_assigned);
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in /api/admin/members POST:", error);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}

/**
 * @deprecated No longer validating NextRequests.
 */
function isVolunteerInsert(obj: unknown): obj is VolunteerInsert {
  const VOLUNTEER_INSERT_KEYS = ["email", "firstname", "lastname", "phone", "joined", "trees_planted", "type"] as const;
  if (!hasOnlyAllowedKeys(obj, VOLUNTEER_INSERT_KEYS)) return false;
  const vol = obj as Record<string, unknown>;

  return (
    isEmail(vol.email) &&
    typeof vol.firstname === "string" &&
    vol.firstname.trim().length > 0 &&
    typeof vol.lastname === "string" &&
    vol.lastname.trim().length > 0 &&
    isPhone(vol.phone) &&
    (vol.joined === undefined || isDate(vol.joined)) &&
    (vol.type === undefined || typeof vol.type === "string") &&
    (vol.trees_planted === undefined ||
      vol.trees_planted === null ||
      (Array.isArray(vol.trees_planted) && vol.trees_planted.every((t) => typeof t === "string")))
  );
}
