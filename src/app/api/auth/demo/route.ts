import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    const demoEmail = "demo@aquarium.io";
    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      // Create demo user on the fly if needed
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          username: "AquaristDemo",
          passwordHash: "demo",
          cpBalance: 250,
          tanks: {
            create: [
              {
                name: "Paradise Reef",
                size: "SMALL",
                capacity: 5,
                waterType: "FRESHWATER",
                hasHeater: true,
                hasMotor: false,
                cleanliness: 95.0,
              },
            ],
          },
          foodInventory: {
            create: [
              { foodType: "FLAKES", quantity: 30 },
              { foodType: "PELLETS", quantity: 15 },
              { foodType: "LIVE", quantity: 10 },
              { foodType: "ALGAE", quantity: 10 },
            ],
          },
        },
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        cpBalance: user.cpBalance,
      },
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Failed to login to demo" }, { status: 500 });
  }
}
