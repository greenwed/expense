import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username: username.trim() }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with that email or username already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user with starter bonus (100 CP), a starter tank, and starter food pack
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.trim(),
        passwordHash,
        cpBalance: 100, // 100 CP Starter Bonus
        tanks: {
          create: [
            {
              name: "Freshwater Sanctuary",
              size: "SMALL",
              capacity: 5,
              waterType: "FRESHWATER",
              hasMotor: false,
              hasHeater: true,
              cleanliness: 100.0,
            },
          ],
        },
        foodInventory: {
          create: [
            { foodType: "FLAKES", quantity: 25 },
            { foodType: "PELLETS", quantity: 15 },
            { foodType: "LIVE", quantity: 5 },
            { foodType: "ALGAE", quantity: 10 },
          ],
        },
        transactions: {
          create: [
            {
              amount: 100,
              type: "STARTER_BONUS",
              description: "Welcome to Fish! 100 Credit Points starter grant.",
            },
          ],
        },
        notifications: {
          create: [
            {
              type: "SYSTEM",
              title: "Welcome to Fish! 🐠",
              message: "You've received 100 Credit Points (CP), your first tank, and a starter food kit. Visit the shop to purchase your first fish!",
            },
          ],
        },
      },
    });

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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
