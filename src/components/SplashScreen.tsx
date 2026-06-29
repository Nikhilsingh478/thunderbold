import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function SplashScreen() {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('tb_splash_shown');
  });

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);
  const centerStageRef = useRef<HTMLDivElement | null>(null);
  const boltIconRef = useRef<SVGSVGElement | null>(null);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);
  const wipeMaskRef = useRef<HTMLDivElement | null>(null);
  const revealLineRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const exitMaskRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible) return;

    // ── Reduced Motion Detection ───────────────────────────────────────────
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const chars = wordmarkRef.current?.querySelectorAll('.char') || [];
      gsap.set(boltIconRef.current, { opacity: 1, filter: 'drop-shadow(0 0 8px rgba(255,195,0,0.5))', scale: 1, y: 0 });
      gsap.set(chars, { opacity: 1 });
      gsap.set(taglineRef.current, { opacity: 1 });
      gsap.set(wipeMaskRef.current, { xPercent: 155 });
      
      const exitTimer = setTimeout(() => {
        gsap.to(exitMaskRef.current, {
          opacity: 1,
          duration: 0.4,
          onComplete: () => {
            setVisible(false);
            sessionStorage.setItem('tb_splash_shown', 'true');
          }
        });
      }, 1000);

      return () => clearTimeout(exitTimer);
    }

    // ── Canvas Setup ───────────────────────────────────────────────────────
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const handleResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Helpers
    const rnd = (min: number, max: number) => Math.random() * (max - min) + min;

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
      alpha: number;
      decay: number;
      drag: number;
    }

    interface Segment {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      main: boolean;
    }

    interface Bolt {
      segments: Segment[];
      opacity: number;
      decay: number;
      forced: boolean;
    }

    interface Ember {
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      alpha: number;
    }

    const bolts: Bolt[] = [];
    const particles: Spark[] = [];

    const spawnSparks = (x: number, y: number, count: number, isDischarge = false) => {
      for (let i = 0; i < count; i++) {
        const angle = rnd(0, Math.PI * 2);
        const speed = isDischarge ? rnd(4, 13) : rnd(1.5, 5);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (isDischarge ? rnd(1, 3.5) : 0),
          r: rnd(1.2, 2.8),
          color: Math.random() > 0.3 ? '#FFC300' : '#FFFFFF',
          alpha: rnd(0.7, 1),
          decay: rnd(0.015, 0.035),
          drag: rnd(0.94, 0.97)
        });
      }
    };

    const collectSegments = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      depth: number,
      displacement: number,
      segments: Segment[],
      isMain: boolean
    ) => {
      if (depth === 0) {
        segments.push({ x1, y1, x2, y2, main: isMain });
        return;
      }
      const mx = (x1 + x2) / 2 + rnd(-displacement, displacement);
      const my = (y1 + y2) / 2 + rnd(-displacement / 4, displacement / 4);
      collectSegments(x1, y1, mx, my, depth - 1, displacement * 0.5, segments, isMain);
      collectSegments(mx, my, x2, y2, depth - 1, displacement * 0.5, segments, isMain);

      if (isMain && Math.random() < 0.35 && depth > 2) {
        const bx = mx + rnd(-90, 90);
        const by = my + rnd(30, 110);
        collectSegments(mx, my, bx, by, Math.max(depth - 2, 0), displacement * 0.4, segments, false);
      }
    };

    const spawnBolt = (fromX: number, fromY: number, toX: number, toY: number, forced = false) => {
      const segments: Segment[] = [];
      collectSegments(fromX, fromY, toX, toY, 5, 90, segments, true);
      bolts.push({
        segments,
        opacity: 1,
        decay: rnd(0.04, 0.08),
        forced
      });

      if (forced || Math.random() < 0.5) {
        spawnSparks(toX, toY, forced ? 25 : 8, forced);
      }
    };

    // Ambient background embers
    const ambientEmbers: Ember[] = [];
    for (let i = 0; i < 35; i++) {
      ambientEmbers.push({
        x: rnd(0, 1),
        y: rnd(0, 1),
        r: rnd(0.8, 1.6),
        vy: rnd(0.08, 0.28),
        vx: rnd(-0.08, 0.08),
        alpha: rnd(0.1, 0.4)
      });
    }

    const drawGrid = () => {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,185,0,0.018)';
      ctx.lineWidth = 0.5;
      const cell = 60;
      for (let x = 0; x <= W; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += cell) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawAmbientEmbers = () => {
      ctx.save();
      ambientEmbers.forEach(p => {
        p.y -= p.vy / H * 60;
        p.x += p.vx / W * 60;
        if (p.y < -0.01) {
          p.y = 1.01;
          p.x = Math.random();
        }
        if (p.x < -0.01) p.x = 1.01;
        if (p.x > 1.01) p.x = -0.01;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,195,0,${p.alpha})`;
        ctx.fill();
      });
      ctx.restore();
    };

    const updateAndDrawParticles = () => {
      ctx.save();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += 0.04;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.restore();
    };

    const drawLightningBolts = () => {
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.opacity -= b.decay;
        if (b.opacity <= 0) {
          bolts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Glowing bloom layer
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#FFC300';
        b.segments.forEach(s => {
          ctx.lineWidth = s.main ? 5.5 : 2.5;
          ctx.strokeStyle = s.main
            ? `rgba(255,185,0,${0.2 * b.opacity})`
            : `rgba(255,185,0,${0.08 * b.opacity})`;
          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.stroke();
        });

        // Hot electric core layer
        ctx.shadowBlur = 0;
        b.segments.forEach(s => {
          ctx.lineWidth = s.main ? 1.4 : 0.65;
          ctx.strokeStyle = s.main
            ? `rgba(255,255,255,${0.9 * b.opacity})`
            : `rgba(255,200,0,${0.5 * b.opacity})`;
          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.stroke();
        });

        ctx.restore();
      }
    };

    let lastTime = 0;
    let nextBolt = rnd(150, 450);
    let elapsed = 0;
    let canvasAlive = true;

    const animLoop = (ts: number) => {
      if (!canvasAlive) return;
      const dt = ts - lastTime;
      lastTime = ts;
      elapsed += dt;

      ctx.clearRect(0, 0, W, H);

      drawGrid();
      drawAmbientEmbers();
      updateAndDrawParticles();
      drawLightningBolts();

      // Spawn random environment lightning
      if (elapsed > nextBolt) {
        const sx = rnd(W * 0.15, W * 0.85);
        const sy = 0;
        const ex = sx + rnd(-W * 0.25, W * 0.25);
        const ey = rnd(H * 0.35, H * 0.8);
        spawnBolt(sx, sy, ex, ey);
        nextBolt = elapsed + rnd(200, 650);
      }

      requestAnimationFrame(animLoop);
    };
    requestAnimationFrame(animLoop);

    // ── Discharge Trigger ──────────────────────────────────────────────────
    const triggerIconDischarge = () => {
      const bolt = boltIconRef.current;
      if (!bolt) return;
      const bRect = bolt.getBoundingClientRect();
      const ox = bRect.left + bRect.width / 2;
      const oy = bRect.top + bRect.height;

      // Camerashake screenshake
      const shakeTL = gsap.timeline();
      for (let i = 0; i < 8; i++) {
        shakeTL.to(centerStageRef.current, {
          x: gsap.utils.random(-8, 8),
          y: gsap.utils.random(-8, 8),
          duration: 0.04,
          ease: 'none'
        });
      }
      shakeTL.to(centerStageRef.current, { x: 0, y: 0, duration: 0.04, clearProps: 'x,y' });

      // Ambient radial vignette flash
      gsap.fromTo(
        vignetteRef.current,
        { background: 'radial-gradient(ellipse 70% 70% at center, rgba(255,195,0,0.18) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.96) 100%)' },
        { background: 'radial-gradient(ellipse 70% 70% at center, transparent 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.95) 100%)', duration: 0.72, ease: 'power2.out' }
      );

      // Multiple electrical strikes outwards
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const destX = ox + rnd(-160, 160);
          const destY = oy + rnd(H * 0.35, H * 0.7);
          spawnBolt(ox + rnd(-5, 5), oy - 15, destX, destY, true);
          spawnSparks(destX, destY, 18, true);
        }, i * 35);
      }
    };

    // ── Pointerdown Touch Lightning ────────────────────────────────────────
    const handlePointerDown = (e: PointerEvent) => {
      const bolt = boltIconRef.current;
      if (!bolt) return;
      const bRect = bolt.getBoundingClientRect();
      const ox = bRect.left + bRect.width / 2;
      const oy = bRect.top + bRect.height;

      spawnBolt(ox, oy - 15, e.clientX, e.clientY, true);
      spawnSparks(e.clientX, e.clientY, 15, true);

      // Minor screenshake on finger-strike
      gsap.fromTo(
        centerStageRef.current,
        { x: () => rnd(-4, 4), y: () => rnd(-4, 4) },
        { x: 0, y: 0, duration: 0.18, clearProps: 'x,y' }
      );
    };
    window.addEventListener('pointerdown', handlePointerDown);

    // ── GSAP Timeline ──────────────────────────────────────────────────────
    const chars = wordmarkRef.current?.querySelectorAll('.char') || [];
    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        sessionStorage.setItem('tb_splash_shown', 'true');
        document.dispatchEvent(new CustomEvent('thunderbold:loaderDone'));
      }
    });

    // t=0.00 — Enter logo
    tl.to(boltIconRef.current, {
      opacity: 1,
      filter: 'blur(0px) drop-shadow(0 0 0px transparent)',
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.5)'
    }, 0);

    // t=0.55 — Charge glow
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 6px #FFC300) drop-shadow(0 0 16px rgba(255,195,0,0.6))',
      duration: 0.15,
      ease: 'power2.in'
    }, 0.55);

    // t=0.70 — Discharge peak
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 24px #FFC300) drop-shadow(0 0 50px rgba(255,195,0,0.9))',
      duration: 0.1,
      ease: 'power4.out',
      onStart: triggerIconDischarge
    }, 0.70);

    // t=0.82 — Settle glow
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 8px rgba(255,195,0,0.45))',
      duration: 0.38,
      ease: 'power2.out'
    }, 0.82);

    // t=0.70 — Sweep reveal mask
    tl.to(wipeMaskRef.current, {
      xPercent: 155,
      duration: 0.45,
      ease: 'power4.out'
    }, 0.70);

    // t=0.70 — Stagger chars
    tl.to(chars, {
      opacity: 1,
      duration: 0.3,
      stagger: 0.035,
      ease: 'none'
    }, 0.70);

    // t=0.70 — Flicker gold sparks on letters
    chars.forEach((ch, i) => {
      if (Math.random() < 0.35) {
        const delay = 0.70 + i * 0.035 + 0.01;
        tl.to(ch, { color: '#FFC300', duration: 0.04, ease: 'none' }, delay)
          .to(ch, { color: '#FFFFFF', duration: 0.08, ease: 'none' }, delay + 0.04);
      }
    });

    // t=1.35 — Line expand
    tl.to(revealLineRef.current, {
      width: () => wordmarkRef.current?.offsetWidth || 280,
      duration: 0.42,
      ease: 'power4.inOut'
    }, 1.35);

    // t=1.65 — Line shimmer sweep
    tl.to(revealLineRef.current, {
      backgroundPosition: '200% 0',
      duration: 0.38,
      ease: 'power2.inOut'
    }, 1.65);

    // t=1.85 — Dissolve line
    tl.to(revealLineRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.85);

    // t=1.60 — Tagline reveal
    tl.to(taglineRef.current, { opacity: 1, duration: 0.65, ease: 'power2.out' }, 1.60);

    // t=2.30 — Zoom transition exit
    tl.to(centerStageRef.current, {
      scale: 1.35,
      filter: 'blur(20px)',
      opacity: 0,
      duration: 0.55,
      ease: 'power3.in',
      onStart: () => {
        if (loaderRef.current) loaderRef.current.style.pointerEvents = 'none';
      }
    }, 2.30);

    // t=2.35 — Canvas fade out
    tl.to({}, {
      duration: 0.45,
      onStart: () => {
        gsap.to(canvas, { opacity: 0, duration: 0.45 });
      }
    }, 2.35);

    // t=2.45 — Entrance layout overlay cover
    tl.to(exitMaskRef.current, { opacity: 1, duration: 0.52, ease: 'power2.in' }, 2.45);

    // Cleanup logic
    return () => {
      canvasAlive = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      tl.kill();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={loaderRef}
      id="tb-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#070707',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        id="bg-canvas"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      
      {/* Dynamic vignette */}
      <div
        ref={vignetteRef}
        id="vignette"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background: 'radial-gradient(ellipse 70% 70% at center, transparent 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.95) 100%)',
          pointerEvents: 'none',
          willChange: 'background'
        }}
      />
      
      {/* Scanline CRT overlay */}
      <div
        id="scanlines"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none'
        }}
      />

      {/* Cinematic Main stage */}
      <div
        ref={centerStageRef}
        id="center-stage"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          willChange: 'transform, opacity, filter'
        }}
      >
        <svg
          ref={boltIconRef}
          id="bolt-icon"
          viewBox="0 0 44 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '48px',
            height: '78px',
            marginBottom: '24px',
            willChange: 'transform, opacity, filter',
            opacity: 0,
            filter: 'blur(10px) drop-shadow(0 0 0px transparent)',
            transform: 'scale(0.6) translateY(-20px)',
            flexShrink: 0
          }}
        >
          <path d="M26 0L0 42H18L12 72L44 26H24L26 0Z" fill="#FFC300" />
        </svg>

        <div id="wordmark-wrap" style={{ position: 'relative', overflow: 'visible', lineHeight: 1 }}>
          <div
            ref={wordmarkRef}
            id="wordmark"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(62px, 10vw, 104px)',
              letterSpacing: '0.32em',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              WebkitTextStroke: '0.5px rgba(255,255,255,0.3)',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              display: 'flex'
            }}
          >
            {"THUNDERBOLD".split("").map((ch, i) => (
              <span
                key={i}
                className="char"
                style={{
                  display: 'inline-block',
                  opacity: 0,
                  willChange: 'transform, opacity, color'
                }}
              >
                {ch}
              </span>
            ))}
          </div>
          <div
            ref={wipeMaskRef}
            id="wipe-mask"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #070707 0%, #070707 50%, transparent 100%)',
              transform: 'translateX(0%)',
              pointerEvents: 'none',
              zIndex: 2
            }}
          />
        </div>

        {/* Shimmer glowing reveal line */}
        <div
          ref={revealLineRef}
          id="reveal-line"
          style={{
            height: '1.5px',
            width: 0,
            marginTop: '16px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,195,0,0.7) 20%, #FFC300 45%, #FFFFFF 50%, #FFC300 55%, rgba(255,195,0,0.7) 80%, transparent 100%)',
            backgroundSize: '200% 100%',
            backgroundPosition: '-100% 0',
            willChange: 'width, opacity',
            opacity: 1
          }}
        />
        
        <div
          ref={taglineRef}
          id="tagline"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(12px, 2vw, 17px)',
            letterSpacing: '0.58em',
            color: 'rgba(255, 195, 0, 0.75)',
            textTransform: 'uppercase',
            marginTop: '16px',
            opacity: 0,
            willChange: 'opacity'
          }}
        >
          Wear The Energy
        </div>
      </div>

      {/* Cinematic dark out exit overlay */}
      <div
        ref={exitMaskRef}
        id="exit-mask"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          background: '#070707',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
