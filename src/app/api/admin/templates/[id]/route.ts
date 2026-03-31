import { supabase } from "@/supabase-client";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";

// TODO: enforce auth — use createAuthenticatedClient(jwt) when auth is wired up

type IParams = {
  params: {
    id: string;
  };
};

export async function GET(req: NextRequest, { params }: IParams) {
  try {
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
    const { id } = await params;
    const body = await request.json();

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
