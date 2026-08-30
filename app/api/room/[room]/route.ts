import { NextResponse } from "next/server";
import { roomStore } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: { room: string } }) {
  const state = roomStore.getState(params.room);
  return NextResponse.json(state);
}
