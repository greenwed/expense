import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      where: { status: "ACTIVE" },
      include: {
        seller: {
          select: { id: true, username: true },
        },
        fish: {
          include: {
            species: true,
            tank: {
              select: { name: true, waterType: true },
            },
          },
        },
      },
      orderBy: { listedAt: "desc" },
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Marketplace fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace listings" },
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

    const { fishId, price } = await req.json();

    const listingPrice = parseInt(price, 10);
    if (!listingPrice || listingPrice <= 0) {
      return NextResponse.json(
        { error: "Please provide a valid positive price in CP." },
        { status: 400 }
      );
    }

    const fish = await prisma.fish.findFirst({
      where: { id: fishId, userId: session.id, status: "ALIVE" },
      include: { species: true },
    });

    if (!fish) {
      return NextResponse.json(
        { error: "Fish not found or not eligible for listing." },
        { status: 404 }
      );
    }

    if (fish.isBreeding) {
      return NextResponse.json(
        { error: "Cannot list a fish that is actively breeding." },
        { status: 400 }
      );
    }

    const existingListing = await prisma.marketplaceListing.findFirst({
      where: { fishId, status: "ACTIVE" },
    });

    if (existingListing) {
      return NextResponse.json(
        { error: "This fish is already listed on the marketplace." },
        { status: 400 }
      );
    }

    const [listing] = await prisma.$transaction([
      prisma.marketplaceListing.create({
        data: {
          sellerId: session.id,
          fishId: fish.id,
          price: listingPrice,
          status: "ACTIVE",
        },
      }),
      prisma.fish.update({
        where: { id: fish.id },
        data: { isListed: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      listing,
      message: `Successfully listed ${fish.nickname || fish.species.name} for ${listingPrice} CP!`,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Failed to create marketplace listing" },
      { status: 500 }
    );
  }
}
