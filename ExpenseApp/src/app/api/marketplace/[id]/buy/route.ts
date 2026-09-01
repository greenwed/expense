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
    const { targetTankId } = await req.json();

    if (!targetTankId) {
      return NextResponse.json(
        { error: "Please select a target tank for the purchased fish." },
        { status: 400 }
      );
    }

    const [listing, buyer, buyerTank] = await Promise.all([
      prisma.marketplaceListing.findUnique({
        where: { id },
        include: {
          seller: true,
          fish: { include: { species: true } },
        },
      }),
      prisma.user.findUnique({ where: { id: session.id } }),
      prisma.tank.findFirst({
        where: { id: targetTankId, userId: session.id },
        include: {
          fish: {
            where: { status: "ALIVE" },
            include: { species: true },
          },
        },
      }),
    ]);

    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This listing is no longer available." },
        { status: 404 }
      );
    }

    if (listing.sellerId === session.id) {
      return NextResponse.json(
        { error: "You cannot purchase your own marketplace listing." },
        { status: 400 }
      );
    }

    if (!buyerTank) {
      return NextResponse.json(
        { error: "Destination tank not found." },
        { status: 404 }
      );
    }

    if (!buyer || buyer.cpBalance < listing.price) {
      return NextResponse.json(
        {
          error: `Insufficient CP! Listing costs ${listing.price} CP, you have ${buyer?.cpBalance || 0} CP.`,
        },
        { status: 400 }
      );
    }

    // Check space in target tank
    const currentOccupied = buyerTank.fish.reduce(
      (acc, curr) => acc + curr.species.spaceUnits,
      0
    );
    if (currentOccupied + listing.fish.species.spaceUnits > buyerTank.capacity) {
      return NextResponse.json(
        {
          error: `Target tank "${buyerTank.name}" does not have enough capacity.`,
        },
        { status: 400 }
      );
    }

    // Check water compatibility
    if (listing.fish.species.waterType !== buyerTank.waterType) {
      return NextResponse.json(
        {
          error: `Incompatible water type: ${listing.fish.species.name} requires ${listing.fish.species.waterType.toLowerCase()} water, but "${buyerTank.name}" is ${buyerTank.waterType.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // Calculate 10% platform fee
    const platformFee = Math.floor(listing.price * 0.1);
    const sellerPayout = listing.price - platformFee;

    const now = new Date();

    // Execute atomic purchase transaction
    await prisma.$transaction([
      // 1. Deduct full price from buyer
      prisma.user.update({
        where: { id: buyer.id },
        data: { cpBalance: { decrement: listing.price } },
      }),
      // 2. Credit payout (90%) to seller
      prisma.user.update({
        where: { id: listing.sellerId },
        data: { cpBalance: { increment: sellerPayout } },
      }),
      // 3. Transfer fish ownership to buyer and place in target tank
      prisma.fish.update({
        where: { id: listing.fishId },
        data: {
          userId: buyer.id,
          tankId: buyerTank.id,
          isListed: false,
        },
      }),
      // 4. Update listing status
      prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          status: "SOLD",
          buyerId: buyer.id,
          soldAt: now,
        },
      }),
      // 5. Buyer CP transaction log
      prisma.cPTransaction.create({
        data: {
          userId: buyer.id,
          amount: -listing.price,
          type: "MARKETPLACE_BUY",
          description: `Purchased ${listing.fish.nickname || listing.fish.species.name} from @${listing.seller.username}.`,
        },
      }),
      // 6. Seller CP transaction log
      prisma.cPTransaction.create({
        data: {
          userId: listing.sellerId,
          amount: sellerPayout,
          type: "MARKETPLACE_SELL",
          description: `Sold ${listing.fish.nickname || listing.fish.species.name} to @${buyer.username} (+${sellerPayout} CP after 10% fee).`,
        },
      }),
      // 7. Seller notification
      prisma.notification.create({
        data: {
          userId: listing.sellerId,
          type: "SYSTEM",
          title: "Marketplace Fish Sold! 💰",
          message: `Your ${listing.fish.nickname || listing.fish.species.name} was purchased by @${buyer.username} for ${listing.price} CP! (+${sellerPayout} CP added to your wallet).`,
          link: "/wallet",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Purchased ${listing.fish.nickname || listing.fish.species.name} successfully! Placed into "${buyerTank.name}".`,
    });
  } catch (error) {
    console.error("Marketplace buy error:", error);
    return NextResponse.json(
      { error: "Failed to complete marketplace purchase" },
      { status: 500 }
    );
  }
}
