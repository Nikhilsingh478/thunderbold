const Footer = () => (
  <footer className="bg-void border-t border-sb py-10 px-6 md:py-12 md:px-16 flex flex-col md:flex-row items-center md:justify-between text-center md:text-left gap-5">
    {/* Left */}
    <div>
      <span className="font-display text-lg tracking-[0.12em] text-tb-white block mb-1">
        THUNDER<span className="brass-text">⚡</span>BOLT
      </span>
      <span className="font-condensed font-semibold uppercase text-sv-dim" style={{ fontSize: '0.58rem', letterSpacing: '0.24em' }}>
        Original Denim Supply · Built for the Bold
      </span>
    </div>

    {/* Center — desktop only */}
    <div className="hidden md:block">
      <span className="font-condensed font-semibold uppercase text-sv-dim" style={{ fontSize: '0.58rem', letterSpacing: '0.20em' }}>
        Feel the Power · Embrace Comfort · Be Bold
      </span>
    </div>

    {/* Right */}
    <span className="font-body font-light text-sv-dim" style={{ fontSize: '0.78rem' }}>
      © 2025 Thunderbolt Denim. All rights reserved.
    </span>
  </footer>
);

export default Footer;
