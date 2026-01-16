import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";

/**
 * Example GET API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function GET() {
  return NextResponse.json({ message: "Example trees slug GET message" });
}

/**
 * Example PUT API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function PUT() {
  return NextResponse.json({ message: "Example trees slug PUT message" });
}

/**
 * Example DELETE API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function DELETE() {
  return NextResponse.json({ message: "Example trees slug DELETE message" });
}
