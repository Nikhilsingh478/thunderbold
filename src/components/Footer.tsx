import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Instagram, ArrowRight, Mail, Phone, MapPin, Plus, Send } from 'lucide-react';
import { policyData } from '../lib/policyContent';

type PolicyType = 'returns' | 'privacy' | 'terms' | null;

function PolicyModal({ type, onClose }: { type: PolicyType; onClose: () => void }) {
  if (!type) return null;

  const found = policyData.find(p => p.id === type);
  if (!found) return null;
  const { title, subtitle, sections } = found;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 py-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-[#0f0f0f] border border-white/[0.12] rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-7 pt-7 pb-5 border-b border-white/[0.08]">
          <div className="pr-10">
            <p className="font-condensed text-[0.65rem] tracking-[0.25em] uppercase text-brass mb-2">{subtitle}</p>
            <h2 className="font-display text-2xl tracking-[0.06em] uppercase text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-7 right-6 flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 max-h-[62vh] overflow-y-auto space-y-0 scrollbar-thin">
          {sections.map((sec, i) => (
            <div
              key={i}
              className={`py-5 ${i < sections.length - 1 ? 'border-b border-white/[0.06]' : ''} ${sec.highlight ? 'bg-brass/[0.04] -mx-7 px-7 rounded-none' : ''}`}
            >
              <div className="flex items-start gap-3 mb-2.5">
                <span className="shrink-0 mt-0.5 font-condensed text-[0.6rem] tracking-[0.2em] text-brass/70 tabular-nums pt-[3px]">0{i + 1}</span>
                <h3 className="font-condensed text-[0.75rem] tracking-[0.2em] uppercase text-white font-semibold">{sec.heading}</h3>
              </div>
              <p className="font-serif font-light text-sm leading-[1.75] text-white/60 pl-6">
                {sec.text}
              </p>
              {sec.list && (
                <ul className="mt-3 pl-6 space-y-1.5">
                  {sec.list.map(item => (
                    <li key={item} className="flex items-start gap-2 font-serif font-light text-sm text-white/60">
                      <span className="text-brass shrink-0 mt-1">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="px-7 py-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <span className="font-condensed text-[0.65rem] tracking-[0.18em] uppercase text-white/30">Thunderbold · 2026</span>
          <button
            onClick={onClose}
            className="font-condensed text-[0.7rem] tracking-[0.18em] uppercase text-brass hover:text-white transition-colors duration-200 flex items-center gap-1.5"
          >
            Close <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop Categories', to: '/#categories' },
  { label: 'Featured Brands', to: '/brands' },
  { label: 'About Us', to: '/about' },
];

const supportLinks = [
  { label: 'Track My Order', to: '/orders' },
  { label: 'My Cart', to: '/cart' },
  { label: 'Wishlist', to: '/wishlist' },
];

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="group inline-flex items-center gap-1.5 font-condensed text-[0.76rem] tracking-[0.12em] uppercase text-white/55 hover:text-white transition-all duration-300"
  >
    <span className="w-0 group-hover:w-2 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
    {children}
  </Link>
);

const FooterBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="group inline-flex items-center gap-1.5 font-condensed text-[0.76rem] tracking-[0.12em] uppercase text-white/55 hover:text-white transition-all duration-300 text-left"
  >
    <span className="w-0 group-hover:w-2.5 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
    {children}
  </button>
);

const ColHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-5">
    <p className="font-condensed text-[0.72rem] tracking-[0.3em] uppercase text-white/90 font-bold">{children}</p>
    <div className="mt-2 w-5 h-[1.5px] bg-brass/80" />
  </div>
);

const QuickLinksList = () => (
  <ul className="space-y-3">
    {quickLinks.map(l => (
      <li key={l.label}><FooterLink to={l.to}>{l.label}</FooterLink></li>
    ))}
  </ul>
);

const SupportList = () => (
  <ul className="space-y-3">
    {supportLinks.map(l => (
      <li key={l.label}><FooterLink to={l.to}>{l.label}</FooterLink></li>
    ))}
    <li>
      <a
        href="mailto:adminthunderbold@gmail.com"
        className="group inline-flex items-center gap-1.5 font-condensed text-[0.76rem] tracking-[0.12em] uppercase text-white/55 hover:text-white transition-all duration-300"
      >
        <span className="w-0 group-hover:w-2 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
        Contact Us
      </a>
    </li>
  </ul>
);

const PoliciesList = ({ onSelect }: { onSelect: (p: PolicyType) => void }) => (
  <ul className="space-y-3">
    <li><FooterBtn onClick={() => onSelect('privacy')}>Privacy Policy</FooterBtn></li>
    <li><FooterBtn onClick={() => onSelect('terms')}>Terms & Conditions</FooterBtn></li>
    <li><FooterBtn onClick={() => onSelect('returns')}>Returns & Cancellation</FooterBtn></li>
  </ul>
);

const ContactBlock = () => (
  <address className="not-italic space-y-3.5">
    <div className="flex items-start gap-2.5">
      <MapPin className="w-3.5 h-3.5 text-brass/80 shrink-0 mt-0.5" />
      <p className="font-condensed text-[0.76rem] tracking-[0.06em] text-white/50 leading-relaxed uppercase">
        Matrabhumi Circle,<br />
        Near Ring Road,<br />
        Bhusawal – 425201, India
      </p>
    </div>
    <div className="flex items-center gap-2.5">
      <Mail className="w-3.5 h-3.5 text-brass/80 shrink-0" />
      <a
        href="mailto:adminthunderbold@gmail.com"
        className="font-condensed text-[0.76rem] tracking-[0.06em] text-white/55 hover:text-white transition-colors duration-200 uppercase"
      >
        adminthunderbold@gmail.com
      </a>
    </div>
    <div className="flex items-center gap-2.5">
      <Phone className="w-3.5 h-3.5 text-brass/80 shrink-0" />
      <a
        href="tel:+919561172681"
        className="font-condensed text-[0.76rem] tracking-[0.06em] text-white/55 hover:text-white transition-colors duration-200 uppercase"
      >
        +91 95611 72681
      </a>
    </div>
  </address>
);

function MobileAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.05]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4.5 group"
      >
        <span className="font-condensed text-[0.75rem] tracking-[0.25em] uppercase text-white/90 font-bold">
          {title}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-white/10 bg-white/[0.02] text-brass"
        >
          <Plus className="w-3 h-3" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  };

  return (
    <>
      <footer className="bg-[#080808] border-t border-white/[0.06] pt-12 md:pt-20 pb-0 px-6 md:px-[52px]">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Segment 1: Brand info & Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-white/[0.05] mb-12">
            <div className="lg:col-span-6 space-y-4">
              <span className="font-display text-2xl md:text-3xl tracking-[0.22em] text-tb-white block">
                THUNDER<span className="brass-text font-bold">BOLD</span>
              </span>
              <p className="font-condensed text-[0.74rem] tracking-[0.14em] uppercase text-sv-dim leading-relaxed max-w-sm">
                Curated Fashion & Streetwear. Elevating your daily rotation with exclusive designer labels and modern essentials.
              </p>
              
              {/* Social links */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://www.instagram.com/thunderbold.shop?igsh=MXM5dnFvMW45Z2Fh"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300 group"
                >
                  <Instagram className="w-3.75 h-3.75 transition-transform duration-300 group-hover:scale-110" />
                </a>
                <a
                  href="https://wa.me/919561172681"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300 group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.75 h-3.75 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <path d="M19.11 4.91A10.05 10.05 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.27-1.38a9.93 9.93 0 0 0 4.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.85-7zM12.05 20.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.22 8.22 0 0 1-1.27-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.55-3.7 8.23-8.23 8.23zm4.51-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.22-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42-.14 0-.31-.02-.47-.02-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.14-1.17-.06-.1-.22-.16-.47-.28z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <p className="font-condensed text-[0.74rem] uppercase tracking-[0.25em] text-brass font-bold">
                Subscribe for exclusive drops
              </p>
              <form onSubmit={handleSubscribe} className="flex max-w-md w-full gap-2 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL..."
                  required
                  disabled={subscribed}
                  className="flex-1 bg-white/[0.025] border border-white/10 hover:border-white/20 focus:border-brass/75 rounded-lg px-4 py-3 text-xs text-white placeholder:text-sv-dim/40 tracking-wider focus:outline-none transition-colors duration-300 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={subscribed}
                  className="bg-brass hover:bg-yellow-400 text-void font-condensed font-bold text-xs tracking-[0.15em] uppercase px-5 py-3 rounded-lg active:scale-95 transition-all duration-200 flex items-center justify-center min-w-[80px] disabled:bg-green-500/20 disabled:text-green-400"
                >
                  {subscribed ? 'Joined' : 'Join'}
                </button>
              </form>
              <p className="font-condensed text-[9px] uppercase tracking-wider text-sv-dim">
                Receive release updates, VIP discounts, and collections news.
              </p>
            </div>
          </div>

          {/* Segment 2: Navigation Links Grid */}
          {/* Mobile layout: Accordions */}
          <div className="sm:hidden pb-8">
            <div className="border-t border-white/[0.05]">
              <MobileAccordion title="Quick Links">
                <QuickLinksList />
              </MobileAccordion>
              <MobileAccordion title="Support">
                <SupportList />
              </MobileAccordion>
              <MobileAccordion title="Policies">
                <PoliciesList onSelect={setActivePolicy} />
              </MobileAccordion>
              <MobileAccordion title="Contact Info">
                <ContactBlock />
              </MobileAccordion>
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12">
            <div className="lg:col-span-3">
              <ColHeading>Quick Links</ColHeading>
              <QuickLinksList />
            </div>
            <div className="lg:col-span-3">
              <ColHeading>Support</ColHeading>
              <SupportList />
            </div>
            <div className="lg:col-span-3">
              <ColHeading>Policies</ColHeading>
              <PoliciesList onSelect={setActivePolicy} />
            </div>
            <div className="lg:col-span-3">
              <ColHeading>Contact Info</ColHeading>
              <ContactBlock />
            </div>
          </div>

          {/* Segment 3: Bottom Bar & Watermark */}
          <div className="border-t border-white/[0.05] py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 text-center sm:text-left">
              <span className="font-condensed text-[0.62rem] tracking-[0.16em] uppercase text-white/35">
                Copyright © 2026 ThunderBold Private Limited. All rights reserved.
              </span>
              <span className="font-condensed text-[0.58rem] tracking-[0.14em] uppercase text-white/20">
                Designed & Crafted for Premium Streetwear curation
              </span>
            </div>

            {/* Secure Checkout & Payments info */}
            <div className="flex flex-col items-center sm:items-end gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.015]">
                <Shield className="w-3.25 h-3.25 text-brass shrink-0" />
                <span className="font-condensed text-[0.58rem] tracking-[0.16em] uppercase text-white/40">Secure checkout system</span>
              </div>
              <span className="font-condensed text-[9px] uppercase tracking-[0.12em] text-sv-dim">
                Accepted: Card / UPI / Cash on Delivery
              </span>
            </div>
          </div>

          {/* Giant background brand watermark */}
          <div className="relative select-none pointer-events-none text-center overflow-hidden">
            <span
              className="font-display text-[5.5rem] sm:text-[9rem] md:text-[12rem] leading-none tracking-[0.16em] uppercase select-none opacity-20 block translate-y-4"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1.2px rgba(255,255,255,0.02)',
              }}
            >
              THUNDERBOLD
            </span>
          </div>

        </div>
      </footer>

      <AnimatePresence>
        {activePolicy && (
          <PolicyModal type={activePolicy} onClose={() => setActivePolicy(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
