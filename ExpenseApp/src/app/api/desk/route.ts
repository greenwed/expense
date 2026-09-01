import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EQUIPMENT_PRICES: Record<string, { price: number; name: string; desc: string }> = {
  HEATER: {
    price: 15,
    name: "Submersible Quartz Heater",
    desc: "Maintains optimal 26°C warmth for tropical species (Bettas, Discus, Angels).",
  },
  MOTOR: {
    price: 20,
    name: "High-Flow Aeration Motor",
    desc: "Oxygenates water, creates surface currents, and stimulates active swimmers.",
  },
  AUTO_FEEDER: {
    price: 35,
    name: "Digital Automated Feeder",
    desc: "Timed slow-release feeding mechanism for vacation care.",
  },
  WATER_FILTER: {
    price: 25,
    name: "Multi-Stage Canister Filter",
    desc: "Advanced biological filtration that cuts tank dirt accumulation by 50%.",
  },
};

const TANK_PRICES: Record<string, { price: number; capacity: number; name: string }> = {
  SMALL: { price: 20, capacity: 5, name: "Starter Nano Tank (5 Units)" },
  MEDIUM: { price: 50, capacity: 15, name: "Panorama Community Tank (15 Units)" },
  LARGE: { price: 120, capacity: 40, name: "Colossal Show Aquarium (40 Units)" },
};

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deskItems, storedTanks, foodInventory] = await Promise.all([
      prisma.deskItem.findMany({ where: { userId: session.id } }),
      prisma.storedTank.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } }),
      prisma.foodInventory.findMany({ where: { userId: session.id } }),
    ]);

    const allEquipmentTypes = ["HEATER", "MOTOR", "AUTO_FEEDER", "WATER_FILTER"];
    const fullDeskItems = allEquipmentTypes.map((type) => {
      const existing = deskItems.find((d) => d.itemType === type);
      return {
        itemType: type,
        quantity: existing ? existing.quantity : 0,
        ...EQUIPMENT_PRICES[type],
      };
    });

    return NextResponse.json({
      deskItems: fullDeskItems,
      storedTanks,
      foodInventory,
      equipmentCatalog: EQUIPMENT_PRICES,
      tankCatalog: TANK_PRICES,
    });
  } catch (error) {
    console.error("Fetch desk error:", error);
    return NextResponse.json({ error: "Failed to fetch desk storage" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, itemType, tankSize, waterType, tankName } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Action 1: Buy Equipment / Supplies to Desk
    if (action === "buy_equipment") {
      const spec = EQUIPMENT_PRICES[itemType];
      if (!spec) return NextResponse.json({ error: "Invalid equipment type" }, { status: 400 });

      if (user.cpBalance < spec.price) {
        return NextResponse.json(
          { error: `Insufficient CP! ${spec.name} costs ${spec.price} CP, you have ${user.cpBalance} CP.` },
          { status: 400 }
        );
      }

      const [updatedUser, deskRecord] = await prisma.$transaction([
        prisma.user.update({
          where: { id: session.id },
          data: { cpBalance: { decrement: spec.price } },
        }),
        prisma.deskItem.upsert({
          where: { userId_itemType: { userId: session.id, itemType } },
          update: { quantity: { increment: 1 } },
          create: { userId: session.id, itemType, quantity: 1 },
        }),
        prisma.cPTransaction.create({
          data: {
            userId: session.id,
            amount: -spec.price,
            type: "BUY_EQUIPMENT",
            description: `Purchased ${spec.name} to Desk storage.`,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        newBalance: updatedUser.cpBalance,
        quantity: deskRecord.quantity,
        message: `Purchased ${spec.name} into your Desk Storage! (Total in desk: ${deskRecord.quantity})`,
      });
    }

    // Action 2: Buy Extra Tank into Desk Storage Warehouse
    if (action === "buy_tank") {
      const spec = TANK_PRICES[tankSize];
      if (!spec) return NextResponse.json({ error: "Invalid tank size" }, { status: 400 });

      if (user.cpBalance < spec.price) {
        return NextResponse.json(
          { error: `Insufficient CP! ${spec.name} costs ${spec.price} CP, you have ${user.cpBalance} CP.` },
          { status: 400 }
        );
      }

      const finalName = (tankName && tankName.trim()) || `${waterType.charAt(0) + waterType.slice(1).toLowerCase()} ${spec.name}`;

      const [updatedUser, storedTank] = await prisma.$transaction([
        prisma.user.update({
          where: { id: session.id },
          data: { cpBalance: { decrement: spec.price } },
        }),
        prisma.storedTank.create({
          data: {
            userId: session.id,
            name: finalName,
            size: tankSize,
            waterType: waterType || "FRESHWATER",
          },
        }),
        prisma.cPTransaction.create({
          data: {
            userId: session.id,
            amount: -spec.price,
            type: "BUY_TANK",
            description: `Purchased spare ${tankSize.toLowerCase()} tank "${finalName}" to Desk Warehouse.`,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        newBalance: updatedUser.cpBalance,
        storedTank,
        message: `Stored "${finalName}" in your Desk Tank Warehouse! You can deploy it anytime.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Desk action error:", error);
    return NextResponse.json({ error: "Failed to process desk action" }, { status: 500 });
  }
}
