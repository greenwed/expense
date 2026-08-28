import { prisma } from "./prisma";

// Hunger depletion rate in % per hour
const HUNGER_RATES = {
  SLOW: 2.8,   // ~36 hrs to 0
  MEDIUM: 5.0, // ~20 hrs to 0
  FAST: 8.3,   // ~12 hrs to 0
};

export async function syncUserState(userId: string) {
  const now = new Date();

  // Load all user's tanks with alive fish and species
  const tanks = await prisma.tank.findMany({
    where: { userId },
    include: {
      fish: {
        where: { status: "ALIVE" },
        include: {
          species: true,
        },
      },
    },
  });

  const notificationsToCreate: Array<{
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }> = [];

  for (const tank of tanks) {
    const elapsedTankHours = Math.max(
      0,
      (now.getTime() - new Date(tank.lastCalculatedAt).getTime()) / (1000 * 3600)
    );

    // 1. Calculate Tank Cleanliness Decay (Gradual & Buffered by Tank Volume)
    let cleanlinessDecayPerHour = 0.20; // base ambient decay
    let totalFishSpace = 0;
    for (const f of tank.fish) {
      totalFishSpace += f.species.spaceUnits;
      const wasteMultiplier = f.species.id === "spec_goldfish" ? 1.5 : 1.0;
      cleanlinessDecayPerHour += 0.12 * f.species.spaceUnits * wasteMultiplier;
    }

    // Larger tank water volumes buffer organic waste
    const volumeBuffer = Math.max(1.0, tank.capacity / 8.0);
    cleanlinessDecayPerHour = cleanlinessDecayPerHour / Math.sqrt(volumeBuffer);

    let newCleanliness = Math.max(0, tank.cleanliness - cleanlinessDecayPerHour * elapsedTankHours);

    // 2. Identify Tank Compatibility & Predator Conflicts
    const aggressiveCount = tank.fish.filter((f) => f.species.social === "AGGRESSIVE").length;
    const predators = tank.fish.filter((f) => f.species.predatory);
    const smallPrey = tank.fish.filter((f) => !f.species.predatory);

    // 3. Process Each Fish in the Tank
    for (const fish of tank.fish) {
      const elapsedFishHours = Math.max(
        0,
        (now.getTime() - new Date(fish.lastCalculatedAt).getTime()) / (1000 * 3600)
      );

      if (elapsedFishHours <= 0) continue;

      // Hunger Decay
      const hungerRatePerHour = HUNGER_RATES[fish.species.hungerRate as keyof typeof HUNGER_RATES] || 5.0;
      let newHunger = Math.max(0, fish.hunger - hungerRatePerHour * elapsedFishHours);

      // Health Calculations
      let healthDamagePerHour = 0;
      let primaryCauseOfDeath = "Unknown Causes";

      // Penalty 1: Starvation (hunger < 20)
      if (newHunger < 20) {
        healthDamagePerHour += 5.0;
        primaryCauseOfDeath = "Starvation";
      }

      // Penalty 2: Dirty Tank (cleanliness < 20%)
      if (newCleanliness < 20) {
        healthDamagePerHour += 4.0;
        primaryCauseOfDeath = "Toxic Water Quality (Dirty Tank)";
      }

      // Penalty 3: Water Type Mismatch
      if (fish.species.waterType !== tank.waterType) {
        healthDamagePerHour += 15.0;
        primaryCauseOfDeath = `Water Mismatch (Requires ${fish.species.waterType}, tank is ${tank.waterType})`;
      }

      // Penalty 4: Missing Required Heater or Motor
      if (fish.species.requiresHeater && !tank.hasHeater) {
        healthDamagePerHour += 5.0;
        primaryCauseOfDeath = "Hypothermia (Requires Tank Heater)";
      }
      if (fish.species.requiresMotor && !tank.hasMotor) {
        healthDamagePerHour += 5.0;
        primaryCauseOfDeath = "Oxygen Depletion (Requires Aeration Motor)";
      }

      // Penalty 5: Aggressive / Solitary Incompatibility
      if (fish.species.social === "AGGRESSIVE" && aggressiveCount > 1) {
        healthDamagePerHour += 6.0;
        primaryCauseOfDeath = "Territorial Fighting Injuries";
      }

      // Penalty 6: Predatory Attacks on Smaller Tankmates
      if (!fish.species.predatory && predators.length > 0) {
        const biggerPredator = predators.find((p) => p.species.spaceUnits > fish.species.spaceUnits);
        if (biggerPredator) {
          healthDamagePerHour += 8.0;
          primaryCauseOfDeath = `Attacked by predator (${biggerPredator.nickname || biggerPredator.species.name})`;

          // If predator is hungry, chance of immediately devouring smaller fish
          if (biggerPredator.hunger < 40 && Math.random() < 0.3) {
            healthDamagePerHour = 100.0;
            primaryCauseOfDeath = `Devoured by predator (${biggerPredator.nickname || biggerPredator.species.name})`;
          }
        }
      }

      // Penalty 7: Old Age / Elderly Decline
      const ageInDays = (now.getTime() - new Date(fish.bornAt).getTime()) / (1000 * 3600 * 24);
      if (ageInDays >= fish.species.lifespanDays) {
        healthDamagePerHour += 1.5;
        primaryCauseOfDeath = "Old Age (Natural Causes)";
      }

      let newHealth = Math.max(0, fish.health - healthDamagePerHour * elapsedFishHours);

      // Check for Death
      if (newHealth <= 0) {
        await prisma.fish.update({
          where: { id: fish.id },
          data: {
            status: "DEAD",
            hunger: newHunger,
            health: 0,
            causeOfDeath: primaryCauseOfDeath,
            lastCalculatedAt: now,
            isBreeding: false,
            breedingPartnerId: null,
          },
        });

        notificationsToCreate.push({
          userId,
          type: "DEATH_ALERT",
          title: `Fish Lost: ${fish.nickname || fish.species.name}`,
          message: `${fish.nickname || fish.species.name} in tank "${tank.name}" has died due to ${primaryCauseOfDeath}.`,
          link: `/?tankId=${tank.id}`,
        });
      } else {
        // Send Warning Notifications if in Danger
        if (newHunger < 20 && fish.hunger >= 20) {
          notificationsToCreate.push({
            userId,
            type: "HUNGER_ALERT",
            title: `Starvation Warning: ${fish.nickname || fish.species.name}`,
            message: `${fish.nickname || fish.species.name} is starving (${Math.round(newHunger)}% hunger)! Feed them soon before health drops.`,
            link: `/?tankId=${tank.id}`,
          });
        }

        // Update Fish State
        await prisma.fish.update({
          where: { id: fish.id },
          data: {
            hunger: newHunger,
            health: newHealth,
            lastCalculatedAt: now,
          },
        });
      }

      // Check Breeding Progress
      if (fish.isBreeding && fish.breedingStartedAt && fish.breedingPartnerId) {
        const breedingHours = (now.getTime() - new Date(fish.breedingStartedAt).getTime()) / (1000 * 3600);
        if (breedingHours >= fish.species.gestationHours) {
          // Complete breeding
          const currentOccupied = tank.fish.filter(f => f.status === "ALIVE").reduce((acc, curr) => acc + curr.species.spaceUnits, 0);
          const availableSpace = Math.max(0, tank.capacity - currentOccupied);

          if (availableSpace >= fish.species.spaceUnits) {
            const fryCount = Math.min(
              Math.floor(availableSpace / fish.species.spaceUnits),
              Math.floor(Math.random() * 3) + 1 // 1 - 3 baby fish
            );

            for (let i = 0; i < fryCount; i++) {
              const frySex = Math.random() > 0.5 ? "MALE" : "FEMALE";
              await prisma.fish.create({
                data: {
                  userId,
                  tankId: tank.id,
                  speciesId: fish.speciesId,
                  nickname: `${fish.species.name} Fry #${Math.floor(Math.random() * 900) + 100}`,
                  sex: frySex,
                  status: "ALIVE",
                  hunger: 100,
                  health: 100,
                  bornAt: now,
                  lastFedAt: now,
                  lastCalculatedAt: now,
                },
              });
            }

            // Reset parents breeding state
            await prisma.fish.update({
              where: { id: fish.id },
              data: { isBreeding: false, breedingPartnerId: null, breedingStartedAt: null },
            });
            await prisma.fish.update({
              where: { id: fish.breedingPartnerId },
              data: { isBreeding: false, breedingPartnerId: null, breedingStartedAt: null },
            });

            notificationsToCreate.push({
              userId,
              type: "BREEDING_COMPLETE",
              title: "New Fish Born! 🎉",
              message: `Congratulations! ${fryCount} baby ${fish.species.name} fry were successfully born in "${tank.name}".`,
              link: `/?tankId=${tank.id}`,
            });
          }
        }
      }
    }

    // Update Tank State
    await prisma.tank.update({
      where: { id: tank.id },
      data: {
        cleanliness: newCleanliness,
        lastCalculatedAt: now,
      },
    });

    if (newCleanliness < 20 && tank.cleanliness >= 20) {
      notificationsToCreate.push({
        userId,
        type: "TANK_DIRTY",
        title: `Dirty Tank Alert: ${tank.name}`,
        message: `Water cleanliness in "${tank.name}" has dropped below 20%! Clean the tank to protect your fish.`,
        link: `/?tankId=${tank.id}`,
      });
    }
  }

  // Batch insert notifications
  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToCreate,
    });
  }
}
