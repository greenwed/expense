import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FOOD_PACK_PRICES: Record<string, { quantity: number; price: number; name: string }> = {
  FLAKES: { quantity: 30, price: 5, name: "Tropical Flake Pack" },
  PELLETS: { quantity: 25, price: 8, name: "High-Protein Pellets" },
  LIVE: { quantity: 15, price: 12, name: "Live Pods & Bloodworms" },
  ALGAE: { quantity: 25, price: 6, name: "Spirulina Algae Wafers" },
};

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventory = await prisma.foodInventory.findMany({
      where: { userId: session.id },
    });

    const allTypes = ["FLAKES", "PELLETS", "LIVE", "ALGAE"];
    const fullInventory = allTypes.map((type) => {
      const existing = inventory.find((i) => i.foodType === type);
      const defaultPackCapacity = FOOD_PACK_PRICES[type]?.quantity || 25;
      const qty = existing ? existing.quantity : 0;
      const maxQty = existing ? Math.max(existing.maxQuantity || defaultPackCapacity, qty) : defaultPackCapacity;
      const percentage = Math.min(100, Math.round((qty / maxQty) * 100));

      return {
        id: existing?.id,
        foodType: type,
        quantity: qty,
        maxQuantity: maxQty,
        percentage,
      };
    });

    return NextResponse.json({ inventory: fullInventory });
  } catch (error) {
    console.error("Fetch inventory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch food inventory" },
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

    const { foodType } = await req.json();

    const pack = FOOD_PACK_PRICES[foodType as string];
    if (!pack) {
      return NextResponse.json({ error: "Invalid food pack" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user || user.cpBalance < pack.price) {
      return NextResponse.json(
        {
          error: `Insufficient CP! ${pack.name} costs ${pack.price} CP, you have ${user?.cpBalance || 0} CP.`,
        },
        { status: 400 }
      );
    }

    const existingItem = await prisma.foodInventory.findFirst({
      where: { userId: session.id, foodType },
    });

    const newQty = (existingItem?.quantity || 0) + pack.quantity;
    const newMaxQty = Math.max(existingItem?.maxQuantity || 0, newQty, pack.quantity);

    const [updatedUser, foodRecord] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.id },
        data: { cpBalance: { decrement: pack.price } },
      }),
      prisma.foodInventory.upsert({
        where: {
          userId_foodType: {
            userId: session.id,
            foodType,
          },
        },
        update: {
          quantity: { increment: pack.quantity },
          maxQuantity: newMaxQty,
        },
        create: {
          userId: session.id,
          foodType,
          quantity: pack.quantity,
          maxQuantity: pack.quantity,
        },
      }),
      prisma.cPTransaction.create({
        data: {
          userId: session.id,
          amount: -pack.price,
          type: "BUY_FOOD",
          description: `Purchased ${pack.name} (+${pack.quantity} servings).`,
        },
      }),
    ]);

    const percentage = Math.min(100, Math.round((foodRecord.quantity / foodRecord.maxQuantity) * 100));

    return NextResponse.json({
      success: true,
      quantity: foodRecord.quantity,
      maxQuantity: foodRecord.maxQuantity,
      percentage,
      newBalance: updatedUser.cpBalance,
      message: `Purchased ${pack.name} (+${pack.quantity} feedings)! Food balance: ${percentage}% (${foodRecord.quantity}/${foodRecord.maxQuantity})`,
    });
  } catch (error) {
    console.error("Buy food error:", error);
    return NextResponse.json(
      { error: "Failed to purchase food" },
      { status: 500 }
    );
  }
}
