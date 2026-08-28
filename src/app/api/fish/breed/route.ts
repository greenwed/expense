import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { parent1Id, parent2Id } = await req.json();

    if (!parent1Id || !parent2Id || parent1Id === parent2Id) {
      return NextResponse.json(
        { error: "Please select two distinct fish to breed." },
        { status: 400 }
      );
    }

    const [fish1, fish2] = await Promise.all([
      prisma.fish.findFirst({
        where: { id: parent1Id, userId: session.id, status: "ALIVE" },
        include: { species: true, tank: true },
      }),
      prisma.fish.findFirst({
        where: { id: parent2Id, userId: session.id, status: "ALIVE" },
        include: { species: true, tank: true },
      }),
    ]);

    if (!fish1 || !fish2) {
      return NextResponse.json(
        { error: "One or both selected fish were not found or are not alive." },
        { status: 404 }
      );
    }

    if (fish1.tankId !== fish2.tankId) {
      // Check if fish1 tank has capacity to host fish2
      const targetTank = await prisma.tank.findUnique({
        where: { id: fish1.tankId },
        include: { fish: { where: { status: "ALIVE" }, include: { species: true } } },
      });
      const currentOccupied = (targetTank?.fish || []).reduce((sum, f) => sum + f.species.spaceUnits, 0);
      if (targetTank && currentOccupied + fish2.species.spaceUnits <= targetTank.capacity) {
        // Automatically relocate fish2 into fish1's tank
        await prisma.fish.update({
          where: { id: fish2.id },
          data: { tankId: fish1.tankId },
        });
      } else {
        return NextResponse.json(
          { error: `Both fish must be in the same tank to mate. "${targetTank?.name || 'Tank'}" does not have enough capacity for both.` },
          { status: 400 }
        );
      }
    }

    if (fish1.speciesId !== fish2.speciesId) {
      return NextResponse.json(
        { error: "Fish must be of the same species to breed successfully." },
        { status: 400 }
      );
    }

    if (!fish1.species.breedEligible) {
      return NextResponse.json(
        { error: `${fish1.species.name} is a non-breeding species.` },
        { status: 400 }
      );
    }

    if (fish1.sex === fish2.sex) {
      return NextResponse.json(
        { error: `Breeding requires a male and a female pair. Both selected fish are ${fish1.sex.toLowerCase()}s.` },
        { status: 400 }
      );
    }

    if (fish1.isBreeding || fish2.isBreeding) {
      return NextResponse.json(
        { error: "One or both of these fish is already actively breeding." },
        { status: 400 }
      );
    }

    if (fish1.health < 70 || fish2.health < 70) {
      return NextResponse.json(
        { error: "Both fish must have at least 70% health to ensure safe breeding." },
        { status: 400 }
      );
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.fish.update({
        where: { id: fish1.id },
        data: {
          isBreeding: true,
          breedingPartnerId: fish2.id,
          breedingStartedAt: now,
        },
      }),
      prisma.fish.update({
        where: { id: fish2.id },
        data: {
          isBreeding: true,
          breedingPartnerId: fish1.id,
          breedingStartedAt: now,
        },
      }),
      prisma.notification.create({
        data: {
          userId: session.id,
          type: "SYSTEM",
          title: `Breeding Started: ${fish1.species.name}`,
          message: `${fish1.nickname} and ${fish2.nickname} have begun breeding in "${fish1.tank.name}"! Gestation period is ~${fish1.species.gestationHours} hours.`,
          link: `/breeding`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      gestationHours: fish1.species.gestationHours,
      message: `Breeding cycle initiated for ${fish1.species.name}! Expected completion in ~${fish1.species.gestationHours} hours.`,
    });
  } catch (error) {
    console.error("Breeding error:", error);
    return NextResponse.json(
      { error: "Failed to initiate breeding" },
      { status: 500 }
    );
  }
}
