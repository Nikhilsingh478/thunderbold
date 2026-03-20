const Footer = () => (
  <footer className="bg-void border-t border-sb py-9 px-6 md:py-12 md:px-16 flex items-center justify-between flex-wrap gap-6 md:flex-row flex-col text-center md:text-left">
    <div>
      <span className="font-display text-lg tracking-[0.12em] text-tb-white block mb-1">
        THUNDER<span className="metal-text">⚡</span>BOLT
      </span>
      <span className="font-condensed font-semibold uppercase text-sv-dim" style={{ fontSize: '0.58rem', letterSpacing: '0.24em' }}>
        Built for the Bold
      </span>
    </div>
    <span className="font-body font-light text-sv-dim" style={{ fontSize: '0.78rem' }}>
      © 2025 Thunderbolt Denim. All rights reserved.
    </span>
  </footer>
);

export default Footer;
