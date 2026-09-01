import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserState } from "@/lib/gameEngine";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncUserState(session.id);

    const fish = await prisma.fish.findMany({
      where: { userId: session.id },
      include: {
        species: true,
        tank: {
          select: {
            id: true,
            name: true,
            waterType: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ fish });
  } catch (error) {
    console.error("Get fish error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fish" },
      { status: 500 }
    );
  }
}
