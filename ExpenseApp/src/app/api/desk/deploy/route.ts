import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CAPACITY_MAP: Record<string, number> = {
  SMALL: 5,
  MEDIUM: 15,
  LARGE: 40,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, storedTankId, activeTankId, itemType, customTankName } = await req.json();

    // Action 1: Deploy a Stored Tank from Desk into an Active Aquarium
    if (action === "deploy_tank") {
      const stored = await prisma.storedTank.findFirst({
        where: { id: storedTankId, userId: session.id },
      });

      if (!stored) {
        return NextResponse.json({ error: "Stored tank not found on Desk." }, { status: 404 });
      }

      const capacity = CAPACITY_MAP[stored.size] || 5;
      const finalName = customTankName?.trim() || stored.name;

      const [newActiveTank] = await prisma.$transaction([
        prisma.tank.create({
          data: {
            userId: session.id,
            name: finalName,
            size: stored.size,
            waterType: stored.waterType,
            capacity,
            hasHeater: stored.hasHeater,
            hasMotor: stored.hasMotor,
            cleanliness: 100.0,
            lastCleanedAt: new Date(),
            lastCalculatedAt: new Date(),
          },
        }),
        prisma.storedTank.delete({ where: { id: stored.id } }),
      ]);

      return NextResponse.json({
        success: true,
        tank: newActiveTank,
        message: `🚀 Deployed "${finalName}" as an active aquarium! Switch to it on your dashboard.`,
      });
    }

    // Action 2: Store/Pack an Empty Active Aquarium back onto the Desk
    if (action === "store_tank") {
      const activeTank = await prisma.tank.findFirst({
        where: { id: activeTankId, userId: session.id },
        include: { fish: { where: { status: "ALIVE" } } },
      });

      if (!activeTank) {
        return NextResponse.json({ error: "Tank not found." }, { status: 404 });
      }

      if (activeTank.fish.length > 0) {
        return NextResponse.json(
          { error: "Cannot store a tank with live fish! Relocate or sell fish first (Fish cannot be kept on the desk)." },
          { status: 400 }
        );
      }

      const userTanksCount = await prisma.tank.count({ where: { userId: session.id } });
      if (userTanksCount <= 1) {
        return NextResponse.json(
          { error: "You must keep at least one active aquarium on your dashboard." },
          { status: 400 }
        );
      }

      const [storedTank] = await prisma.$transaction([
        prisma.storedTank.create({
          data: {
            userId: session.id,
            name: activeTank.name,
            size: activeTank.size,
            waterType: activeTank.waterType,
            hasHeater: activeTank.hasHeater,
            hasMotor: activeTank.hasMotor,
          },
        }),
        prisma.tank.delete({ where: { id: activeTank.id } }),
      ]);

      return NextResponse.json({
        success: true,
        storedTank,
        message: `Packed tank "${activeTank.name}" back into Desk storage.`,
      });
    }

    // Action 3: Install Equipment from Desk onto Active Tank
    if (action === "install_equipment") {
      const deskItem = await prisma.deskItem.findFirst({
        where: { userId: session.id, itemType },
      });

      if (!deskItem || deskItem.quantity <= 0) {
        return NextResponse.json(
          { error: `No spare ${itemType.toLowerCase()}s in your Desk storage! Buy one from the Desk shop.` },
          { status: 400 }
        );
      }

      const targetTank = await prisma.tank.findFirst({
        where: { id: activeTankId, userId: session.id },
      });

      if (!targetTank) {
        return NextResponse.json({ error: "Active tank not found." }, { status: 404 });
      }

      const updateData: any = {};
      if (itemType === "HEATER") {
        if (targetTank.hasHeater) return NextResponse.json({ error: "Tank already has a heater installed." }, { status: 400 });
        updateData.hasHeater = true;
      } else if (itemType === "MOTOR") {
        if (targetTank.hasMotor) return NextResponse.json({ error: "Tank already has an aerator motor installed." }, { status: 400 });
        updateData.hasMotor = true;
      }

      const [updatedTank, updatedDeskItem] = await prisma.$transaction([
        prisma.tank.update({ where: { id: targetTank.id }, data: updateData }),
        prisma.deskItem.update({ where: { id: deskItem.id }, data: { quantity: { decrement: 1 } } }),
      ]);

      return NextResponse.json({
        success: true,
        tank: updatedTank,
        deskQuantity: updatedDeskItem.quantity,
        message: `Installed ${itemType.toLowerCase()} onto tank "${targetTank.name}"!`,
      });
    }

    // Action 4: Uninstall Equipment from Active Tank back to Desk
    if (action === "uninstall_equipment") {
      const targetTank = await prisma.tank.findFirst({
        where: { id: activeTankId, userId: session.id },
      });

      if (!targetTank) {
        return NextResponse.json({ error: "Active tank not found." }, { status: 404 });
      }

      const updateData: any = {};
      if (itemType === "HEATER") {
        if (!targetTank.hasHeater) return NextResponse.json({ error: "Tank does not have a heater to detach." }, { status: 400 });
        updateData.hasHeater = false;
      } else if (itemType === "MOTOR") {
        if (!targetTank.hasMotor) return NextResponse.json({ error: "Tank does not have an aerator to detach." }, { status: 400 });
        updateData.hasMotor = false;
      }

      const [updatedTank, updatedDeskItem] = await prisma.$transaction([
        prisma.tank.update({ where: { id: targetTank.id }, data: updateData }),
        prisma.deskItem.upsert({
          where: { userId_itemType: { userId: session.id, itemType } },
          update: { quantity: { increment: 1 } },
          create: { userId: session.id, itemType, quantity: 1 },
        }),
      ]);

      return NextResponse.json({
        success: true,
        tank: updatedTank,
        deskQuantity: updatedDeskItem.quantity,
        message: `Detached ${itemType.toLowerCase()} from "${targetTank.name}" back into Desk storage.`,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Desk deploy error:", error);
    return NextResponse.json({ error: "Failed to process deployment" }, { status: 500 });
  }
}
