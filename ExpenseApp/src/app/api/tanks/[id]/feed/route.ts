import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
          include: { species: true },
        },
      },
    });

    if (!tank) {
      return NextResponse.json({ error: "Tank not found." }, { status: 404 });
    }

    if (tank.fish.length === 0) {
      return NextResponse.json({ error: "No live fish in this tank to feed." }, { status: 400 });
    }

    // Get user's food inventory
    const inventory = await prisma.foodInventory.findMany({
      where: { userId: session.id },
    });

    const inventoryMap = new Map<string, { id: string; qty: number }>();
    for (const inv of inventory) {
      inventoryMap.set(inv.foodType, { id: inv.id, qty: inv.quantity });
    }

    let fedCount = 0;
    let overfedCount = 0;
    const foodDeductions: Record<string, number> = {};

    for (const fish of tank.fish) {
      const foodType = fish.species.foodType;
      const inv = inventoryMap.get(foodType);

      if (inv && inv.qty > (foodDeductions[foodType] || 0)) {
        foodDeductions[foodType] = (foodDeductions[foodType] || 0) + 1;
        fedCount++;

        const wasOverfed = fish.hunger >= 90;
        let newHealth = Math.min(100.0, fish.health + 4.0);
        let newBornAt = fish.bornAt;

        if (wasOverfed) {
          overfedCount++;
          newHealth = Math.max(1.0, fish.health - 6.0);
          newBornAt = new Date(new Date(fish.bornAt).getTime() - 2 * 24 * 3600 * 1000);
        }

        await prisma.fish.update({
          where: { id: fish.id },
          data: {
            hunger: 100.0,
            health: newHealth,
            bornAt: newBornAt,
            lastFedAt: new Date(),
            lastCalculatedAt: new Date(),
          },
        });
      }
    }

    // Apply food inventory deductions
    for (const [fType, count] of Object.entries(foodDeductions)) {
      const inv = inventoryMap.get(fType);
      if (inv) {
        await prisma.foodInventory.update({
          where: { id: inv.id },
          data: { quantity: { decrement: count } },
        });
      }
    }

    // If any fish were overfed, degrade tank cleanliness due to leftover rotting food
    if (overfedCount > 0) {
      const cleanlinessLoss = overfedCount * 8.0;
      await prisma.tank.update({
        where: { id: tank.id },
        data: {
          cleanliness: Math.max(0, tank.cleanliness - cleanlinessLoss),
        },
      });
    }

    if (fedCount === 0) {
      return NextResponse.json(
        { error: "Insufficient food inventory to feed your fish! Buy food from the shop." },
        { status: 400 }
      );
    }

    const message = overfedCount > 0
      ? `Fed ${fedCount} fish in "${tank.name}". ⚠️ Warning: ${overfedCount} fish were already full (overfed); rotting food degraded tank cleanliness (-${overfedCount * 8}%) and shortened fish lifespan.`
      : `Fed ${fedCount} fish in "${tank.name}"!`;

    return NextResponse.json({
      success: true,
      fedCount,
      overfedCount,
      totalFish: tank.fish.length,
      message,
    });
  } catch (error) {
    console.error("Tank feed error:", error);
    return NextResponse.json(
      { error: "Failed to feed tank" },
      { status: 500 }
    );
  }
}
