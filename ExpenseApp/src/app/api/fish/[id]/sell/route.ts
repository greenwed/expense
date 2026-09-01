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

    const fish = await prisma.fish.findFirst({
      where: { id, userId: session.id, status: "ALIVE" },
      include: { species: true, tank: true },
    });

    if (!fish) {
      return NextResponse.json(
        { error: "Fish not found or already sold/dead." },
        { status: 404 }
      );
    }

    // Sell value based on species sellPrice and health condition
    let earnedCP = fish.species.sellPrice;
    if (fish.health < 40) {
      earnedCP = Math.max(1, Math.floor(earnedCP * 0.6));
    }

    const [updatedUser, updatedFish] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.id },
        data: { cpBalance: { increment: earnedCP } },
      }),
      prisma.fish.update({
        where: { id: fish.id },
        data: {
          status: "SOLD",
          isBreeding: false,
          breedingPartnerId: null,
          isListed: false,
        },
      }),
      prisma.cPTransaction.create({
        data: {
          userId: session.id,
          amount: earnedCP,
          type: "SELL_FISH",
          description: `Sold ${fish.nickname || fish.species.name} for ${earnedCP} CP.`,
        },
      }),
    ]);

    // Remove any active marketplace listing if present
    await prisma.marketplaceListing.deleteMany({
      where: { fishId: fish.id },
    });

    return NextResponse.json({
      success: true,
      earnedCP,
      newBalance: updatedUser.cpBalance,
      message: `Sold ${fish.nickname || fish.species.name} for ${earnedCP} CP!`,
    });
  } catch (error) {
    console.error("Sell fish error:", error);
    return NextResponse.json(
      { error: "Failed to sell fish" },
      { status: 500 }
    );
  }
}
