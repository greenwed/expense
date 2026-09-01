import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserState } from "@/lib/gameEngine";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Sync state for user
    await syncUserState(session.id);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        username: true,
        cpBalance: true,
        createdAt: true,
        _count: {
          select: {
            tanks: true,
            fish: true,
            notifications: {
              where: { read: false },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    const aliveFishCount = await prisma.fish.count({
      where: { userId: user.id, status: "ALIVE" },
    });

    const deadFishCount = await prisma.fish.count({
      where: { userId: user.id, status: "DEAD" },
    });

    const totalFishEver = await prisma.fish.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      user: {
        ...user,
        aliveFishCount,
        deadFishCount,
        totalFishEver,
        unreadNotificationsCount: user._count.notifications,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
