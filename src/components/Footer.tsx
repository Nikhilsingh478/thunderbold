import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, ArrowRight, Plus } from 'lucide-react';
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
    className="group inline-flex items-center gap-1.5 font-condensed text-[0.76rem] tracking-[0.12em] uppercase text-white/75 hover:text-white transition-all duration-300"
  >
    <span className="w-0 group-hover:w-2 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
    {children}
  </Link>
);

const FooterBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="group inline-flex items-center gap-1.5 font-condensed text-[0.76rem] tracking-[0.12em] uppercase text-white/75 hover:text-white transition-all duration-300 text-left"
  >
    <span className="w-0 group-hover:w-2.5 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
    {children}
  </button>
);

const ColHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    <p className="font-condensed text-[0.72rem] tracking-[0.3em] uppercase text-white/95 font-bold">{children}</p>
  </div>
);

const QuickLinksList = () => (
  <ul className="space-y-2.5">
    {quickLinks.map(l => (
      <li key={l.label}><FooterLink to={l.to}>{l.label}</FooterLink></li>
    ))}
  </ul>
);

const SupportList = () => (
  <ul className="space-y-2.5">
    {supportLinks.map(l => (
      <li key={l.label}><FooterLink to={l.to}>{l.label}</FooterLink></li>
    ))}
    <li>
      <a
        href="mailto:adminthunderbold@gmail.com"
        className="group inline-flex items-center gap-1.5 font-condensed text-[0.76rem] tracking-[0.12em] uppercase text-white/75 hover:text-white transition-all duration-300"
      >
        <span className="w-0 group-hover:w-2 h-px bg-brass transition-all duration-300 ease-out shrink-0" />
        Contact Us
      </a>
    </li>
  </ul>
);

const PoliciesList = ({ onSelect }: { onSelect: (p: PolicyType) => void }) => (
  <ul className="space-y-2.5">
    <li><FooterBtn onClick={() => onSelect('privacy')}>Privacy Policy</FooterBtn></li>
    <li><FooterBtn onClick={() => onSelect('terms')}>Terms & Conditions</FooterBtn></li>
    <li><FooterBtn onClick={() => onSelect('returns')}>Returns & Cancellation</FooterBtn></li>
  </ul>
);

const ContactBlock = () => (
  <address className="not-italic space-y-2.5 font-condensed text-[0.76rem] tracking-[0.06em] text-white/60 uppercase">
    <p className="leading-relaxed">
      Matrabhumi Circle,<br />
      Near Ring Road,<br />
      Bhusawal – 425201, India
    </p>
    <p>
      <a href="mailto:adminthunderbold@gmail.com" className="hover:text-white transition-colors duration-200">
        adminthunderbold@gmail.com
      </a>
    </p>
    <p>
      <a href="tel:+919561172681" className="hover:text-white transition-colors duration-200">
        +91 95611 72681
      </a>
    </p>
  </address>
);

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  return (
    <>
      <footer className="bg-[#080808] border-t border-white/[0.05] pt-16 md:pt-24 pb-8 px-6 md:px-[52px]">
        <div className="max-w-[1200px] mx-auto space-y-12">
          
          {/* Main Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 md:gap-12">
            
            {/* Column 1: Brand & Socials */}
            <div className="col-span-2 lg:col-span-4 space-y-6">
              <div className="space-y-2">
                <span className="font-display text-2xl md:text-3xl tracking-[0.22em] text-tb-white block">
                  THUNDER<span className="brass-text font-bold">BOLD</span>
                </span>
                <span className="font-condensed text-[0.62rem] tracking-[0.14em] uppercase text-white/45 block">
                  Curated Fashion & Streetwear
                </span>
              </div>
              
              <div className="flex gap-4 items-center">
                <a
                  href="https://www.instagram.com/thunderbold.shop?igsh=MXM5dnFvMW45Z2Fh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-condensed text-[0.72rem] tracking-[0.16em] uppercase text-white/60 hover:text-white transition-all duration-300"
                >
                  Instagram
                </a>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <a
                  href="https://wa.me/919561172681"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-condensed text-[0.72rem] tracking-[0.16em] uppercase text-white/60 hover:text-white transition-all duration-300"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Column 2: Explore */}
            <div className="col-span-1 lg:col-span-2">
              <ColHeading>Explore</ColHeading>
              <QuickLinksList />
            </div>

            {/* Column 3: Support */}
            <div className="col-span-1 lg:col-span-2">
              <ColHeading>Support</ColHeading>
              <SupportList />
            </div>

            {/* Column 4: Policies */}
            <div className="col-span-1 lg:col-span-2">
              <ColHeading>Policies</ColHeading>
              <PoliciesList onSelect={setActivePolicy} />
            </div>

            {/* Column 5: Contact */}
            <div className="col-span-1 lg:col-span-2">
              <ColHeading>Contact</ColHeading>
              <ContactBlock />
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/[0.05] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-condensed text-[0.62rem] tracking-[0.16em] uppercase text-white/60 text-center sm:text-left">
              © 2026 ThunderBold Private Limited. All rights reserved.
            </span>
            <div className="flex items-center gap-3">
              <Shield className="w-3.25 h-3.25 text-brass/80" />
              <span className="font-condensed text-[0.62rem] tracking-[0.14em] uppercase text-white/60">
                UPI / CARD / COD ACCEPTED
              </span>
            </div>
          </div>

          {/* Giant background brand watermark */}
          <div className="relative select-none pointer-events-none text-center overflow-hidden">
            <span
              className="font-display text-[5.5rem] sm:text-[9rem] md:text-[12rem] leading-none tracking-[0.16em] uppercase select-none opacity-20 block translate-y-4"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1.2px rgba(255,255,255,0.015)',
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
