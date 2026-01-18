import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";

/**
 * Get all rows and columns of tree table as array of JS objects
 * @returns { body: Tree[], status: number } if successful
 * @returns { message: string, status: number } if error
 */
export async function GET() {
  try {
    const { data, error } = await supabase.from("trees").select("*").order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}

/**
 * Example POST API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function POST() {
  return NextResponse.json({ message: "Example trees POST message" });
}
