import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Listagem de pedidos (placeholder para implementação com Prisma)." });
}

export async function POST() {
  return NextResponse.json({ message: "Criação de pedido (placeholder checkout + fila + WhatsApp)." }, { status: 201 });
}
