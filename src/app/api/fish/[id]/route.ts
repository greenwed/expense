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
    const { nickname, targetTankId } = await req.json();

    const fish = await prisma.fish.findFirst({
      where: { id, userId: session.id },
      include: { species: true, tank: true },
    });

    if (!fish) {
      return NextResponse.json({ error: "Fish not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (nickname !== undefined && nickname.trim()) {
      updateData.nickname = nickname.trim();
    }

    // Move to another tank
    if (targetTankId && targetTankId !== fish.tankId) {
      if (fish.isBreeding) {
        return NextResponse.json(
          { error: "Cannot move fish while it is actively breeding." },
          { status: 400 }
        );
      }

      const targetTank = await prisma.tank.findFirst({
        where: { id: targetTankId, userId: session.id },
        include: {
          fish: {
            where: { status: "ALIVE" },
            include: { species: true },
          },
        },
      });

      if (!targetTank) {
        return NextResponse.json(
          { error: "Destination tank not found." },
          { status: 404 }
        );
      }

      // Check space
      const currentSpace = targetTank.fish.reduce(
        (acc, curr) => acc + curr.species.spaceUnits,
        0
      );
      if (currentSpace + fish.species.spaceUnits > targetTank.capacity) {
        return NextResponse.json(
          { error: `Destination tank "${targetTank.name}" has insufficient capacity.` },
          { status: 400 }
        );
      }

      // Water compatibility warning or error
      if (fish.species.waterType !== targetTank.waterType) {
        return NextResponse.json(
          {
            error: `Cannot move ${fish.species.waterType.toLowerCase()} fish into ${targetTank.waterType.toLowerCase()} tank "${targetTank.name}".`,
          },
          { status: 400 }
        );
      }

      updateData.tankId = targetTank.id;
    }

    const updated = await prisma.fish.update({
      where: { id },
      data: updateData,
      include: { species: true, tank: true },
    });

    return NextResponse.json({ success: true, fish: updated });
  } catch (error) {
    console.error("Fish update error:", error);
    return NextResponse.json(
      { error: "Failed to update fish" },
      { status: 500 }
    );
  }
}
