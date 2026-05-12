import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Catálogo de produtos (placeholder com filtros e paginação)." });
}
