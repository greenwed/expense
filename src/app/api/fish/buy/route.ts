import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TANK_SIZE_LEVELS: Record<string, number> = {
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { speciesId, tankId, nickname, sex } = await req.json();

    if (!speciesId || !tankId) {
      return NextResponse.json(
        { error: "Species ID and Tank ID are required." },
        { status: 400 }
      );
    }

    const [species, tank, user] = await Promise.all([
      prisma.fishSpecies.findUnique({ where: { id: speciesId } }),
      prisma.tank.findFirst({
        where: { id: tankId, userId: session.id },
        include: {
          fish: {
            where: { status: "ALIVE" },
            include: { species: true },
          },
        },
      }),
      prisma.user.findUnique({ where: { id: session.id } }),
    ]);

    if (!species) {
      return NextResponse.json({ error: "Fish species not found." }, { status: 404 });
    }

    if (!tank) {
      return NextResponse.json({ error: "Tank not found." }, { status: 404 });
    }

    if (!user || user.cpBalance < species.basePrice) {
      return NextResponse.json(
        {
          error: `Insufficient CP! ${species.name} costs ${species.basePrice} CP, you have ${user?.cpBalance || 0} CP.`,
        },
        { status: 400 }
      );
    }

    // Check minimum tank size requirement
    const tankLevel = TANK_SIZE_LEVELS[tank.size] || 1;
    const requiredLevel = TANK_SIZE_LEVELS[species.minTankSize] || 1;
    if (tankLevel < requiredLevel) {
      return NextResponse.json(
        {
          error: `${species.name} requires at least a ${species.minTankSize.toLowerCase()} tank. Target tank is ${tank.size.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // Check capacity
    const currentOccupied = tank.fish.reduce(
      (acc, curr) => acc + curr.species.spaceUnits,
      0
    );
    if (currentOccupied + species.spaceUnits > tank.capacity) {
      return NextResponse.json(
        {
          error: `Tank is full! Has ${currentOccupied}/${tank.capacity} space units used. ${species.name} requires ${species.spaceUnits} unit(s).`,
        },
        { status: 400 }
      );
    }

    // Water type compatibility check
    if (species.waterType !== tank.waterType) {
      return NextResponse.json(
        {
          error: `Incompatible water! ${species.name} is a ${species.waterType.toLowerCase()} species, but "${tank.name}" is ${tank.waterType.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    let assignedSex = "MALE";
    if (sex === "MALE" || sex === "FEMALE") {
      assignedSex = sex;
    } else {
      assignedSex = Math.random() > 0.5 ? "MALE" : "FEMALE";
    }
    const fishName = (nickname && nickname.trim()) || species.name;

    const [updatedUser, newFish] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.id },
        data: { cpBalance: { decrement: species.basePrice } },
      }),
      prisma.fish.create({
        data: {
          userId: session.id,
          tankId: tank.id,
          speciesId: species.id,
          nickname: fishName,
          sex: assignedSex,
          status: "ALIVE",
          hunger: 100.0,
          health: 100.0,
          bornAt: new Date(),
          lastFedAt: new Date(),
          lastCalculatedAt: new Date(),
        },
        include: {
          species: true,
        },
      }),
      prisma.cPTransaction.create({
        data: {
          userId: session.id,
          amount: -species.basePrice,
          type: "BUY_FISH",
          description: `Adopted ${species.name} ("${fishName}") into tank "${tank.name}".`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      fish: newFish,
      newBalance: updatedUser.cpBalance,
      message: `Successfully purchased ${species.name}!`,
    });
  } catch (error) {
    console.error("Buy fish error:", error);
    return NextResponse.json(
      { error: "Failed to purchase fish" },
      { status: 500 }
    );
  }
}
