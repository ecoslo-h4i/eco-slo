import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/database/database.types";
import { hasOnlyAllowedKeys, isDate, isEmail, isPhone, postgrestErrorToHttpStatus } from "@/database/utils";

type VolunteerRow = Database["public"]["Tables"]["volunteers"]["Row"];
type VolunteerInsert = Database["public"]["Tables"]["volunteers"]["Insert"];

/**
 * Admin GET API route for all volunteer information.
 * @returns {message: string, status: number}
 */
export async function GET() {
  try {
    const { data, error } = await supabase.from("volunteers").select("*").order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error fetching volunteers:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    const normalizedData: VolunteerRow[] = data ?? [];
    return NextResponse.json({ message: normalizedData }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in /api/admin/volunteers GET: ", error);
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
    const body = await request.json();

    const { data, error } = await supabase.from("volunteers").insert(body).select().single<VolunteerRow>();

    if (error) {
      console.log("Supabase error creating volunteer:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in /api/admin/volunteers POST:", error);
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
