import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, markAllRead } = await req.json();

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: session.id },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.deleteMany({
      where: { userId: session.id, read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear notifications error:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
