import { createServerLevelClient } from "@/lib/supabase/server";
import { TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";

// TODO: enforce auth — use createAuthenticatedClient(jwt) when auth is wired up
// TODO: surveys — spec fields issue/needs_contact/image_link are stored inside body (jsonb), validate body shape when schema is finalized

export async function GET() {
  try {
    const supabase = await createServerLevelClient();
    const { data, error } = await supabase.from("surveys").select("*").order("created_at", { ascending: true });
    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ message: error.message }, { status: status });
    }
    if (data === null || data.length == 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }
    return NextResponse.json({ message: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerLevelClient();
    const json = await request.json();
    const body = json as TablesInsert<"surveys">;

    const { data, error } = await supabase.from("surveys").insert(body).select();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
