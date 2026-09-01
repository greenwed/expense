import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserState } from "@/lib/gameEngine";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const AUTHORIZED_TESTER_EMAIL = "karthikjay1202@gmail.com";
    if (session.email?.toLowerCase() !== AUTHORIZED_TESTER_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "Access Denied: Testing mode is restricted to authorized tester (karthikjay1202@gmail.com)." },
        { status: 403 }
      );
    }

    const { hoursForward, targetDate, resetCurrentTime } = await req.json();

    const now = new Date();

    if (resetCurrentTime) {
      // Reset all user's tanks and fish timestamps to current real time
      await prisma.tank.updateMany({
        where: { userId: session.id },
        data: {
          lastCalculatedAt: now,
        },
      });

      await prisma.fish.updateMany({
        where: { userId: session.id, status: "ALIVE" },
        data: {
          lastCalculatedAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Simulation clock synchronized to current real time.",
      });
    }

    let hoursToAdvance = 0;

    if (targetDate) {
      const target = new Date(targetDate);
      if (!isNaN(target.getTime())) {
        hoursToAdvance = Math.max(0, (target.getTime() - now.getTime()) / (1000 * 3600));
      }
    } else if (hoursForward && Number(hoursForward) > 0) {
      hoursToAdvance = Number(hoursForward);
    }

    if (hoursToAdvance <= 0) {
      return NextResponse.json(
        { error: "Please provide a positive number of hours or a future target date to advance." },
        { status: 400 }
      );
    }

    const msToOffset = hoursToAdvance * 3600 * 1000;

    // Shift lastCalculatedAt on tanks and fish back by msToOffset so syncUserState computes elapsed time
    const tanks = await prisma.tank.findMany({
      where: { userId: session.id },
      include: { fish: { where: { status: "ALIVE" } } },
    });

    for (const tank of tanks) {
      const shiftedTankCalc = new Date(new Date(tank.lastCalculatedAt).getTime() - msToOffset);
      await prisma.tank.update({
        where: { id: tank.id },
        data: { lastCalculatedAt: shiftedTankCalc },
      });

      for (const f of tank.fish) {
        const shiftedFishCalc = new Date(new Date(f.lastCalculatedAt).getTime() - msToOffset);
        const shiftedLastFed = new Date(new Date(f.lastFedAt).getTime() - msToOffset);
        const shiftedBornAt = new Date(new Date(f.bornAt).getTime() - msToOffset);
        const shiftedBreedingStarted = f.breedingStartedAt
          ? new Date(new Date(f.breedingStartedAt).getTime() - msToOffset)
          : null;

        await prisma.fish.update({
          where: { id: f.id },
          data: {
            lastCalculatedAt: shiftedFishCalc,
            lastFedAt: shiftedLastFed,
            bornAt: shiftedBornAt,
            breedingStartedAt: shiftedBreedingStarted,
          },
        });
      }
    }

    // Run game engine state synchronization
    await syncUserState(session.id);

    return NextResponse.json({
      success: true,
      hoursAdvanced: hoursToAdvance,
      message: `⏱️ Time Machine: Advanced simulation by +${hoursToAdvance.toFixed(1)} hours! Fish hunger, tank dirtiness, aging, and breeding have progressed.`,
    });
  } catch (error) {
    console.error("Time travel error:", error);
    return NextResponse.json(
      { error: "Failed to process simulation time travel." },
      { status: 500 }
    );
  }
}
