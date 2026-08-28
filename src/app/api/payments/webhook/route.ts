import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const cpAmount = parseInt(session.metadata?.cpAmount || "0", 10);
    const packId = session.metadata?.packId;

    if (userId && cpAmount > 0) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { cpBalance: { increment: cpAmount } },
        }),
        prisma.cPTransaction.create({
          data: {
            userId,
            amount: cpAmount,
            type: "STRIPE_PURCHASE",
            description: `Purchased Credit Points pack (${cpAmount} CP) via Stripe.`,
          },
        }),
        prisma.notification.create({
          data: {
            userId,
            type: "SYSTEM",
            title: "Payment Confirmed! 💎",
            message: `Your payment was processed successfully! +${cpAmount} CP has been added to your wallet.`,
            link: "/wallet",
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
