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

    // Check if feeding single fish or tank
    const fish = await prisma.fish.findFirst({
      where: { id, userId: session.id, status: "ALIVE" },
      include: {
        species: true,
        tank: true,
      },
    });

    if (!fish) {
      return NextResponse.json(
        { error: "Alive fish not found." },
        { status: 404 }
      );
    }

    const requiredFoodType = fish.species.foodType;

    // Check food inventory
    const foodItem = await prisma.foodInventory.findFirst({
      where: {
        userId: session.id,
        foodType: requiredFoodType,
      },
    });

    if (!foodItem || foodItem.quantity <= 0) {
      return NextResponse.json(
        {
          error: `Out of ${requiredFoodType.toLowerCase()}! ${fish.species.name} only eats ${requiredFoodType.toLowerCase()}. Purchase food from the shop.`,
        },
        { status: 400 }
      );
    }

    const wasOverfed = fish.hunger >= 90;

    // Deduct 1 food serving
    await prisma.foodInventory.update({
      where: { id: foodItem.id },
      data: { quantity: { decrement: 1 } },
    });

    let newHealth = Math.min(100.0, fish.health + 5.0);
    let newBornAt = fish.bornAt;

    if (wasOverfed) {
      // Overfeeding penalty: -8 HP digestive stress and advance age by 2 days (reducing remaining lifespan)
      newHealth = Math.max(1.0, fish.health - 8.0);
      newBornAt = new Date(new Date(fish.bornAt).getTime() - 2 * 24 * 3600 * 1000);

      // Tank cleanliness drops by 10% due to rotting food
      await prisma.tank.update({
        where: { id: fish.tankId },
        data: {
          cleanliness: Math.max(0, fish.tank.cleanliness - 10.0),
        },
      });
    }

    // Update fish state
    const updatedFish = await prisma.fish.update({
      where: { id: fish.id },
      data: {
        hunger: 100.0,
        health: newHealth,
        bornAt: newBornAt,
        lastFedAt: new Date(),
        lastCalculatedAt: new Date(),
      },
      include: { species: true },
    });

    const feedMsg = wasOverfed
      ? `⚠️ Overfed! ${fish.nickname || fish.species.name} was already full. Leftover food dirtied the tank (-10% cleanliness) and digestive bloating reduced fish health (-8 HP) and shortened lifespan.`
      : `${fish.nickname || fish.species.name} fed happily (+5 HP)!`;

    return NextResponse.json({
      success: true,
      fish: updatedFish,
      message: feedMsg,
      foodRemaining: foodItem.quantity - 1,
      foodType: requiredFoodType,
      overfed: wasOverfed,
    });
  } catch (error) {
    console.error("Feed fish error:", error);
    return NextResponse.json(
      { error: "Failed to feed fish" },
      { status: 500 }
    );
  }
}
