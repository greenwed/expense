import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserState } from "@/lib/gameEngine";

const TANK_PRICES = {
  SMALL: { price: 20, capacity: 5 },
  MEDIUM: { price: 50, capacity: 15 },
  LARGE: { price: 120, capacity: 40 },
};

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync game simulation clock
    await syncUserState(session.id);

    const tanks = await prisma.tank.findMany({
      where: { userId: session.id },
      include: {
        fish: {
          where: { status: "ALIVE" },
          include: {
            species: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedTanks = tanks.map((tank) => {
      const capacityUsed = tank.fish.reduce(
        (acc, curr) => acc + curr.species.spaceUnits,
        0
      );
      const hasDangerFish = tank.fish.some(
        (f) => f.hunger < 20 || f.health < 30
      );

      return {
        ...tank,
        capacityUsed,
        hasDangerFish,
      };
    });

    return NextResponse.json({ tanks: formattedTanks });
  } catch (error) {
    console.error("Fetch tanks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tanks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, size, waterType, hasHeater, hasMotor } = await req.json();

    if (!name || !size || !waterType) {
      return NextResponse.json(
        { error: "Name, size, and water type are required." },
        { status: 400 }
      );
    }

    const tankConfig = TANK_PRICES[size as keyof typeof TANK_PRICES];
    if (!tankConfig) {
      return NextResponse.json({ error: "Invalid tank size" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user || user.cpBalance < tankConfig.price) {
      return NextResponse.json(
        { error: `Insufficient CP! Tank costs ${tankConfig.price} CP, you have ${user?.cpBalance || 0} CP.` },
        { status: 400 }
      );
    }

    // Deduct CP and create tank in transaction
    const [updatedUser, tank] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.id },
        data: { cpBalance: { decrement: tankConfig.price } },
      }),
      prisma.tank.create({
        data: {
          userId: session.id,
          name: name.trim(),
          size,
          capacity: tankConfig.capacity,
          waterType,
          hasHeater: Boolean(hasHeater),
          hasMotor: Boolean(hasMotor),
          cleanliness: 100.0,
        },
      }),
      prisma.cPTransaction.create({
        data: {
          userId: session.id,
          amount: -tankConfig.price,
          type: "BUY_TANK",
          description: `Purchased ${size.toLowerCase()} ${waterType.toLowerCase()} tank "${name.trim()}".`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tank,
      newBalance: updatedUser.cpBalance,
    });
  } catch (error) {
    console.error("Create tank error:", error);
    return NextResponse.json(
      { error: "Failed to create tank" },
      { status: 500 }
    );
  }
}
