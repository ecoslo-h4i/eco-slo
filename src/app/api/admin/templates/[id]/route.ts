import { createServerLevelClient } from "@/lib/supabase/server";
import { TablesUpdate } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { applyTaskTypeSurveyDefaults } from "@/lib/admin/task-survey-defaults";
import { NextRequest, NextResponse } from "next/server";

type IParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;

    const { data, error } = await supabase.from("templates").select("*").eq("id", id).single();

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

export async function PUT(request: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;
    const body = applyTaskTypeSurveyDefaults((await request.json()) as TablesUpdate<"templates">);

    const { data, error } = await supabase.from("templates").update(body).eq("id", id).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;

    const { data, error } = await supabase.from("templates").delete().eq("id", id).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
