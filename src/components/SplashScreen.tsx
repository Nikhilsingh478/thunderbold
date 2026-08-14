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
      const glyphs = wordmarkRef.current?.querySelectorAll('g[id^="glyph"]') || [];
      gsap.set(boltIconRef.current, { opacity: 1, filter: 'drop-shadow(0 0 7px rgba(255,195,0,0.5))', scale: 1, y: 0 });
      gsap.set(glyphs, { opacity: 1, y: 0, scale: 1, fill: '#FFFFFF' });
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
    const glyphs = wordmarkRef.current?.querySelectorAll('g[id^="glyph"]') || [];
    gsap.set(glyphs, { opacity: 0, y: 10, scale: 0.94, transformOrigin: 'center center' });

    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        sessionStorage.setItem('tb_splash_shown', 'true');
        document.dispatchEvent(new CustomEvent('thunderbold:loaderDone'));
      }
    });
    tl.timeScale(1.4);

    // t=0.00 — Bolt icon fade-in and subtle scale bounce
    tl.fromTo(boltIconRef.current, {
      opacity: 0,
      scale: 0.7
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    }, 0);

    // t=0.60 — Glow build + bolt surge scale
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 6px #FFC300) drop-shadow(0 0 16px rgba(255,195,0,0.65))',
      scale: 1.08,
      duration: 0.15,
      ease: 'power2.in'
    }, 0.60);

    // t=0.75 — Glow peak (trigger discharges)
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 24px #FFC300) drop-shadow(0 0 50px rgba(255,195,0,0.95)) drop-shadow(0 0 100px rgba(255,195,0,0.4))',
      scale: 1.12,
      duration: 0.1,
      ease: 'power4.out',
      onStart: triggerIconBolt
    }, 0.75);

    // t=0.85 — Glow settle
    tl.to(boltIconRef.current, {
      filter: 'blur(0px) drop-shadow(0 0 8px rgba(255,195,0,0.5))',
      scale: 1.0,
      duration: 0.35,
      ease: 'power2.out'
    }, 0.85);

    // t=0.75 — Wipe mask sweep reveal
    tl.to(wipeMaskRef.current, {
      xPercent: 150,
      duration: 0.42,
      ease: 'power4.out'
    }, 0.75);

    // t=0.75 — Detailed staggered entrance for each letter in SVG
    tl.to(wordmarkRef.current, {
      opacity: 1,
      duration: 0.15,
      ease: 'none'
    }, 0.75);

    tl.to(glyphs, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.32,
      stagger: 0.035,
      ease: 'back.out(1.5)'
    }, 0.75);

    // Cascading electric gold sparks across individual letter glyphs
    glyphs.forEach((gl, i) => {
      const delay = 0.75 + i * 0.035 + 0.02;
      tl.to(gl, { fill: '#F8C80A', duration: 0.06, ease: 'none' }, delay)
        .to(gl, { fill: '#FFFFFF', duration: 0.12, ease: 'power2.out' }, delay + 0.06);
    });

    // t=1.15 — Glow pulse across the wordmark
    tl.to(wordmarkRef.current, {
      filter: 'drop-shadow(0 0 12px rgba(248,200,10,0.5))',
      duration: 0.2,
      ease: 'power2.out'
    }, 1.15).to(wordmarkRef.current, {
      filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.2))',
      duration: 0.35,
      ease: 'power2.inOut'
    }, 1.35);

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
            width: 'clamp(60px, 11vw, 84px)',
            height: 'auto',
            marginBottom: '22px',
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
              willChange: 'opacity, filter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              viewBox="0 0 941 62"
              role="img"
              aria-label="Thunderbold"
              style={{
                width: 'clamp(280px, 62vw, 680px)',
                height: 'auto',
                display: 'block'
              }}
            >
              <g fill="#FFFFFF" fillRule="evenodd" shapeRendering="geometricPrecision">
                <g id="glyph-T">
                  <path d="M 0,1 L 0,11 L 18,11 L 19,12 L 19,60 L 29,60 L 29,13 L 31,11 L 49,11 L 49,1 Z" />
                </g>
                <g id="glyph-H">
                  <path d="M 90,1 L 90,60 L 99,60 L 100,59 L 100,36 L 101,35 L 128,35 L 129,36 L 129,60 L 138,60 L 139,59 L 139,1 L 129,1 L 129,23 L 127,25 L 101,25 L 100,24 L 100,1 Z" />
                </g>
                <g id="glyph-U">
                  <path d="M 183,1 L 183,41 L 184,42 L 184,45 L 185,46 L 185,47 L 187,49 L 187,50 L 194,57 L 195,57 L 196,58 L 197,58 L 198,59 L 199,59 L 200,60 L 203,60 L 204,61 L 212,61 L 213,60 L 217,60 L 218,59 L 219,59 L 220,58 L 221,58 L 222,57 L 223,57 L 226,54 L 227,54 L 227,53 L 230,50 L 230,49 L 231,48 L 231,47 L 232,46 L 232,44 L 233,43 L 233,40 L 234,39 L 234,1 L 224,1 L 223,2 L 224,3 L 224,36 L 223,37 L 223,40 L 222,41 L 222,43 L 216,49 L 214,49 L 213,50 L 203,50 L 202,49 L 201,49 L 199,47 L 198,47 L 197,46 L 197,45 L 195,43 L 195,42 L 194,41 L 194,39 L 193,38 L 193,1 Z" />
                </g>
                <g id="glyph-N">
                  <path d="M 278,1 L 277,2 L 277,59 L 278,60 L 287,60 L 287,21 L 288,20 L 289,20 L 290,21 L 290,22 L 293,25 L 293,26 L 295,28 L 295,29 L 298,32 L 298,33 L 302,37 L 302,38 L 305,41 L 305,42 L 308,45 L 308,46 L 311,49 L 311,50 L 314,53 L 314,54 L 317,57 L 317,58 L 319,60 L 328,60 L 329,59 L 328,58 L 329,57 L 329,2 L 328,1 L 319,1 L 318,2 L 318,39 L 317,40 L 314,37 L 314,36 L 310,32 L 310,31 L 307,28 L 307,27 L 304,24 L 304,23 L 301,20 L 301,19 L 298,16 L 298,15 L 295,12 L 295,11 L 292,8 L 292,7 L 289,4 L 289,3 L 287,1 Z" />
                </g>
                <g id="glyph-D">
                  <path d="M 372,1 L 372,60 L 397,60 L 398,59 L 402,59 L 403,58 L 404,58 L 405,57 L 407,57 L 409,55 L 410,55 L 412,53 L 413,53 L 416,50 L 416,49 L 419,46 L 419,45 L 420,44 L 420,43 L 421,42 L 421,41 L 422,40 L 422,36 L 423,35 L 423,26 L 422,25 L 422,22 L 421,21 L 421,19 L 420,18 L 420,17 L 419,16 L 419,15 L 418,14 L 418,13 L 411,6 L 410,6 L 409,5 L 408,5 L 407,4 L 406,4 L 405,3 L 403,3 L 402,2 L 400,2 L 399,1 Z M 383,11 L 396,11 L 397,12 L 400,12 L 401,13 L 402,13 L 403,14 L 404,14 L 410,20 L 410,21 L 411,22 L 411,23 L 412,24 L 412,27 L 413,28 L 413,32 L 412,33 L 412,36 L 411,37 L 411,39 L 409,41 L 409,42 L 405,46 L 404,46 L 402,48 L 400,48 L 399,49 L 389,49 L 388,50 L 386,50 L 385,49 L 384,50 L 382,48 L 382,12 Z" />
                </g>
                <g id="glyph-E">
                  <path d="M 465,1 L 465,11 L 509,11 L 509,1 Z" />
                  <path d="M 465,25 L 465,35 L 508,35 L 509,36 L 509,25 Z" />
                  <path d="M 465,49 L 465,60 L 510,60 L 510,49 Z" />
                </g>
                <g id="glyph-R">
                  <path d="M 552,1 L 552,60 L 562,60 L 562,12 L 563,11 L 581,11 L 582,12 L 583,12 L 586,15 L 586,16 L 587,17 L 587,23 L 586,24 L 586,25 L 583,28 L 582,28 L 581,29 L 565,29 L 566,30 L 566,31 L 570,35 L 570,36 L 572,38 L 572,39 L 575,42 L 575,43 L 578,46 L 578,47 L 580,49 L 580,50 L 583,53 L 583,54 L 585,56 L 585,57 L 588,60 L 599,60 L 599,58 L 596,55 L 596,54 L 594,52 L 594,51 L 591,48 L 591,47 L 589,45 L 589,44 L 586,41 L 586,40 L 585,39 L 585,38 L 587,36 L 588,36 L 589,35 L 590,35 L 595,30 L 595,29 L 596,28 L 596,27 L 597,26 L 597,23 L 598,22 L 598,17 L 597,16 L 597,14 L 596,13 L 596,11 L 595,10 L 595,9 L 590,4 L 589,4 L 588,3 L 587,3 L 586,2 L 584,2 L 583,1 Z" />
                </g>
                <g id="glyph-B">
                  <path d="M 640,1 L 640,60 L 671,60 L 672,59 L 675,59 L 676,58 L 678,58 L 684,52 L 684,51 L 685,50 L 685,47 L 686,46 L 686,40 L 685,39 L 685,37 L 684,36 L 684,35 L 682,33 L 682,32 L 680,30 L 680,29 L 681,28 L 681,27 L 683,25 L 683,24 L 684,23 L 684,20 L 685,19 L 685,16 L 684,15 L 684,12 L 683,11 L 683,9 L 677,3 L 676,3 L 675,2 L 672,2 L 671,1 Z M 650,36 L 651,35 L 670,35 L 671,36 L 672,36 L 674,38 L 674,39 L 675,40 L 675,45 L 674,46 L 674,47 L 673,48 L 672,48 L 671,49 L 670,49 L 669,50 L 651,50 L 650,49 Z M 650,12 L 651,11 L 669,11 L 670,12 L 671,12 L 673,14 L 673,15 L 674,16 L 674,20 L 673,21 L 673,22 L 671,24 L 670,24 L 669,25 L 651,25 L 650,24 Z" />
                </g>
                <g id="glyph-O">
                  <path d="M 748,0 L 747,1 L 743,1 L 742,2 L 740,2 L 739,3 L 738,3 L 737,4 L 736,4 L 734,6 L 733,6 L 726,13 L 726,14 L 725,15 L 725,16 L 724,17 L 724,18 L 723,19 L 723,21 L 722,22 L 722,25 L 721,26 L 721,34 L 722,35 L 722,39 L 723,40 L 723,42 L 724,43 L 724,44 L 725,45 L 725,46 L 727,48 L 727,49 L 733,55 L 734,55 L 736,57 L 737,57 L 738,58 L 739,58 L 740,59 L 742,59 L 743,60 L 747,60 L 748,61 L 755,61 L 756,60 L 760,60 L 761,59 L 763,59 L 764,58 L 765,58 L 766,57 L 767,57 L 770,54 L 771,54 L 775,50 L 775,49 L 777,47 L 777,46 L 778,45 L 778,44 L 779,43 L 779,42 L 780,41 L 780,38 L 781,37 L 781,24 L 780,23 L 780,20 L 779,19 L 779,18 L 778,17 L 778,16 L 777,15 L 777,14 L 774,11 L 774,10 L 770,6 L 769,6 L 767,4 L 766,4 L 765,3 L 764,3 L 763,2 L 761,2 L 760,1 L 756,1 L 755,0 Z M 746,11 L 756,11 L 757,12 L 759,12 L 760,13 L 761,13 L 763,15 L 764,15 L 765,16 L 765,17 L 768,20 L 768,21 L 769,22 L 769,23 L 770,24 L 770,26 L 771,27 L 771,34 L 770,35 L 770,37 L 769,38 L 769,39 L 768,40 L 768,41 L 765,44 L 765,45 L 764,46 L 763,46 L 761,48 L 760,48 L 759,49 L 757,49 L 756,50 L 746,50 L 745,49 L 744,49 L 743,48 L 742,48 L 741,47 L 740,47 L 735,42 L 735,41 L 733,39 L 733,37 L 732,36 L 732,26 L 733,25 L 733,23 L 734,22 L 734,21 L 736,19 L 736,18 L 740,14 L 741,14 L 742,13 L 743,13 L 744,12 L 745,12 Z" />
                </g>
                <g id="glyph-L">
                  <path d="M 819,1 L 819,60 L 856,60 L 857,59 L 857,50 L 831,50 L 829,48 L 829,1 Z" />
                </g>
                <g id="glyph-D-final">
                  <path d="M 890,1 L 890,60 L 914,60 L 915,59 L 919,59 L 920,58 L 922,58 L 923,57 L 924,57 L 925,56 L 926,56 L 928,54 L 929,54 L 934,49 L 934,48 L 936,46 L 936,45 L 938,43 L 938,41 L 939,40 L 939,38 L 940,37 L 940,24 L 939,23 L 939,21 L 938,20 L 938,18 L 937,17 L 937,16 L 935,14 L 935,13 L 932,10 L 932,9 L 931,9 L 928,6 L 927,6 L 926,5 L 925,5 L 924,4 L 923,4 L 922,3 L 920,3 L 919,2 L 917,2 L 916,1 Z M 901,11 L 914,11 L 915,12 L 917,12 L 918,13 L 920,13 L 922,15 L 923,15 L 924,16 L 924,17 L 927,20 L 927,21 L 929,23 L 929,26 L 930,27 L 930,33 L 929,34 L 929,37 L 928,38 L 928,39 L 927,40 L 927,41 L 921,47 L 920,47 L 919,48 L 917,48 L 916,49 L 913,49 L 912,50 L 911,49 L 910,50 L 902,50 L 900,48 L 900,12 Z" />
                </g>
              </g>
            </svg>
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
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(11px, 1.8vw, 16px)',
            letterSpacing: '0.45em',
            fontWeight: 700,
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
