"use client";

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { FishData, TankData } from "@/lib/types";

interface FoodParticle {
  id: number;
  x: number;
  y: number;
  vy: number;
  vx: number;
  wobble: number;
  color: string;
  size: number;
  type: string;
}

interface EatingEffect {
  x: number;
  y: number;
  text: string;
  alpha: number;
  scale: number;
}

interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  alpha: number;
}

interface Plant {
  baseX: number;
  height: number;
  width: number;
  segments: number;
  color: string;
  phaseOffset: number;
}

interface AlgaePatch {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  color: string;
  alpha: number;
}

interface FishActor {
  data: FishData;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  targetX: number;
  targetY: number;
  tailPhase: number;
  tailSpeed: number;
  size: number;
  isHuntingFood: boolean;
  eatingAnimationTicks: number;
}

interface AquariumCanvasProps {
  tank: TankData | null;
  onSelectFish: (fish: FishData) => void;
  onDropFood?: () => void;
}

export interface AquariumCanvasHandle {
  triggerFeedAnimation: (x?: number, y?: number) => void;
}

const AquariumCanvas = forwardRef<AquariumCanvasHandle, AquariumCanvasProps>(
  ({ tank, onSelectFish, onDropFood }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [hoveredFish, setHoveredFish] = useState<{ fish: FishData; x: number; y: number } | null>(null);

    const actorsRef = useRef<FishActor[]>([]);
    const bubblesRef = useRef<Bubble[]>([]);
    const plantsRef = useRef<Plant[]>([]);
    const algaePatchesRef = useRef<AlgaePatch[]>([]);
    const foodParticlesRef = useRef<FoodParticle[]>([]);
    const eatingEffectsRef = useRef<EatingEffect[]>([]);
    const ripplesRef = useRef<WaterRipple[]>([]);
    const animFrameRef = useRef<number | null>(null);

    // Method exposed to parent to trigger feeding animation anywhere
    useImperativeHandle(ref, () => ({
      triggerFeedAnimation: (customX?: number, customY?: number) => {
        dropFoodBurst(customX, customY);
      },
    }));

    const dropFoodBurst = (dropX?: number, dropY?: number) => {
      const canvas = canvasRef.current;
      const width = canvas ? canvas.width : 960;
      const originX = dropX ?? (Math.random() * (width - 200) + 100);
      const originY = dropY ?? 20;

      // Create surface ripple ring
      ripplesRef.current.push({
        x: originX,
        y: Math.max(10, originY),
        radius: 4,
        maxRadius: 45,
        alpha: 0.8,
      });

      // Scatter 8-14 food particles
      const colors = ["#f59e0b", "#fbbf24", "#d97706", "#f97316", "#ef4444", "#10b981"];
      for (let i = 0; i < 12; i++) {
        foodParticlesRef.current.push({
          id: Date.now() + Math.random() * 1000 + i,
          x: originX + (Math.random() * 60 - 30),
          y: originY + (Math.random() * 20 - 10),
          vy: 0.7 + Math.random() * 0.9,
          vx: (Math.random() - 0.5) * 1.2,
          wobble: Math.random() * Math.PI * 2,
          color: colors[i % colors.length],
          size: 2.5 + Math.random() * 2.0,
          type: "FLAKE",
        });
      }
    };

    // Initialize or update fish actors when tank or fish list changes
    useEffect(() => {
      if (!tank || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const width = canvas.width || 960;
      const height = canvas.height || 500;

      const existingActorsMap = new Map<string, FishActor>();
      actorsRef.current.forEach((a) => existingActorsMap.set(a.data.id, a));

      const newActors: FishActor[] = tank.fish.map((fish) => {
        const existing = existingActorsMap.get(fish.id);
        if (existing) {
          existing.data = fish; // update live stats
          return existing;
        }

        const sizeScale = fish.species.sizeScale || 1.0;
        const baseLength = 36 * sizeScale;
        const x = Math.random() * (width - 160) + 80;
        const y = Math.random() * (height - 160) + 80;
        const vx = (Math.random() > 0.5 ? 1 : -1) * (1.1 + Math.random() * 0.8);
        const vy = (Math.random() - 0.5) * 0.6;

        return {
          data: fish,
          x,
          y,
          vx,
          vy,
          angle: vx > 0 ? 0 : Math.PI,
          speed: Math.hypot(vx, vy),
          targetX: Math.random() * (width - 120) + 60,
          targetY: Math.random() * (height - 120) + 60,
          tailPhase: Math.random() * Math.PI * 2,
          tailSpeed: 0.16 + Math.random() * 0.08,
          size: baseLength,
          isHuntingFood: false,
          eatingAnimationTicks: 0,
        };
      });

      actorsRef.current = newActors;
    }, [tank]);

    // Initialize plants & glass algae patches
    useEffect(() => {
      const plants: Plant[] = [];
      const count = 14;
      const colors = ["#047857", "#059669", "#10b981", "#065f46", "#14b8a6", "#ec4899", "#8b5cf6"];

      for (let i = 0; i < count; i++) {
        plants.push({
          baseX: (i / count) * 960 + Math.random() * 40 - 20,
          height: 120 + Math.random() * 150,
          width: 14 + Math.random() * 10,
          segments: 6,
          color: colors[i % colors.length],
          phaseOffset: Math.random() * Math.PI * 2,
        });
      }
      plantsRef.current = plants;

      // Generate randomized algae growth patches for tank glass
      const algae: AlgaePatch[] = [];
      const algaeColors = ["#166534", "#15803d", "#14532d", "#365314", "#4d7c0f", "#3f6212"];
      for (let i = 0; i < 45; i++) {
        algae.push({
          x: Math.random() * 960,
          y: Math.random() * 500,
          radiusX: 25 + Math.random() * 85,
          radiusY: 18 + Math.random() * 65,
          rotation: Math.random() * Math.PI,
          color: algaeColors[i % algaeColors.length],
          alpha: 0.35 + Math.random() * 0.45,
        });
      }
      algaePatchesRef.current = algae;
    }, []);

    // Main Canvas Loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let time = 0;

      const render = () => {
        time += 0.02;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const cleanliness = tank ? tank.cleanliness : 100;
        const dirtRatio = Math.max(0, Math.min(1.0, (100 - cleanliness) / 100)); // 0.0 = clean, 1.0 = completely dirty

        // 1. Water Background Gradient (Interpolates smoothly and gradually based on dirtiness)
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        if (cleanliness > 80) {
          // Pristine crystal azure ocean
          grad.addColorStop(0, "#0284c7");
          grad.addColorStop(0.5, "#0369a1");
          grad.addColorStop(1, "#082f49");
        } else if (cleanliness > 55) {
          // Subtle warm turquoise / teal
          grad.addColorStop(0, "#0891b2");
          grad.addColorStop(0.5, "#0e7490");
          grad.addColorStop(1, "#0f4c5c");
        } else if (cleanliness > 30) {
          // Mild greenish-teal
          grad.addColorStop(0, "#0f766e");
          grad.addColorStop(0.5, "#115e59");
          grad.addColorStop(1, "#134e4a");
        } else if (cleanliness > 12) {
          // Murky olive-green
          grad.addColorStop(0, "#365314");
          grad.addColorStop(0.5, "#27272a");
          grad.addColorStop(1, "#14532d");
        } else {
          // Critical dense murky swamp (only at < 12%)
          grad.addColorStop(0, "#1c1917");
          grad.addColorStop(0.4, "#2e2b10");
          grad.addColorStop(0.8, "#1a2e05");
          grad.addColorStop(1, "#09090b");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Sunlight Caustics (Visible when water is reasonably clear)
        if (cleanliness > 25) {
          ctx.save();
          ctx.globalAlpha = Math.max(0.01, 0.12 * (1 - dirtRatio));
          ctx.fillStyle = "#ffffff";
          for (let i = 0; i < 6; i++) {
            const cx = ((time * 30 + i * 170) % (width + 200)) - 100;
            ctx.beginPath();
            ctx.ellipse(cx, 25 + Math.sin(time + i) * 10, 85, 20, Math.sin(time * 0.5 + i) * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 3. Swaying Aquatic Plants at Back
        plantsRef.current.forEach((plant) => {
          ctx.save();
          ctx.fillStyle = plant.color;
          ctx.beginPath();
          ctx.moveTo(plant.baseX, height - 20);

          const currentSway = Math.sin(time * 1.5 + plant.phaseOffset) * 28;
          const segHeight = plant.height / plant.segments;

          let curX = plant.baseX;
          let curY = height - 20;

          for (let s = 1; s <= plant.segments; s++) {
            const segSway = (s / plant.segments) * currentSway;
            const nextX = plant.baseX + segSway;
            const nextY = height - 20 - s * segHeight;
            const cpX = (curX + nextX) / 2 + Math.sin(time + s) * 5;
            const cpY = (curY + nextY) / 2;
            ctx.quadraticCurveTo(cpX, cpY, nextX, nextY);
            curX = nextX;
            curY = nextY;
          }

          ctx.lineTo(curX + plant.width * 0.4, curY);
          for (let s = plant.segments - 1; s >= 0; s--) {
            const segSway = (s / plant.segments) * currentSway;
            const nextX = plant.baseX + plant.width + segSway;
            const nextY = height - 20 - s * segHeight;
            ctx.lineTo(nextX, nextY);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });

        // 4. Sand Bed with Textured Dunes
        const sandGrad = ctx.createLinearGradient(0, height - 35, 0, height);
        if (cleanliness < 30) {
          sandGrad.addColorStop(0, "#713f12");
          sandGrad.addColorStop(0.5, "#3f2c06");
          sandGrad.addColorStop(1, "#1c1917");
        } else {
          sandGrad.addColorStop(0, "#d4af37");
          sandGrad.addColorStop(0.3, "#e6c35c");
          sandGrad.addColorStop(1, "#b38f26");
        }
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, height - 25);
        for (let x = 0; x <= width; x += 40) {
          const yOffset = Math.sin(x * 0.015 + 1) * 8 + Math.cos(x * 0.03) * 4;
          ctx.lineTo(x, height - 25 + yOffset);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // 5. Air Bubbles
        if (Math.random() < 0.28 || (tank?.hasMotor && Math.random() < 0.65)) {
          bubblesRef.current.push({
            x: tank?.hasMotor ? width * 0.12 + (Math.random() * 40 - 20) : Math.random() * (width - 40) + 20,
            y: height - 20,
            radius: 2 + Math.random() * 4.5,
            speed: 1.2 + Math.random() * 2.2,
            wobble: 0,
            wobbleSpeed: 0.05 + Math.random() * 0.05,
            alpha: 0.5 + Math.random() * 0.4,
          });
        }

        bubblesRef.current.forEach((b, idx) => {
          b.y -= b.speed;
          b.wobble += b.wobbleSpeed;
          const wobbleX = b.x + Math.sin(b.wobble) * 6;

          ctx.save();
          ctx.globalAlpha = b.alpha;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(wobbleX, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(wobbleX - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (b.y < 10) {
            bubblesRef.current.splice(idx, 1);
          }
        });

        // 6. Surface Water Ripple Waves (From feeding drops)
        ripplesRef.current.forEach((rip, rIdx) => {
          rip.radius += 1.4;
          rip.alpha -= 0.02;

          ctx.save();
          ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
            ripplesRef.current.splice(rIdx, 1);
          }
        });

        // 7. Floating Food Particles Physics & Sinking
        foodParticlesRef.current.forEach((food, fIdx) => {
          food.wobble += 0.05;
          food.y += food.vy;
          food.x += Math.sin(food.wobble) * 0.8 + food.vx;
          food.vx *= 0.96;

          ctx.save();
          ctx.fillStyle = food.color;
          ctx.shadowBlur = 4;
          ctx.shadowColor = food.color;
          ctx.beginPath();
          ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Remove if sank to sand bed
          if (food.y > height - 25) {
            foodParticlesRef.current.splice(fIdx, 1);
          }
        });

        // 8. Fish Physics, Swimming, and Food Consumption
        actorsRef.current.forEach((actor) => {
          let targetX = actor.targetX;
          let targetY = actor.targetY;
          let isChasingFood = false;

          // Detect nearest food particle
          if (foodParticlesRef.current.length > 0) {
            let closestFood: FoodParticle | null = null;
            let closestDist = 320;

            foodParticlesRef.current.forEach((fp) => {
              const dist = Math.hypot(fp.x - actor.x, fp.y - actor.y);
              if (dist < closestDist) {
                closestDist = dist;
                closestFood = fp;
              }
            });

            if (closestFood) {
              targetX = (closestFood as FoodParticle).x;
              targetY = (closestFood as FoodParticle).y;
              isChasingFood = true;

              // Eat the food particle!
              if (closestDist < actor.size * 0.65) {
                const eatenIndex = foodParticlesRef.current.indexOf(closestFood);
                if (eatenIndex > -1) {
                  foodParticlesRef.current.splice(eatenIndex, 1);
                  actor.eatingAnimationTicks = 35; // trigger bite celebration

                  // Burst of tiny consumption bubbles
                  for (let k = 0; k < 4; k++) {
                    bubblesRef.current.push({
                      x: actor.x,
                      y: actor.y,
                      radius: 2 + Math.random() * 2,
                      speed: 2.2,
                      wobble: 0,
                      wobbleSpeed: 0.1,
                      alpha: 0.8,
                    });
                  }

                  // Spawn "+Yum!" Floating Text Effect
                  eatingEffectsRef.current.push({
                    x: actor.x,
                    y: actor.y - 15,
                    text: "✨ +Yum!",
                    alpha: 1.0,
                    scale: 1.0,
                  });
                }
              }
            }
          }

          actor.isHuntingFood = isChasingFood;

          const dx = targetX - actor.x;
          const dy = targetY - actor.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 40 && !isChasingFood) {
            actor.targetX = Math.random() * (width - 160) + 80;
            actor.targetY = Math.random() * (height - 140) + 60;
          }

          const accel = isChasingFood ? 0.09 : 0.035;
          const desiredSpeed = isChasingFood ? 2.8 : 1.3;

          if (dist > 0) {
            actor.vx += (dx / dist) * accel;
            actor.vy += (dy / dist) * accel;
          }

          // Glass boundary bouncing
          const margin = 40;
          if (actor.x < margin) actor.vx += 0.18;
          if (actor.x > width - margin) actor.vx -= 0.18;
          if (actor.y < margin) actor.vy += 0.18;
          if (actor.y > height - margin - 30) actor.vy -= 0.18;

          const currentSpeed = Math.hypot(actor.vx, actor.vy);
          if (currentSpeed > desiredSpeed) {
            actor.vx = (actor.vx / currentSpeed) * desiredSpeed;
            actor.vy = (actor.vy / currentSpeed) * desiredSpeed;
          }

          actor.x += actor.vx;
          actor.y += actor.vy;

          const targetAngle = Math.atan2(actor.vy, actor.vx);
          let angleDiff = targetAngle - actor.angle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          actor.angle += angleDiff * 0.12;

          actor.tailPhase += actor.tailSpeed * (currentSpeed + 0.5);

          // RENDER FISH (Fish visibility reduces if water is murky, but front sludge covers even more)
          ctx.save();
          ctx.translate(actor.x, actor.y);
          ctx.rotate(actor.angle);

          const len = actor.size;
          const halfH = len * 0.38;
          const tailWag = Math.sin(actor.tailPhase) * (len * 0.22);

          // Tail Fin
          ctx.save();
          ctx.fillStyle = actor.data.species.secondaryColor || actor.data.species.primaryColor;
          ctx.beginPath();
          ctx.moveTo(-len * 0.45, 0);

          if (actor.data.species.finShape === "veil" || actor.data.species.finShape === "ribbon") {
            ctx.bezierCurveTo(
              -len * 0.8,
              -halfH * 1.6 + tailWag * 0.5,
              -len * 1.3,
              -halfH * 1.2 + tailWag,
              -len * 1.4,
              tailWag
            );
            ctx.bezierCurveTo(
              -len * 1.3,
              halfH * 1.2 + tailWag,
              -len * 0.8,
              halfH * 1.6 + tailWag * 0.5,
              -len * 0.45,
              0
            );
          } else if (actor.data.species.finShape === "fork") {
            ctx.lineTo(-len * 1.05, -halfH * 1.2 + tailWag);
            ctx.lineTo(-len * 0.75, tailWag * 0.5);
            ctx.lineTo(-len * 1.05, halfH * 1.2 + tailWag);
          } else {
            ctx.quadraticCurveTo(-len * 0.8, -halfH * 1.1 + tailWag, -len * 1.0, -halfH * 0.8 + tailWag);
            ctx.quadraticCurveTo(-len * 1.1, tailWag, -len * 1.0, halfH * 0.8 + tailWag);
            ctx.quadraticCurveTo(-len * 0.8, halfH * 1.1 + tailWag, -len * 0.45, 0);
          }
          ctx.closePath();
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.restore();

          // Dorsal Fin
          ctx.save();
          ctx.fillStyle = actor.data.species.secondaryColor || actor.data.species.primaryColor;
          ctx.beginPath();
          ctx.moveTo(-len * 0.1, -halfH * 0.85);
          ctx.quadraticCurveTo(0, -halfH * 1.6, len * 0.25, -halfH * 0.7);
          ctx.closePath();
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.restore();

          // Body
          ctx.save();
          ctx.fillStyle = actor.data.species.primaryColor;
          ctx.beginPath();
          ctx.ellipse(0, 0, len * 0.5, halfH, 0, 0, Math.PI * 2);
          ctx.fill();

          // Pattern
          if (actor.data.species.pattern === "striped") {
            ctx.strokeStyle = actor.data.species.secondaryColor || "#ffffff";
            ctx.lineWidth = len * 0.08;
            ctx.beginPath();
            ctx.moveTo(-len * 0.15, -halfH * 0.9);
            ctx.lineTo(-len * 0.15, halfH * 0.9);
            ctx.moveTo(len * 0.1, -halfH * 0.95);
            ctx.lineTo(len * 0.1, halfH * 0.95);
            ctx.stroke();
          } else if (actor.data.species.pattern === "spotted") {
            ctx.fillStyle = actor.data.species.secondaryColor || "#000000";
            ctx.beginPath();
            ctx.arc(-len * 0.1, -halfH * 0.3, len * 0.08, 0, Math.PI * 2);
            ctx.arc(-len * 0.2, halfH * 0.2, len * 0.07, 0, Math.PI * 2);
            ctx.arc(len * 0.1, 0, len * 0.09, 0, Math.PI * 2);
            ctx.fill();
          } else if (actor.data.species.pattern === "glow") {
            ctx.strokeStyle = actor.data.species.secondaryColor;
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = actor.data.species.secondaryColor;
            ctx.stroke();
          }

          // Eye
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(len * 0.32, -halfH * 0.25, len * 0.12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(len * 0.35, -halfH * 0.25, len * 0.065, 0, Math.PI * 2);
          ctx.fill();

          // Pectoral fin
          const finFlutter = Math.sin(time * 6 + actor.tailPhase) * (halfH * 0.4);
          ctx.fillStyle = actor.data.species.secondaryColor || "#ffffff";
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.moveTo(len * 0.05, 0);
          ctx.quadraticCurveTo(-len * 0.15, halfH * 0.8 + finFlutter, -len * 0.05, halfH * 0.5);
          ctx.closePath();
          ctx.fill();

          // Bite mouth animation if currently chewing food
          if (actor.eatingAnimationTicks > 0) {
            actor.eatingAnimationTicks--;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(len * 0.48, 0, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();

          // Danger indicator if starving
          if (actor.data.hunger < 25 || actor.data.health < 35) {
            ctx.save();
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚠️", 0, -halfH - 14);
            ctx.restore();
          }

          ctx.restore();
        });

        // 9. Floating Text Eating Effects ("+Yum!")
        eatingEffectsRef.current.forEach((eff, eIdx) => {
          eff.y -= 0.8;
          eff.alpha -= 0.025;

          ctx.save();
          ctx.globalAlpha = Math.max(0, eff.alpha);
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 14px sans-serif";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#38bdf8";
          ctx.fillText(eff.text, eff.x, eff.y);
          ctx.restore();

          if (eff.alpha <= 0) {
            eatingEffectsRef.current.splice(eIdx, 1);
          }
        });

        // 10. --- GRADUAL DYNAMIC TANK UNCLEANLINESS & ALGAE GLASS SIMULATION ---
        if (dirtRatio > 0.08) {
          // A. Mild floating detritus/dirt specks flowing with water currents (smoothly scaled)
          const particleCount = Math.floor(dirtRatio * 35);
          ctx.save();
          ctx.fillStyle = dirtRatio > 0.6 ? "rgba(101, 163, 13, 0.35)" : "rgba(163, 230, 53, 0.18)";
          for (let i = 0; i < particleCount; i++) {
            const px = ((Math.sin(time * 0.25 + i * 37) * 0.5 + 0.5) * (width + 60)) - 30;
            const py = ((Math.cos(time * 0.12 + i * 29) * 0.5 + 0.5) * height);
            const size = 1.0 + (i % 2) * (1 + dirtRatio * 0.8);
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // B. Subtle Algae growth patches forming on the tank glass corners and edges
          const activeAlgaeCount = Math.floor(algaePatchesRef.current.length * Math.min(1.0, dirtRatio * 1.2));
          ctx.save();
          for (let i = 0; i < activeAlgaeCount; i++) {
            const patch = algaePatchesRef.current[i];
            ctx.save();
            ctx.translate(patch.x, patch.y);
            ctx.rotate(patch.rotation);
            // Smooth exponential fade-in for algae
            const patchAlpha = patch.alpha * Math.pow(dirtRatio, 2.0) * 0.55;
            ctx.globalAlpha = Math.min(0.65, patchAlpha);
            ctx.fillStyle = patch.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, patch.radiusX * (0.5 + dirtRatio * 0.5), patch.radiusY * (0.5 + dirtRatio * 0.5), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          ctx.restore();

          // C. Thick Murky Slime & Glass Grime Blanket ONLY when severely unclean (cleanliness < 25% / dirtRatio > 0.75)
          if (dirtRatio > 0.75) {
            ctx.save();
            const sludgeIntensity = (dirtRatio - 0.75) / 0.25; // 0.0 to 1.0
            const glassSludgeAlpha = Math.min(0.88, sludgeIntensity * 0.88);
            ctx.globalAlpha = glassSludgeAlpha;

            // Gradient sludge covering the front glass pane
            const sludgeGrad = ctx.createRadialGradient(
              width / 2,
              height / 2,
              width * 0.15,
              width / 2,
              height / 2,
              width * 0.65
            );
            sludgeGrad.addColorStop(0, "rgba(28, 25, 23, 0.85)");
            sludgeGrad.addColorStop(0.5, "rgba(42, 60, 10, 0.90)");
            sludgeGrad.addColorStop(1, "rgba(20, 45, 5, 0.95)");

            ctx.fillStyle = sludgeGrad;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
          }

          // D. CRITICAL UNCLEAN WARNING OVERLAY (only when <= 5% cleanliness)
          if (cleanliness <= 5) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, height / 2 - 38, width, 76);

            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 15px sans-serif";
            ctx.textAlign = "center";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ef4444";
            ctx.fillText(
              "⚠️ CRITICAL: WATER IS HIGHLY CONTAMINATED! PLEASE CLEAN TANK",
              width / 2,
              height / 2 - 8
            );

            ctx.fillStyle = "#fef08a";
            ctx.font = "12px sans-serif";
            ctx.fillText(
              "Water toxicity is harming fish health. Click Clean Tank to restore water quality.",
              width / 2,
              height / 2 + 18
            );
            ctx.restore();
          }
        }

        animFrameRef.current = requestAnimationFrame(render);
      };

      animFrameRef.current = requestAnimationFrame(render);

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }, [tank]);

    // Canvas click -> Drop food at exact click location
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Check if clicked directly on an alive fish
      let clickedActor: FishActor | null = null;
      for (const actor of actorsRef.current) {
        const dist = Math.hypot(actor.x - clickX, actor.y - clickY);
        if (dist < actor.size * 0.85) {
          clickedActor = actor;
          break;
        }
      }

      if (clickedActor) {
        onSelectFish(clickedActor.data);
      } else {
        // Drop food flakes at this point!
        dropFoodBurst(clickX, clickY);
        if (onDropFood) onDropFood();
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      let found: FishActor | null = null;
      for (const actor of actorsRef.current) {
        const dist = Math.hypot(actor.x - mouseX, actor.y - mouseY);
        if (dist < actor.size * 0.85) {
          found = actor;
          break;
        }
      }

      if (found) {
        setHoveredFish({
          fish: found.data,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        setHoveredFish(null);
      }
    };

    return (
      <div className="relative w-full rounded-3xl overflow-hidden glass-panel border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Canvas Element */}
        <canvas
          ref={canvasRef}
          width={960}
          height={500}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredFish(null)}
          className="w-full h-[400px] md:h-[480px] block cursor-pointer transition-all duration-300"
        />

        {/* Floating Hover Tooltip */}
        {hoveredFish && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl glass-dropdown border border-cyan-400/40 text-xs shadow-2xl backdrop-blur-md transition-all duration-150"
            style={{ left: `${hoveredFish.x}px`, top: `${hoveredFish.y - 12}px` }}
          >
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>{hoveredFish.fish.nickname || hoveredFish.fish.species.name}</span>
              <span className="text-[10px] text-cyan-300 font-normal">
                ({hoveredFish.fish.sex === "MALE" ? "♂ Male" : "♀ Female"})
              </span>
            </div>
            <div className="text-slate-300 text-[11px] mb-1">{hoveredFish.fish.species.name}</div>
            <div className="flex gap-2 items-center mt-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Hunger:</span>
                <span
                  className={`font-semibold ${
                    hoveredFish.fish.hunger < 30 ? "text-rose-400" : "text-cyan-300"
                  }`}
                >
                  {Math.round(hoveredFish.fish.hunger)}%
                </span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Health:</span>
                <span
                  className={`font-semibold ${
                    hoveredFish.fish.health < 40 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {Math.round(hoveredFish.fish.health)}%
                </span>
              </div>
            </div>
            <div className="text-[10px] text-cyan-400/80 mt-1 italic">Click to view details & actions</div>
          </div>
        )}

        {/* Tip Banner at bottom */}
        <div className="absolute bottom-2.5 left-3 right-3 flex justify-between items-center text-[11px] text-cyan-200/70 pointer-events-none">
          <span>💡 Click anywhere in tank to drop food | Click fish to inspect & feed</span>
          <span>{tank ? `${tank.fish.length} Fish swimming` : ""}</span>
        </div>
      </div>
    );
  }
);

AquariumCanvas.displayName = "AquariumCanvas";

export default AquariumCanvas;
