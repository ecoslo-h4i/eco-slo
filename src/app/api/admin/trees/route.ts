import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";

/**
 * Example GET API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function GET() {
  return NextResponse.json({ message: "Example trees GET message" });
}

/**
 * Example POST API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function POST() {
  return NextResponse.json({ message: "Example trees POST message" });
}
