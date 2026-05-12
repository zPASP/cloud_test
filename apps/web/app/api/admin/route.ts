import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Painel admin endpoint placeholder." });
}
