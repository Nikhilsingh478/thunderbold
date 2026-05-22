import { useEffect, useRef, useCallback } from 'react';

const CustomCursor = () => {
  // Temporarily disabled as requested
  return null;
  
  // existing code follows (unreachable but kept as requested)
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    mouse.current.x = e.clientX;
    mouse.current.y = e.clientY;
    if (dotRef.current) {
      dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
    }
  }, []);

  useEffect(() => {
    if ('ontouchstart' in window) return;
    document.body.style.cursor = 'none';

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(raf.current);
      document.body.style.cursor = '';
    };
  }, [onMouseMove]);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <div className="hidden md:block pointer-events-none z-[10000] relative">
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          width: 8,
          height: 8,
          backgroundColor: '#d4aa30',
          borderRadius: '50%',
          zIndex: 9999,
        }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none"
        style={{
          width: 36,
          height: 36,
          border: '1px solid rgba(184,148,26,0.35)',
          borderRadius: '50%',
          zIndex: 9998,
        }}
      />
    </div>
  );
};

export default CustomCursor;
