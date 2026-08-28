import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const CP_PACKS: Record<string, { priceUsd: number; cpAmount: number; name: string }> = {
  pack_1: { priceUsd: 1.0, cpAmount: 150, name: "Starter Pouch (150 CP)" },
  pack_5: { priceUsd: 5.0, cpAmount: 800, name: "Aquarist Chest (800 CP)" },
  pack_20: { priceUsd: 20.0, cpAmount: 3500, name: "Ocean Treasury (3,500 CP)" },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId, isSandbox } = await req.json();

    const pack = CP_PACKS[packId as string];
    if (!pack) {
      return NextResponse.json({ error: "Invalid CP pack selected." }, { status: 400 });
    }

    // 1. Instant Sandbox / Demo Top-Up Mode
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const isMockKey = !stripeKey || stripeKey.includes("mock") || stripeKey === "sk_test_your_stripe_secret_key";

    if (isSandbox || isMockKey) {
      // Sandbox Instant Credit Fulfillment
      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: session.id },
          data: { cpBalance: { increment: pack.cpAmount } },
        }),
        prisma.cPTransaction.create({
          data: {
            userId: session.id,
            amount: pack.cpAmount,
            type: "STRIPE_PURCHASE",
            description: `Purchased ${pack.name} for $${pack.priceUsd.toFixed(2)} USD (Sandbox Mode).`,
          },
        }),
        prisma.notification.create({
          data: {
            userId: session.id,
            type: "SYSTEM",
            title: "CP Purchase Successful! 💎",
            message: `You received +${pack.cpAmount} Credit Points from ${pack.name}!`,
            link: "/wallet",
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        mode: "sandbox",
        newBalance: updatedUser.cpBalance,
        message: `Sandbox Payment Simulated: +${pack.cpAmount} CP added to your wallet!`,
      });
    }

    // 2. Real Stripe Checkout Integration
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.name,
              description: `Add ${pack.cpAmount} in-game Credit Points to your Fish virtual aquarium.`,
            },
            unit_amount: Math.round(pack.priceUsd * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/wallet?success=true&pack=${packId}`,
      cancel_url: `${appUrl}/wallet?canceled=true`,
      metadata: {
        userId: session.id,
        packId,
        cpAmount: pack.cpAmount.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      mode: "stripe",
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Payment checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create payment checkout session." },
      { status: 500 }
    );
  }
}
