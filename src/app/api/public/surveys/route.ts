import { createServerLevelClient } from "@/lib/supabase/server";
import { Json, TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SurveyInsert = Pick<TablesInsert<"surveys">, "task" | "tree" | "body">;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * POST — insert `public.surveys` (`task`, `tree`, `body` jsonb).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerLevelClient();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    if (!isPlainObject(body)) {
      return NextResponse.json({ message: "Body must be a JSON object" }, { status: 400 });
    }

    const task = body.task;
    const tree = body.tree;
    const payloadBody = body.body;

    if (typeof task !== "number" || !Number.isFinite(task)) {
      return NextResponse.json({ message: "task must be a number (tasks.id)" }, { status: 400 });
    }
    if (typeof tree !== "number" || !Number.isFinite(tree)) {
      return NextResponse.json({ message: "tree must be a number (trees.ecoslo_num)" }, { status: 400 });
    }
    if (!isPlainObject(payloadBody)) {
      return NextResponse.json({ message: "body must be a JSON object" }, { status: 400 });
    }

    const insert: SurveyInsert = {
      task,
      tree,
      body: payloadBody as Json,
    };

    const { data, error } = await supabase.from("surveys").insert(insert).select("id, task, tree, body").single();

    if (error) {
      console.error("Supabase error inserting survey:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (e) {
    console.error("Unexpected error in /api/public/surveys POST", e);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
