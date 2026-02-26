import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

type IParams = {
  params: {
    id: string;
  };
};

/**
 * Returns a single notification row by id
 * @returns { body: Notification[], status: number } if successful
 * @returns { message: string, status: number} if error
 * @returns {message: null, status: number} if notification not found
 */
export async function GET(req: NextRequest, { params }: IParams) {
  const { id } = await params;

  try {
    const message = await supabase.from("notifications").select().eq("id", id).maybeSingle();
    if (message.error) {
      return NextResponse.json({ error: message.error }, { status: postgrestErrorToHttpStatus(message.error) });
    }

    return NextResponse.json({ message: message.data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected Server Error" }, { status: 500 });
  }
}

/**
 * PUT API ROUTE: Updates a single notification by ID
 *
 * Updates a notification using the provided ID and request body.
 *
 * Parameters:
 * @param request - JSON body containing fields to update
 * @param params - route parameters
 * @param params.id - the ID of the notification
 *
 * Returns:
 * - 200 with { data } on success
 * - Supabase error with mapped status code
 * - 500 on server error
 */
export async function PUT(req: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase.from("notifications").update(body).eq("id", id).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }
    return NextResponse.json({ data: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Deletes one notification row by id, returns deleted notification
 * @returns { message: Notification, status: number } if successful
 * @returns { message: string, status: number } if error
 */
export async function DELETE(req: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("notifications").delete().eq("id", id).limit(1).select().single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ message: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected Server Error" }, { status: 500 });
  }
}
