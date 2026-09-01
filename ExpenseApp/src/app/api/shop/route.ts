import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const species = await prisma.fishSpecies.findMany({
      orderBy: [{ rarity: "asc" }, { basePrice: "asc" }],
    });

    const tanks = [
      {
        size: "SMALL",
        name: "Small Glass Tank",
        capacity: 5,
        price: 20,
        description: "Cozy starter 10-gallon desktop tank. Houses up to 5 space units.",
      },
      {
        size: "MEDIUM",
        name: "Medium Reef Tank",
        capacity: 15,
        price: 50,
        description: "Spacious 30-gallon community aquarium. Houses up to 15 space units.",
      },
      {
        size: "LARGE",
        name: "Large Oceanarium Tank",
        capacity: 40,
        price: 120,
        description: "Grand 75-gallon aquatic sanctuary. Houses up to 40 space units for large predators and schools.",
      },
    ];

    const foodPacks = [
      {
        foodType: "FLAKES",
        name: "Tropical Flake Pack",
        quantity: 30,
        price: 5,
        description: "Nutritious balanced flakes for community freshwater fish. Lasts ~30 feedings.",
        icon: "🥣",
      },
      {
        foodType: "PELLETS",
        name: "High-Protein Pellets",
        quantity: 25,
        price: 8,
        description: "Slow-sinking nutrient pellets formulated for Bettas, Cichlids, and Gouramis.",
        icon: "🟤",
      },
      {
        foodType: "LIVE",
        name: "Live Pods & Bloodworms",
        quantity: 15,
        price: 12,
        description: "Live prey rich in natural proteins for predators, Mandarinfish, and Lionfish.",
        icon: "🪱",
      },
      {
        foodType: "ALGAE",
        name: "Spirulina Algae Wafers",
        quantity: 25,
        price: 6,
        description: "Dense veggie algae wafers for Tangs and herbivores to maintain vibrant pigmentation.",
        icon: "🟢",
      },
    ];

    const upgrades = [
      {
        id: "heater",
        name: "Submersible Thermostat Heater",
        price: 15,
        description: "Maintains optimal warm tropical water temperatures (78°F) required for exotic species.",
      },
      {
        id: "motor",
        name: "High-Flow Aeration Motor & Filter",
        price: 20,
        description: "Generates healthy water currents and high dissolved oxygen required for active marine and river species.",
      },
    ];

    return NextResponse.json({
      species,
      tanks,
      foodPacks,
      upgrades,
    });
  } catch (error) {
    console.error("Shop fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load shop catalog" },
      { status: 500 }
    );
  }
}
