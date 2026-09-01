import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, name, hasHeater, hasMotor, method } = body;

    const tank = await prisma.tank.findFirst({
      where: { id, userId: session.id },
    });

    if (!tank) {
      return NextResponse.json({ error: "Tank not found." }, { status: 404 });
    }

    // Action: Clean Tank
    if (action === "clean") {
      const now = new Date();

      // Clean cost based on tank size
      const CLEAN_COSTS: Record<string, number> = {
        SMALL: 5,
        MEDIUM: 10,
        LARGE: 20,
      };
      const cpCost = CLEAN_COSTS[tank.size] || 5;

      const user = await prisma.user.findUnique({ where: { id: session.id } });
      if (!user || user.cpBalance < cpCost) {
        return NextResponse.json(
          { error: `Insufficient CP! Deep cleaning this ${tank.size.toLowerCase()} tank costs ${cpCost} CP. Your balance is ${user?.cpBalance || 0} CP.` },
          { status: 400 }
        );
      }

      const [updatedUser, updatedTank] = await prisma.$transaction([
        prisma.user.update({
          where: { id: session.id },
          data: { cpBalance: { decrement: cpCost } },
        }),
        prisma.cPTransaction.create({
          data: {
            userId: session.id,
            amount: -cpCost,
            type: "CLEAN_TANK",
            description: `Tank maintenance service: Cleaned ${tank.size.toLowerCase()} tank "${tank.name}" (-${cpCost} CP).`,
          },
        }),
        prisma.tank.update({
          where: { id },
          data: {
            cleanliness: 100.0,
            lastCleanedAt: now,
            lastCalculatedAt: now,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        tank: updatedTank,
        newBalance: updatedUser.cpBalance,
        cpCost,
        message: `Tank "${tank.name}" is now crystal clear and spotless! (-${cpCost} CP)`,
      });
    }

    // Action: Upgrade Equipment or Rename
    const updateData: any = {};
    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
    }
    if (hasHeater !== undefined) {
      updateData.hasHeater = Boolean(hasHeater);
    }
    if (hasMotor !== undefined) {
      updateData.hasMotor = Boolean(hasMotor);
    }

    const updated = await prisma.tank.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, tank: updated });
  } catch (error) {
    console.error("Update tank error:", error);
    return NextResponse.json(
      { error: "Failed to update tank" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const tank = await prisma.tank.findFirst({
      where: { id, userId: session.id },
      include: {
        fish: {
          where: { status: "ALIVE" },
        },
      },
    });

    if (!tank) {
      return NextResponse.json({ error: "Tank not found." }, { status: 404 });
    }

    if (tank.fish.length > 0) {
      return NextResponse.json(
        { error: "Cannot sell a tank that still contains live fish. Sell or relocate fish first." },
        { status: 400 }
      );
    }

    // 50% refund on tank value
    const refundMap: Record<string, number> = { SMALL: 10, MEDIUM: 25, LARGE: 60 };
    const refundAmount = refundMap[tank.size] || 10;

    await prisma.$transaction([
      prisma.tank.delete({ where: { id } }),
      prisma.user.update({
        where: { id: session.id },
        data: { cpBalance: { increment: refundAmount } },
      }),
      prisma.cPTransaction.create({
        data: {
          userId: session.id,
          amount: refundAmount,
          type: "SELL_TANK",
          description: `Sold empty ${tank.size.toLowerCase()} tank "${tank.name}".`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Tank sold for ${refundAmount} CP!`,
    });
  } catch (error) {
    console.error("Delete tank error:", error);
    return NextResponse.json(
      { error: "Failed to delete tank" },
      { status: 500 }
    );
  }
}
