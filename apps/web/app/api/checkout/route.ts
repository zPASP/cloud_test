import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Checkout iniciado (placeholder com reserva de estoque e pagamentos)." });
}
