const Navbar = () => {
  const links = ['Manifesto', 'Craft', 'Details', 'Legacy'];

  return (
    <nav
      className="fixed top-0 left-0 w-full px-5 py-5 md:px-[52px] md:py-6 flex items-center justify-between"
      style={{
        zIndex: 900,
        background: 'linear-gradient(180deg, rgba(7,7,7,0.95) 0%, transparent 100%)',
      }}
    >
      <a href="#" className="font-display text-xl md:text-2xl tracking-[0.28em] text-tb-white">
        THUNDER<span className="brass-text">⚡</span>BOLT
      </a>
      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="font-condensed font-semibold text-[0.72rem] tracking-[0.20em] uppercase text-sv-mid hover:text-brass-bright transition-colors duration-200"
          >
            {link}
          </a>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
