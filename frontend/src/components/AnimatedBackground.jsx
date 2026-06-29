import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Pixel sizes
    const scale = 3; // Scale of pixel art
    const blockPixelSize = 8;
    const blockSize = blockPixelSize * scale; // 24px per block

    // Star data (twinkling pixel stars)
    const stars = [];
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.7),
        size: Math.floor(Math.random() * 2) + 1,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        alpha: Math.random()
      });
    }

    // Cloud data (drifting blocky clouds)
    const clouds = [
      { x: width * 0.1, y: height * 0.15, w: 120, h: 40, speed: 0.15 },
      { x: width * 0.5, y: height * 0.08, w: 180, h: 50, speed: 0.08 },
      { x: width * 0.8, y: height * 0.22, w: 100, h: 35, speed: 0.2 }
    ];

    // Character State: Steve
    const steve = {
      x: -50,
      y: height - blockSize - 48, // 48px is height of character
      w: 8 * scale, // 24px
      h: 16 * scale, // 48px
      speed: 0.8,
      frame: 0
    };

    // Character State: Creeper
    const creeper = {
      x: -150,
      y: height - blockSize - 46, // 46px height
      w: 8 * scale,
      h: 15 * scale,
      speed: 0.82, // slightly faster to catch Steve!
      frame: 0
    };

    // Pig (Passive Mob trailing)
    const pig = {
      x: -250,
      y: height - blockSize - 30,
      w: 10 * scale,
      h: 10 * scale,
      speed: 0.8,
      frame: 0
    };

    // 8x8 Grass block color index map
    const grassMap = [
      '00000000',
      '00000000',
      '01010101',
      '11111111',
      '11211211',
      '12221221',
      '22222222',
      '22222222'
    ];
    const grassColors = {
      '0': '#5c8e32', // Grass Green
      '1': '#866043', // Dirt light brown
      '2': '#573d26'  // Dirt dark brown
    };

    // Draw a single 8x8 grass/dirt block
    const drawGrassBlock = (ctx, bx, by) => {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const color = grassColors[grassMap[r][c]];
          ctx.fillStyle = color;
          ctx.fillRect(bx + c * scale, by + r * scale, scale, scale);
        }
      }
    };

    // Draw Steve pixel art character with walking leg swing
    const drawSteve = (ctx, char, time) => {
      const sx = char.x;
      const sy = char.y;
      const swing = Math.sin(time * 0.15);

      // 1. Head (8x8 pixels) - offset slightly for bobbing
      const headBob = Math.abs(Math.sin(time * 0.3)) * scale * 0.3;
      const hx = sx;
      const hy = sy - headBob;
      
      // Head base skin color
      ctx.fillStyle = '#f1c296'; 
      ctx.fillRect(hx + 2 * scale, hy, 4 * scale, 4 * scale);
      // Hair
      ctx.fillStyle = '#4a321a';
      ctx.fillRect(hx + 2 * scale, hy, 4 * scale, 1.2 * scale);
      ctx.fillRect(hx + 2 * scale, hy, 1.2 * scale, 2.5 * scale);
      ctx.fillRect(hx + 4.8 * scale, hy, 1.2 * scale, 2.5 * scale);
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx + 2.5 * scale, hy + 2 * scale, 0.7 * scale, 0.5 * scale);
      ctx.fillRect(hx + 4.8 * scale, hy + 2 * scale, 0.7 * scale, 0.5 * scale);
      ctx.fillStyle = '#2b3d75'; // Blue eyes
      ctx.fillRect(hx + 2.8 * scale, hy + 2 * scale, 0.4 * scale, 0.5 * scale);
      ctx.fillRect(hx + 4.8 * scale, hy + 2 * scale, 0.4 * scale, 0.5 * scale);

      // 2. Body / Torso (Teal shirt: 4x6 px)
      ctx.fillStyle = '#00a8a8';
      ctx.fillRect(sx + 2 * scale, sy + 4 * scale, 4 * scale, 6 * scale);

      // 3. Arms (Teal sleeves, skin hands)
      // Left Arm (swings back)
      ctx.fillStyle = '#00a8a8';
      ctx.fillRect(sx + 1.2 * scale, sy + 4 * scale, 1 * scale, 3 * scale);
      ctx.fillStyle = '#f1c296';
      ctx.fillRect(sx + (1.2 - swing * 0.3) * scale, sy + 7 * scale, 1 * scale, 3 * scale);

      // Right Arm (swings forward)
      ctx.fillStyle = '#00a8a8';
      ctx.fillRect(sx + 5.8 * scale, sy + 4 * scale, 1 * scale, 3 * scale);
      ctx.fillStyle = '#f1c296';
      ctx.fillRect(sx + (5.8 + swing * 0.3) * scale, sy + 7 * scale, 1 * scale, 3 * scale);

      // 4. Legs (Blue pants, Gray shoes)
      // Leg 1 (swing)
      ctx.fillStyle = '#2b3d75'; // pants
      ctx.fillRect(sx + (2.5 + swing * 0.3) * scale, sy + 10 * scale, 1.3 * scale, 4 * scale);
      ctx.fillStyle = '#3c3c3c'; // shoes
      ctx.fillRect(sx + (2.5 + swing * 0.3) * scale, sy + 14 * scale, 1.3 * scale, 1 * scale);

      // Leg 2 (inverse swing)
      ctx.fillStyle = '#2b3d75';
      ctx.fillRect(sx + (4.2 - swing * 0.3) * scale, sy + 10 * scale, 1.3 * scale, 4 * scale);
      ctx.fillStyle = '#3c3c3c';
      ctx.fillRect(sx + (4.2 - swing * 0.3) * scale, sy + 14 * scale, 1.3 * scale, 1 * scale);
    };

    // Draw Creeper character
    const drawCreeper = (ctx, char, time) => {
      const cx = char.x;
      const cy = char.y;
      const swing = Math.sin(time * 0.15 + Math.PI); // Out of phase leg swing

      // Head (Creeper Face: 6x6 px)
      ctx.fillStyle = '#248a1a'; // Base green
      ctx.fillRect(cx + 2 * scale, cy, 4 * scale, 4 * scale);
      
      // Creeper face print (Black pixels)
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx + 2.5 * scale, cy + 1.5 * scale, 0.8 * scale, 0.8 * scale); // Eye L
      ctx.fillRect(cx + 4.7 * scale, cy + 1.5 * scale, 0.8 * scale, 0.8 * scale); // Eye R
      ctx.fillRect(cx + 3.4 * scale, cy + 2.3 * scale, 1.2 * scale, 1.2 * scale); // Nose
      ctx.fillRect(cx + 3.0 * scale, cy + 3.0 * scale, 0.5 * scale, 1.0 * scale); // Mouth L
      ctx.fillRect(cx + 4.5 * scale, cy + 3.0 * scale, 0.5 * scale, 1.0 * scale); // Mouth R

      // Body (Green Torso: 4x6 px)
      ctx.fillStyle = '#1e7516';
      ctx.fillRect(cx + 2 * scale, cy + 4 * scale, 4 * scale, 6 * scale);

      // 4 blocky legs at bottom
      ctx.fillStyle = '#15570f';
      // Front L Leg
      ctx.fillRect(cx + (2 + swing * 0.3) * scale, cy + 10 * scale, 1.3 * scale, 3 * scale);
      // Front R Leg
      ctx.fillRect(cx + (4.7 - swing * 0.3) * scale, cy + 10 * scale, 1.3 * scale, 3 * scale);
      // Back legs (fainter/darker green)
      ctx.fillStyle = '#0a3207';
      ctx.fillRect(cx + (3.3 - swing * 0.2) * scale, cy + 10 * scale, 1.3 * scale, 3 * scale);
      ctx.fillRect(cx + (4.2 + swing * 0.2) * scale, cy + 10 * scale, 1.3 * scale, 3 * scale);
    };

    // Draw Pig passive mob
    const drawPig = (ctx, char, time) => {
      const px = char.x;
      const py = char.y;
      const swing = Math.sin(time * 0.15);

      // Body (Pink: 8x5 px)
      ctx.fillStyle = '#ff9999';
      ctx.fillRect(px + 2 * scale, py + 2 * scale, 6 * scale, 4 * scale);

      // Head (Pink: 4x4 px, drawn L-facing)
      ctx.fillStyle = '#ff8080';
      ctx.fillRect(px + 6 * scale, py + 1 * scale, 3 * scale, 3 * scale);
      // Snout
      ctx.fillStyle = '#e56464';
      ctx.fillRect(px + 8 * scale, py + 2.5 * scale, 1.2 * scale, 0.8 * scale);
      // Eye L
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 7 * scale, py + 1.8 * scale, 0.6 * scale, 0.6 * scale);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 7.3 * scale, py + 1.8 * scale, 0.3 * scale, 0.6 * scale);

      // Legs (Pink)
      ctx.fillStyle = '#e56464';
      ctx.fillRect(px + (3.5 + swing * 0.25) * scale, py + 6 * scale, 1 * scale, 2 * scale);
      ctx.fillRect(px + (6.5 - swing * 0.25) * scale, py + 6 * scale, 1 * scale, 2 * scale);
    };

    // Draw Pixel clouds on canvas
    const drawPixelCloud = (ctx, cx, cy, cw, ch) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // faint white
      // Minecraft clouds are made of rectangular steps
      const block = 10;
      ctx.fillRect(cx, cy, cw, ch);
      ctx.fillRect(cx + block, cy - block, cw - 2 * block, ch + 2 * block);
      ctx.fillRect(cx - block, cy + block, cw + 2 * block, ch - 2 * block);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      // Update coordinates
      steve.y = height - blockSize - 48;
      creeper.y = height - blockSize - 46;
      pig.y = height - blockSize - 30;
    };

    window.addEventListener('resize', handleResize);

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Sky background gradient (Sunset/Night cycle look)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0d0b18'); // deep dark blue void
      grad.addColorStop(0.7, '#1b1227'); // purple horizon
      grad.addColorStop(1, '#0e0b1d'); // dark void base
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Twinkling Stars
      stars.forEach(star => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.1) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0; // reset

      // 3. Draw Sun (Minecraft Square Sun)
      const sunSize = 40;
      const sunX = width * 0.75;
      const sunY = height * 0.1 + Math.sin(time * 0.005) * 20;
      ctx.fillStyle = '#ffff55';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffff55';
      ctx.fillRect(sunX, sunY, sunSize, sunSize);
      ctx.shadowBlur = 0; // reset

      // 4. Draw Pixel Clouds
      clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.w < 0) {
          cloud.x = width + 50;
        }
        drawPixelCloud(ctx, cloud.x, cloud.y, cloud.w, cloud.h);
      });

      // 5. Update and Draw characters (Steve, Creeper, Pig)
      time++;
      
      // Update Steve position
      steve.x += steve.speed;
      if (steve.x > width + 100) {
        steve.x = -150;
      }
      
      // Update Creeper position
      creeper.x += creeper.speed;
      if (creeper.x > width + 100) {
        creeper.x = -250;
      }

      // Update Pig position
      pig.x += pig.speed;
      if (pig.x > width + 100) {
        pig.x = -350;
      }

      // Render mobs
      drawPig(ctx, pig, time);
      drawCreeper(ctx, creeper, time);
      drawSteve(ctx, steve, time);

      // 6. Draw Minecraft Grass block floor spanning the bottom width
      const numBlocks = Math.ceil(width / blockSize) + 1;
      for (let i = 0; i < numBlocks; i++) {
        drawGrassBlock(ctx, i * blockSize, height - blockSize);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: '#07050f',
      }}
    />
  );
}
