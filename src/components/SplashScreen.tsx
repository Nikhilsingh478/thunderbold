import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function SplashScreen() {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('tb_splash_shown');
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const centerStageRef = useRef<HTMLDivElement | null>(null);
  const boltIconRef = useRef<SVGSVGElement | null>(null);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);
  const wipeMaskRef = useRef<HTMLDivElement | null>(null);
  const revealLineRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const exitMaskRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible) return;

    // ── Reduced Motion Override ───────────────────────────────────────────
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(boltIconRef.current, { opacity: 1, filter: 'drop-shadow(0 0 7px rgba(255,195,0,0.5))', scale: 1, y: 0 });
      gsap.set(wordmarkRef.current, { opacity: 1 });
      gsap.set(taglineRef.current, { opacity: 1 });
      gsap.set(wipeMaskRef.current, { xPercent: 150 });
      
      const exitTimer = setTimeout(() => {
        gsap.to(exitMaskRef.current, {
          opacity: 1,
          duration: 0.4,
          onComplete: () => {
            setVisible(false);
            sessionStorage.setItem('tb_splash_shown', 'true');
            document.dispatchEvent(new CustomEvent('thunderbold:loaderDone'));
          }
        });
      }, 800);

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

    const rnd = (min: number, max: number) => Math.random() * (max - min) + min;

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

    interface Particle {
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      a: number;
    }

    const bolts: Bolt[] = [];

    // Recursive segment builder
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
      const my = (y1 + y2) / 2 + rnd(-displacement / 3.5, displacement / 3.5);
      collectSegments(x1, y1, mx, my, depth - 1, displacement * 0.52, segments, isMain);
      collectSegments(mx, my, x2, y2, depth - 1, displacement * 0.52, segments, isMain);
      
      if (Math.random() < 0.38) {
        const bx = mx + rnd(-70, 70);
        const by = my + rnd(25, 90);
        collectSegments(mx, my, bx, by, Math.max(depth - 2, 0), displacement * 0.4, segments, false);
      }
    };

    const spawnBolt = (fromX: number, fromY: number, toX: number, toY: number, forced = false) => {
      const segments: Segment[] = [];
      collectSegments(fromX, fromY, toX, toY, 5, 85, segments, true);
      bolts.push({
        segments,
        opacity: 1,
        decay: rnd(0.035, 0.065),
        forced
      });
    };

    // Ambient floating particles
    const particles: Particle[] = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: rnd(0, 1),
        y: rnd(0, 1),
        r: rnd(0.8, 1.9),
        vy: rnd(0.1, 0.38),
        vx: rnd(-0.12, 0.12),
        a: rnd(0.12, 0.48)
      });
    }

    const drawGrid = () => {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,185,0,0.028)';
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

    const drawParticles = () => {
      ctx.save();
      particles.forEach(p => {
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
        ctx.fillStyle = `rgba(255,195,0,${p.a * 0.7})`;
        ctx.fill();
      });
      ctx.restore();
    };

    const drawBolts = () => {
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.opacity -= b.decay;
        if (b.opacity <= 0) {
          bolts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = b.opacity;

        // Afterglow pass
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = `rgba(255,195,0,0.06)`;
        ctx.lineCap = 'round';
        b.segments.forEach(s => {
          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.stroke();
        });

        // Main electric pass
        b.segments.forEach(s => {
          ctx.lineWidth = s.main ? 1.6 : 0.75;
          ctx.strokeStyle = s.main
            ? `rgba(255,200,0,${0.85 * b.opacity})`
            : `rgba(255,195,0,${0.42 * b.opacity})`;
          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.stroke();
        });

        ctx.restore();
      }
    };

    let lastTime = 0;
    let nextBolt = rnd(120, 400);
    let lastSheetTime = 0;
    let nextSheet = rnd(800, 2000);
    let elapsed = 0;
    let canvasAlive = true;

    const animLoop = (ts: number) => {
      if (!canvasAlive) return;
      const dt = ts - lastTime;
      lastTime = ts;
      elapsed += dt;

      ctx.clearRect(0, 0, W, H);

      // Sheet lightning flash
      if (elapsed - lastSheetTime > nextSheet) {
        ctx.save();
        ctx.globalAlpha = 0.018;
        ctx.fillStyle = '#FFC300';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        lastSheetTime = elapsed;
        nextSheet = rnd(700, 2100);
      }

      drawGrid();
      drawParticles();
      drawBolts();

      // Random environmental bolt spawn
      if (elapsed > nextBolt) {
        const side = Math.random();
        let sx, sy, ex, ey;
        if (side < 0.6) {
          sx = rnd(W * 0.1, W * 0.9);
          sy = 0;
          ex = sx + rnd(-W * 0.3, W * 0.3);
          ey = rnd(H * 0.4, H * 0.9);
        } else {
          sx = Math.random() < 0.5 ? rnd(-20, 0) : rnd(W, W + 20);
          sy = rnd(0, H * 0.4);
          ex = W / 2 + rnd(-W * 0.3, W * 0.3);
          ey = rnd(H * 0.3, H * 0.8);
        }
        spawnBolt(sx, sy, ex, ey);
        nextBolt = elapsed + rnd(160, 580);
      }

      requestAnimationFrame(animLoop);
    };
    requestAnimationFrame(animLoop);

    // ── Discharge Trigger ──────────────────────────────────────────────────
    const triggerIconBolt = () => {
      const bolt = boltIconRef.current;
      if (!bolt) return;
      const bRect = bolt.getBoundingClientRect();
      const ox = bRect.left + bRect.width / 2;
      const oy = bRect.top + bRect.height;
      const variants = 3;
      for (let i = 0; i < variants; i++) {
        setTimeout(() => {
          spawnBolt(ox + rnd(-10, 10), oy, ox + rnd(-120, 120), oy + rnd(H * 0.3, H * 0.6), true);
        }, i * 40);
      }
    };

    // ── GSAP Timeline ──────────────────────────────────────────────────────
    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        sessionStorage.setItem('tb_splash_shown', 'true');
        document.dispatchEvent(new CustomEvent('thunderbold:loaderDone'));
      }
    });

    // t=0.00 — Bolt icon fade-in
    tl.to(boltIconRef.current, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    }, 0);

    // t=0.60 — Glow build
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 5px #FFC300) drop-shadow(0 0 14px rgba(255,195,0,0.55))',
      duration: 0.15,
      ease: 'power2.in'
    }, 0.60);

    // t=0.75 — Glow peak (trigger discharges)
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 22px #FFC300) drop-shadow(0 0 45px rgba(255,195,0,0.9)) drop-shadow(0 0 90px rgba(255,195,0,0.35))',
      duration: 0.1,
      ease: 'power4.out',
      onStart: triggerIconBolt
    }, 0.75);

    // t=0.85 — Glow settle
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 7px rgba(255,195,0,0.45))',
      duration: 0.35,
      ease: 'power2.out'
    }, 0.85);

    // t=0.75 — Wipe mask sweep reveal wordmark
    tl.to(wipeMaskRef.current, {
      xPercent: 150,
      duration: 0.42,
      ease: 'power4.out'
    }, 0.75);

    // t=0.75 — Wordmark fade-in
    tl.to(wordmarkRef.current, {
      opacity: 1,
      duration: 0.35,
      ease: 'power2.out'
    }, 0.75);

    // t=1.35 — Line expand
    tl.to(revealLineRef.current, {
      width: () => wordmarkRef.current?.offsetWidth || 280,
      duration: 0.38,
      ease: 'power4.inOut'
    }, 1.35);

    // t=1.65 — Shimmer sweep
    tl.to(revealLineRef.current, {
      backgroundPosition: '200% 0',
      duration: 0.35,
      ease: 'power2.inOut'
    }, 1.65);

    // t=1.87 — Fade line
    tl.to(revealLineRef.current, { opacity: 0, duration: 0.38, ease: 'power2.in' }, 1.87);

    // t=1.60 — Tagline fade-in
    tl.to(taglineRef.current, { opacity: 1, duration: 0.62, ease: 'power2.out' }, 1.60);

    // t=2.33 — Center stage exit slide-up
    tl.to(centerStageRef.current, {
      y: -14,
      opacity: 0,
      duration: 0.42,
      ease: 'power3.in',
      onStart: () => {
        const loader = document.getElementById('tb-loader');
        if (loader) loader.style.pointerEvents = 'none';
      }
    }, 2.33);

    // t=2.43 — Canvas fade
    tl.to({}, {
      duration: 0.45,
      onStart: () => {
        gsap.to(canvas, { opacity: 0, duration: 0.45 });
      }
    }, 2.43);

    // t=2.53 — Exit overlay fade
    tl.to(exitMaskRef.current, { opacity: 1, duration: 0.52, ease: 'power2.in' }, 2.53);

    // Cleanup logic
    return () => {
      canvasAlive = false;
      window.removeEventListener('resize', handleResize);
      tl.kill();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      id="tb-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#080808',
        overflow: 'hidden'
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
          height: '100%'
        }}
      />
      
      <div
        id="vignette"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          background: 'radial-gradient(ellipse 70% 70% at center, transparent 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.92) 100%)',
          pointerEvents: 'none'
        }}
      />
      
      <div
        id="scanlines"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
          pointerEvents: 'none'
        }}
      />

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
          willChange: 'transform, opacity'
        }}
      >
        <img
          ref={boltIconRef as any}
          id="bolt-icon"
          src="/loader_assets/thunderbold-bolt.svg"
          alt="Thunderbold lightning mark"
          style={{
            width: '52px',
            height: '60px',
            marginBottom: '20px',
            willChange: 'transform, opacity, filter',
            opacity: 0,
            flexShrink: 0
          }}
        />

        <div id="wordmark-wrap" style={{ position: 'relative', overflow: 'visible', lineHeight: 1 }}>
          <div
            ref={wordmarkRef}
            id="wordmark"
            style={{
              opacity: 0,
              willChange: 'opacity',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src="/loader_assets/thunderbold-wordmark.svg"
              alt="Thunderbold"
              style={{
                width: 'clamp(260px, 58vw, 620px)',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>
          <div
            ref={wipeMaskRef}
            id="wipe-mask"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #080808 0%, #080808 50%, transparent 100%)',
              transform: 'translateX(0%)',
              pointerEvents: 'none',
              zIndex: 2
            }}
          />
        </div>

        <div
          ref={revealLineRef}
          id="reveal-line"
          style={{
            height: '2px',
            width: 0,
            marginTop: '14px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,195,0,0.6) 20%, #FFC300 40%, #FFFFFF 50%, #FFC300 60%, rgba(255,195,0,0.6) 80%, transparent 100%)',
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
            fontSize: 'clamp(11px, 1.8vw, 16px)',
            letterSpacing: '0.55em',
            color: 'rgba(255, 195, 0, 0.72)',
            textTransform: 'uppercase',
            marginTop: '14px',
            opacity: 0,
            willChange: 'opacity'
          }}
        >
          BUILT FOR THE BOLD
        </div>
      </div>

      <div
        ref={exitMaskRef}
        id="exit-mask"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          background: '#080808',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
