import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const listing = await prisma.marketplaceListing.findFirst({
      where: { id, sellerId: session.id, status: "ACTIVE" },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Active listing not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.marketplaceListing.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),
      prisma.fish.update({
        where: { id: listing.fishId },
        data: { isListed: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Marketplace listing cancelled.",
    });
  } catch (error) {
    console.error("Cancel listing error:", error);
    return NextResponse.json(
      { error: "Failed to cancel listing" },
      { status: 500 }
    );
  }
}
